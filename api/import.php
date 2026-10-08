<?php
/**
 * ============================================================
 * IMPORT — Import សិស្សពី CSV
 * ============================================================
 * 
 * POST /import.php
 * Body: FormData { file: csv_file }
 * 
 * CSV Columns (header row ត្រូវការ):
 *   - student_code  (required)
 *   - full_name     (required)
 *   - gender        (required, M/F)
 *   - cohort_name   (optional — auto-create បើមិនមាន)
 *   - entry_year_name (optional)
 *   - status        (optional — active/graduated/dropped/pending)
 *   - dob, phone, email, address (optional)
 *   - subject_codes (optional — comma-separated, e.g. "AND101,WEB01")
 */

require 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}
if (empty($_FILES['file']['tmp_name'])) {
    respond(['error' => 'សូមជ្រើស File'], 400);
}

$file = $_FILES['file']['tmp_name'];
$ext  = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ['csv', 'txt'])) {
    respond(['error' => 'File ត្រូវតែជា CSV'], 400);
}

// ============================================================
// អាន CSV
// ============================================================
$rows = [];
if (($handle = fopen($file, 'r')) !== false) {
    // រំលង BOM
    $bom = fread($handle, 3);
    if ($bom !== "\xEF\xBB\xBF") rewind($handle);
    
    while (($data = fgetcsv($handle, 0, ',')) !== false) {
        $rows[] = $data;
    }
    fclose($handle);
}

if (count($rows) < 2) respond(['error' => 'File ទំនេរ ឬមិនត្រឹមត្រូវ'], 400);

// ============================================================
// Header → Column Index
// ============================================================
$header = array_map('trim', $rows[0]);
$colIdx = [];
foreach ($header as $i => $col) {
    $colIdx[strtolower($col)] = $i;
}

// ពិនិត្យ column ចាំបាច់
foreach (['student_code', 'full_name', 'gender'] as $r) {
    if (!isset($colIdx[$r])) respond(['error' => "ខ្វះ Column: $r"], 400);
}

// ============================================================
// Preload Maps
// ============================================================
$cohortMap = [];
foreach ($pdo->query("SELECT id, cohort_name FROM cohorts")->fetchAll() as $c) {
    $cohortMap[mb_strtolower(trim($c['cohort_name']), 'UTF-8')] = (int)$c['id'];
}

$yearMap = [];
foreach ($pdo->query("SELECT id, year_name FROM academic_years")->fetchAll() as $y) {
    $yearMap[strtolower(trim($y['year_name']))] = (int)$y['id'];
}

$subjMap = [];
foreach ($pdo->query("SELECT id, subject_code FROM subjects")->fetchAll() as $s) {
    $subjMap[strtoupper($s['subject_code'])] = (int)$s['id'];
}

// ============================================================
// Counters
// ============================================================
$imported       = 0;
$updated        = 0;
$enrolled       = 0;
$errors         = [];
$createdCohorts = [];

$pdo->beginTransaction();
try {
    // Prepared statements
    $insertStu = $pdo->prepare(
        "INSERT INTO students 
         (student_code, full_name, gender, cohort_id, entry_year_id, 
          status, dob, phone, email, address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $updateStu = $pdo->prepare(
        "UPDATE students SET 
            full_name = ?, gender = ?, cohort_id = ?, entry_year_id = ?, 
            status = ?, dob = ?, phone = ?, email = ?, address = ?
         WHERE student_code = ?"
    );
    $findStu = $pdo->prepare("SELECT id FROM students WHERE student_code = ?");
    $enrollStmt = $pdo->prepare(
        "INSERT INTO enrollments (student_id, subject_id) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE is_active = 1"
    );
    $createCohort = $pdo->prepare(
        "INSERT INTO cohorts (cohort_name) VALUES (?)"
    );
    
    // ============================================================
    // Process Rows
    // ============================================================
    foreach (array_slice($rows, 1) as $idx => $row) {
        if (empty(array_filter($row))) continue;
        
        // Helper ទាញតម្លៃ
        $get = function ($key) use ($colIdx, $row) {
            $i = $colIdx[$key] ?? -1;
            return ($i >= 0 && isset($row[$i])) ? trim($row[$i]) : '';
        };
        
        $code          = $get('student_code');
        $name          = $get('full_name');
        $gender        = strtoupper($get('gender'));
        $cohortName    = $get('cohort_name');
        $yearName      = $get('entry_year_name');
        $status        = strtolower($get('status')) ?: 'active';
        $dob           = $get('dob');
        $phone         = $get('phone');
        $email         = $get('email');
        $address       = $get('address');
        $subjCodes     = $get('subject_codes');
        
        // Validation
        if (empty($code) || empty($name)) {
            $errors[] = "ជួរទី " . ($idx + 2) . ": ខ្វះលេខកូដ ឬឈ្មោះ";
            continue;
        }
        if (!in_array($gender, ['M', 'F'])) $gender = 'M';
        if (empty($dob) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dob)) $dob = null;
        if (!in_array($status, ['active', 'graduated', 'dropped', 'pending'])) $status = 'active';
        
        // ជំនាន់ — Auto-create បើមិនមាន
        $cohortId = null;
        if ($cohortName) {
            $key = mb_strtolower($cohortName, 'UTF-8');
            if (isset($cohortMap[$key])) {
                $cohortId = $cohortMap[$key];
            } else {
                $createCohort->execute([$cohortName]);
                $cohortId = (int)$pdo->lastInsertId();
                $cohortMap[$key] = $cohortId;
                $createdCohorts[] = $cohortName;
            }
        }
        
        // ឆ្នាំ
        $yearId = null;
        if ($yearName) {
            $key = strtolower($yearName);
            if (isset($yearMap[$key])) $yearId = $yearMap[$key];
        }
        
        // Insert ឬ Update
        $findStu->execute([$code]);
        $existing = $findStu->fetch();
        
        if ($existing) {
            $updateStu->execute([
                $name, $gender, $cohortId, $yearId, $status, 
                $dob, $phone, $email, $address, $code,
            ]);
            $studentId = (int)$existing['id'];
            $updated++;
        } else {
            $insertStu->execute([
                $code, $name, $gender, $cohortId, $yearId, $status, 
                $dob, $phone, $email, $address,
            ]);
            $studentId = (int)$pdo->lastInsertId();
            $imported++;
        }
        
        // Enroll subjects
        if (!empty($subjCodes)) {
            $codes = preg_split('/[,;|]+/', $subjCodes);
            foreach ($codes as $sc) {
                $sc = strtoupper(trim($sc));
                if (empty($sc)) continue;
                if (isset($subjMap[$sc])) {
                    $enrollStmt->execute([$studentId, $subjMap[$sc]]);
                    $enrolled++;
                }
            }
        }
    }
    
    $pdo->commit();
    
    $msg = "✅ Import ជោគជ័យ: ថ្មី {$imported} · Update {$updated} · Enroll {$enrolled}";
    if ($createdCohorts) {
        $msg .= " · ជំនាន់ថ្មី: " . implode(', ', $createdCohorts);
    }
    
    respond([
        'success'  => true,
        'imported' => $imported,
        'updated'  => $updated,
        'enrolled' => $enrolled,
        'errors'   => $errors,
        'message'  => $msg,
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['error' => $e->getMessage()], 500);
}
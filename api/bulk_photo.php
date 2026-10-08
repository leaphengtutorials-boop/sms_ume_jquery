<?php
/**
 * ============================================================
 * BULK PHOTO — Upload រូបថតច្រើន (Match តាម student_code)
 * ============================================================
 * 
 * Upload ច្រើន file ក្នុងពេលតែមួយ ។
 * File name = student_code (ឧ. S001.jpg → match S001)
 * 
 * POST /bulk_photo.php
 * Body: FormData { photos[]: [...] }
 * 
 * Response: { success, uploaded, errors[], message }
 */

require 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

if (empty($_FILES['photos']) || empty($_FILES['photos']['name'][0])) {
    respond(['error' => 'សូមជ្រើស File រូបថត'], 400);
}

// ============================================================
// Folder
// ============================================================
$dir = __DIR__ . '/../uploads/';
if (!is_dir($dir)) mkdir($dir, 0777, true);

// ============================================================
// Process Files
// ============================================================
$uploaded = 0;
$errors   = [];
$files    = $_FILES['photos'];
$count    = count($files['name']);

// Prepare statements
$findStmt = $pdo->prepare(
    "SELECT id, photo FROM students WHERE UPPER(student_code) = ?"
);
$updateStmt = $pdo->prepare(
    "UPDATE students SET photo = ? WHERE id = ?"
);

for ($i = 0; $i < $count; $i++) {
    // រំលង file ដែល error
    if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
    
    $originalName = $files['name'][$i];
    $tmpName      = $files['tmp_name'][$i];
    
    // ស្រង់ student_code ពី filename
    $studentCode = strtoupper(pathinfo($originalName, PATHINFO_FILENAME));
    $studentCode = preg_replace('/[^A-Z0-9]/', '', $studentCode);
    
    // ស្វែងរកសិស្ស
    $findStmt->execute([$studentCode]);
    $student = $findStmt->fetch();
    
    if (!$student) {
        $errors[] = "$originalName: រកមិនឃើញសិស្ស (code: $studentCode)";
        continue;
    }
    
    // ពិនិត្យ file type
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
        $errors[] = "$originalName: File មិនត្រឹមត្រូវ";
        continue;
    }
    
    // Upload
    $newName = 'stu_' . $student['id'] . '_' . time() . '_' . rand(100, 999) . '.' . $ext;
    if (!move_uploaded_file($tmpName, $dir . $newName)) {
        $errors[] = "$originalName: Upload បរាជ័យ";
        continue;
    }
    
    // លុបរូបថតចាស់
    if ($student['photo'] && file_exists(__DIR__ . '/../' . $student['photo'])) {
        @unlink(__DIR__ . '/../' . $student['photo']);
    }
    
    // Update DB
    $photoPath = 'uploads/' . $newName;
    $updateStmt->execute([$photoPath, $student['id']]);
    $uploaded++;
}

respond([
    'success'  => true,
    'uploaded' => $uploaded,
    'errors'   => $errors,
    'message'  => "✅ Upload រូបថត {$uploaded} ជោគជ័យ",
]);
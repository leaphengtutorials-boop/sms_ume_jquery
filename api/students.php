<?php
/**
 * ============================================================
 * STUDENTS — គ្រប់គ្រងសិស្ស
 * ============================================================
 * 
 * Endpoints:
 *   GET    /students.php                    → បញ្ជី (filter)
 *   GET    /students.php?id=X               → សិស្សតែមួយ
 *   POST   /students.php                    → បង្កើត (support photo)
 *   PUT    /students.php                    → កែ
 *   DELETE /students.php?id=X               → លុប
 *   PATCH  /students.php                    → Bulk status update
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET
// ============================================================
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare(
            "SELECT st.*, c.cohort_name, y.year_name AS entry_year_name
             FROM students st
             LEFT JOIN cohorts c ON st.cohort_id = c.id
             LEFT JOIN academic_years y ON st.entry_year_id = y.id
             WHERE st.id = ?"
        );
        $stmt->execute([(int)$_GET['id']]);
        respond($stmt->fetch() ?: ['error' => 'រកមិនឃើញ']);
    }

    $sql = "SELECT st.*, c.cohort_name, y.year_name AS entry_year_name
            FROM students st
            LEFT JOIN cohorts c ON st.cohort_id = c.id
            LEFT JOIN academic_years y ON st.entry_year_id = y.id
            WHERE 1 = 1";
    $params = [];

    if (!empty($_GET['search'])) {
        $sql .= " AND (st.student_code LIKE ? OR st.full_name LIKE ? OR st.phone LIKE ?)";
        $q = '%' . $_GET['search'] . '%';
        $params[] = $q;
        $params[] = $q;
        $params[] = $q;
    }
    if (!empty($_GET['status']))        { $sql .= " AND st.status = ?";         $params[] = $_GET['status']; }
    if (!empty($_GET['cohort_id']))     { $sql .= " AND st.cohort_id = ?";      $params[] = (int)$_GET['cohort_id']; }
    if (!empty($_GET['entry_year_id'])) { $sql .= " AND st.entry_year_id = ?";  $params[] = (int)$_GET['entry_year_id']; }

    $sql .= " ORDER BY st.student_code";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $students = $stmt->fetchAll();

    // ✅ បន្ថែម subjects array (subject IDs ដែលសិស្សកំពុងរៀន)
    foreach ($students as &$stu) {
        $subjQ = $pdo->prepare(
            "SELECT subject_id FROM enrollments 
             WHERE student_id = ? AND status = 'active'"
        );
        $subjQ->execute([$stu['id']]);
        $stu['subjects'] = array_map(
            fn($r) => (int)$r['subject_id'],
            $subjQ->fetchAll()
        );
    }
    unset($stu);

    respond($students);
}

// ============================================================
// POST — បង្កើតសិស្សថ្មី (គាំទ្រ photo upload)
// ============================================================
if ($method === 'POST') {
    $d = $_POST ?: input();
    $photo = null;
    
    // Upload photo បើមាន
    if (!empty($_FILES['photo']['name'])) {
        $dir = __DIR__ . '/../uploads/';
        if (!is_dir($dir)) mkdir($dir, 0777, true);
        
        $ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $name = 'stu_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
            if (move_uploaded_file($_FILES['photo']['tmp_name'], $dir . $name)) {
                $photo = 'uploads/' . $name;
            }
        }
    }
    
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO students 
             (student_code, full_name, gender, cohort_id, entry_year_id, 
              status, dob, photo, phone, email, address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $d['student_code'],
            $d['full_name'],
            $d['gender'],
            !empty($d['cohort_id'])     ? (int)$d['cohort_id']     : null,
            !empty($d['entry_year_id']) ? (int)$d['entry_year_id'] : null,
            $d['status'] ?? 'active',
            !empty($d['dob']) ? $d['dob'] : null,
            $photo,
            $d['phone'] ?? null,
            $d['email'] ?? null,
            $d['address'] ?? null,
        ]);
        
        respond([
            'success' => true,
            'id'      => (int)$pdo->lastInsertId(),
            'message' => '✅ បង្កើតសិស្សជោគជ័យ',
        ], 201);
    } catch (Exception $e) {
        respond(['error' => $e->getMessage()], 400);
    }
}

// ============================================================
// PUT — កែព័ត៌មានសិស្ស
// ============================================================
if ($method === 'PUT') {
    $d = input();
    $stmt = $pdo->prepare(
        "UPDATE students SET 
            full_name = ?, gender = ?, cohort_id = ?, entry_year_id = ?, 
            status = ?, dob = ?, phone = ?, email = ?, address = ?
         WHERE id = ?"
    );
    $stmt->execute([
        $d['full_name'],
        $d['gender'],
        !empty($d['cohort_id'])     ? (int)$d['cohort_id']     : null,
        !empty($d['entry_year_id']) ? (int)$d['entry_year_id'] : null,
        $d['status'] ?? 'active',
        !empty($d['dob']) ? $d['dob'] : null,
        $d['phone'] ?? null,
        $d['email'] ?? null,
        $d['address'] ?? null,
        (int)$d['id'],
    ]);
    respond(['success' => true, 'message' => '✅ កែជោគជ័យ']);
}

// ============================================================
// DELETE — លុបសិស្ស + លុបរូបថត
// ============================================================
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) respond(['error' => 'ខ្វះ id'], 400);
    
    // លុបរូបថតចាស់
    $stmt = $pdo->prepare("SELECT photo FROM students WHERE id = ?");
    $stmt->execute([$id]);
    $stu = $stmt->fetch();
    if ($stu && $stu['photo'] && file_exists(__DIR__ . '/../' . $stu['photo'])) {
        @unlink(__DIR__ . '/../' . $stu['photo']);
    }
    
    $pdo->prepare("DELETE FROM students WHERE id = ?")->execute([$id]);
    respond(['success' => true, 'message' => '✅ លុបជោគជ័យ']);
}

// ============================================================
// PATCH — Bulk status update
// Body: { ids: [1,2,3], status: 'graduated' }
// ============================================================
if ($method === 'PATCH') {
    $d = input();
    $ids = $d['ids'] ?? [];
    $status = $d['status'] ?? 'active';
    
    if (empty($ids) || !in_array($status, ['active', 'graduated', 'dropped'])) {
        respond(['error' => 'ទិន្នន័យមិនត្រឹមត្រូវ'], 400);
    }
    
    $place = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("UPDATE students SET status = ? WHERE id IN ($place)");
    $stmt->execute(array_merge([$status], array_map('intval', $ids)));
    
    respond([
        'success' => true,
        'count'   => $stmt->rowCount(),
        'message' => "✅ កែស្ថានភាព " . $stmt->rowCount() . " នាក់",
    ]);
}

respond(['error' => 'Method not allowed'], 405);
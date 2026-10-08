<?php
/**
 * ============================================================
 * SUBJECTS — មុខវិជ្ជា + Study Year + Semester
 * ============================================================
 */

require 'config.php';
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    if (isset($_GET['id'])) {
        $s = $pdo->prepare("SELECT * FROM subjects WHERE id = ?");
        $s->execute([(int) $_GET['id']]);
        respond($s->fetch() ?: ['error' => 'រកមិនឃើញ']);
    }

    $sql = "SELECT s.*, y.year_name, u.full_name AS teacher_name,
            (SELECT COUNT(*) FROM enrollments 
             WHERE subject_id = s.id AND is_active = 1 AND status = 'active') AS student_count,
            (SELECT COUNT(*) FROM enrollments 
             WHERE subject_id = s.id AND status = 'completed') AS completed_count,
            -- ✅ ជំនាន់ដែលរៀនមុខវិជ្ជានេះ
            (SELECT GROUP_CONCAT(DISTINCT c.cohort_name SEPARATOR ', ') 
             FROM enrollments e2
             JOIN students st2 ON e2.student_id = st2.id
             LEFT JOIN cohorts c ON st2.cohort_id = c.id
             WHERE e2.subject_id = s.id 
             AND c.cohort_name IS NOT NULL) AS cohorts_info
            FROM subjects s
            LEFT JOIN academic_years y ON s.academic_year_id = y.id
            LEFT JOIN users u ON s.teacher_id = u.id
            WHERE 1 = 1";
    $p = [];

    if (!empty($_GET['year_id'])) {
        $sql .= " AND s.academic_year_id = ?";
        $p[] = (int) $_GET['year_id'];
    }
    if (!empty($_GET['study_year'])) {
        $sql .= " AND s.study_year = ?";
        $p[] = (int) $_GET['study_year'];
    }
    if (!empty($_GET['semester'])) {
        $sql .= " AND s.semester = ?";
        $p[] = (int) $_GET['semester'];
    }

    // ✅ បង្ហាញតែមុខវិជ្ជាឆ្នាំ Active
    if (!empty($_GET['current_only'])) {
        $sql .= " AND s.academic_year_id IN (
            SELECT id FROM academic_years WHERE is_active = 1
        )";
    }

    // ✅ Filter តាមជំនាន់ (មុខវិជ្ជាដែលមានសិស្សជំនាន់នោះរៀន)
    if (!empty($_GET['cohort_id'])) {
        $sql .= " AND EXISTS (
            SELECT 1 FROM enrollments e2 
            JOIN students st2 ON e2.student_id = st2.id
            WHERE e2.subject_id = s.id 
            AND st2.cohort_id = ?
        )";
        $p[] = (int) $_GET['cohort_id'];
    }

    if (!empty($_GET['search'])) {
        $sql .= " AND (s.subject_code LIKE ? OR s.subject_name LIKE ?)";
        $p[] = '%' . $_GET['search'] . '%';
        $p[] = '%' . $_GET['search'] . '%';
    }
    $sql .= " ORDER BY s.study_year, s.semester, s.id DESC";

    $s = $pdo->prepare($sql);
    $s->execute($p);
    respond($s->fetchAll());
}

if ($m === 'POST') {
    $d = input();
    $pdo->beginTransaction();
    try {
        $s = $pdo->prepare("INSERT INTO subjects 
            (subject_code, subject_name, academic_year_id, study_year, semester, 
             teacher_id, total_weeks, description, is_active) 
            VALUES (?,?,?,?,?,?,?,?,?)");
        $s->execute([
            $d['subject_code'],
            $d['subject_name'],
            (int) $d['academic_year_id'],
            (int) ($d['study_year'] ?? 1),
            (int) ($d['semester'] ?? 1),
            !empty($d['teacher_id']) ? (int) $d['teacher_id'] : null,
            (int) ($d['total_weeks'] ?? 15),
            $d['description'] ?? '',
            1,
        ]);
        $sid = (int) $pdo->lastInsertId();
        $pdo->prepare("INSERT INTO weights (subject_id) VALUES (?)")->execute([$sid]);
        $pdo->prepare("INSERT INTO attendance_rules (subject_id) VALUES (?)")->execute([$sid]);
        $pdo->commit();
        respond(['success' => true, 'id' => $sid], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 400);
    }
}

if ($m === 'PUT') {
    $d = input();
    $s = $pdo->prepare("UPDATE subjects SET 
        subject_code=?, subject_name=?, academic_year_id=?, study_year=?, semester=?,
        teacher_id=?, total_weeks=?, description=?, is_active=? 
        WHERE id=?");
    $s->execute([
        $d['subject_code'],
        $d['subject_name'],
        (int) $d['academic_year_id'],
        (int) ($d['study_year'] ?? 1),
        (int) ($d['semester'] ?? 1),
        !empty($d['teacher_id']) ? (int) $d['teacher_id'] : null,
        (int) ($d['total_weeks'] ?? 15),
        $d['description'] ?? '',
        (int) ($d['is_active'] ?? 1),
        (int) $d['id'],
    ]);
    respond(['success' => true]);
}

if ($m === 'DELETE') {
    $pdo->prepare("DELETE FROM subjects WHERE id=?")->execute([(int) $_GET['id']]);
    respond(['success' => true]);
}
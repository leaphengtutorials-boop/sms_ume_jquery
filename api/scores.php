<?php
/**
 * ============================================================
 * SCORES — ពិន្ទុ Midterm
 * ============================================================
 * 
 * Endpoints:
 *   GET  /scores.php?subject_id=X&type=midterm    → បញ្ជីសិស្ស + ពិន្ទុ
 *   POST /scores.php                              → រក្សាទុកពិន្ទុ
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET — បញ្ជីសិស្ស + ពិន្ទុ
// ============================================================
if ($method === 'GET') {
    $subject_id = (int)($_GET['subject_id'] ?? 0);
    if (!$subject_id) respond(['error' => 'ខ្វះ subject_id'], 400);
    
    $search     = trim($_GET['search'] ?? '');
    $score_type = $_GET['type'] ?? 'midterm';
    
    // បញ្ជីសិស្ស (តែ active)
    $sql = "SELECT st.id AS student_id, st.student_code, st.full_name, 
                st.gender, st.photo
            FROM enrollments e
            JOIN students st ON e.student_id = st.id
            WHERE e.subject_id = ? AND e.is_active = 1 AND e.status = 'active'";
    $params = [$subject_id];
    
    if ($search) {
        $sql .= " AND (st.student_code LIKE ? OR st.full_name LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    if (!empty($_GET['cohort_id'])) {
        $sql .= " AND st.cohort_id = ?";
        $params[] = (int)$_GET['cohort_id'];
    }
    if (!empty($_GET['entry_year_id'])) {
        $sql .= " AND st.entry_year_id = ?";
        $params[] = (int)$_GET['entry_year_id'];
    }
    $sql .= " ORDER BY st.student_code";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $students = $stmt->fetchAll();
    
    // ទាញពិន្ទុដែលមានស្រាប់
    $sc = $pdo->prepare(
        "SELECT student_id, score FROM scores 
         WHERE subject_id = ? AND score_type = ?"
    );
    $sc->execute([$subject_id, $score_type]);
    $scoresMap = [];
    foreach ($sc->fetchAll() as $row) {
        $scoresMap[$row['student_id']] = (float)$row['score'];
    }
    
    respond([
        'students' => $students,
        'scores'   => $scoresMap,
    ]);
}

// ============================================================
// POST — រក្សាទុកពិន្ទុ Midterm
// Body: { subject_id, score_type: 'midterm', title, exam_date, records: [{student_id, score}] }
// ============================================================
if ($method === 'POST') {
    $d = input();
    
    if (empty($d['records']) || empty($d['subject_id']) || empty($d['score_type'])) {
        respond(['error' => 'ខ្វះទិន្នន័យ'], 400);
    }
    
    if (!in_array($d['score_type'], ['midterm', 'final'])) {
        respond(['error' => 'ប្រភេទពិន្ទុមិនត្រឹមត្រូវ'], 400);
    }
    
    $pdo->beginTransaction();
    try {
        // លុបពិន្ទុចាស់
        $pdo->prepare(
            "DELETE FROM scores WHERE subject_id = ? AND score_type = ?"
        )->execute([(int)$d['subject_id'], $d['score_type']]);
        
        // Insert ថ្មី
        $stmt = $pdo->prepare(
            "INSERT INTO scores 
             (subject_id, student_id, score_type, title, score, max_score, exam_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        
        foreach ($d['records'] as $rec) {
            $stmt->execute([
                (int)$d['subject_id'],
                (int)$rec['student_id'],
                $d['score_type'],
                $d['title'] ?? ucfirst($d['score_type']) . ' Exam',
                (float)$rec['score'],
                100,
                !empty($d['exam_date']) ? $d['exam_date'] : null,
            ]);
        }
        
        $pdo->commit();
        respond([
            'success' => true,
            'count'   => count($d['records']),
            'message' => '✅ រក្សាទុកពិន្ទុជោគជ័យ',
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 500);
    }
}

respond(['error' => 'Method not allowed'], 405);
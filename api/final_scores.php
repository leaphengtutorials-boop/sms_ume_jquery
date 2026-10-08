<?php
/**
 * ============================================================
 * FINAL SCORES — ពិន្ទុ Final (ការិយាល័យបញ្ចូល)
 * ============================================================
 * 
 * Endpoints:
 *   GET    /final_scores.php?subject_id=X    → បញ្ជីសិស្ស + ពិន្ទុ
 *   POST   /final_scores.php                  → រក្សាទុកពិន្ទុ
 *   DELETE /final_scores.php?subject_id=X     → លុបពិន្ទុ Final ទាំងអស់
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET
// ============================================================
if ($method === 'GET') {
    $subject_id = (int)($_GET['subject_id'] ?? 0);
    if (!$subject_id) respond(['error' => 'ខ្វះ subject_id'], 400);
    
    $sql = "SELECT st.id AS student_id, st.student_code, st.full_name, 
                st.gender, st.photo
            FROM enrollments e
            JOIN students st ON e.student_id = st.id
            WHERE e.subject_id = ? AND e.is_active = 1";
    $params = [$subject_id];
    
    if (!empty($_GET['search'])) {
        $sql .= " AND (st.student_code LIKE ? OR st.full_name LIKE ?)";
        $params[] = "%" . $_GET['search'] . "%";
        $params[] = "%" . $_GET['search'] . "%";
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
    
    // ទាញពិន្ទុ Final
    $sc = $pdo->prepare(
        "SELECT student_id, score FROM scores 
         WHERE subject_id = ? AND score_type = 'final'"
    );
    $sc->execute([$subject_id]);
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
// POST — រក្សាទុកពិន្ទុ Final
// Body: { subject_id, title, exam_date, records: [{student_id, score}] }
// ============================================================
if ($method === 'POST') {
    $d = input();
    
    if (empty($d['records']) || empty($d['subject_id'])) {
        respond(['error' => 'ខ្វះទិន្នន័យ'], 400);
    }
    
    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            "DELETE FROM scores WHERE subject_id = ? AND score_type = 'final'"
        )->execute([(int)$d['subject_id']]);
        
        $stmt = $pdo->prepare(
            "INSERT INTO scores 
             (subject_id, student_id, score_type, title, score, max_score, exam_date)
             VALUES (?, ?, 'final', ?, ?, 100, ?)"
        );
        
        foreach ($d['records'] as $rec) {
            $stmt->execute([
                (int)$d['subject_id'],
                (int)$rec['student_id'],
                $d['title'] ?? 'Final Exam',
                (float)$rec['score'],
                !empty($d['exam_date']) ? $d['exam_date'] : null,
            ]);
        }
        
        $pdo->commit();
        respond([
            'success' => true,
            'count'   => count($d['records']),
            'message' => '✅ រក្សាទុកពិន្ទុ Final ជោគជ័យ',
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 500);
    }
}

// ============================================================
// DELETE — លុបពិន្ទុ Final ទាំងអស់
// Query: ?subject_id=X
// ============================================================
if ($method === 'DELETE') {
    $subject_id = (int)($_GET['subject_id'] ?? 0);
    if (!$subject_id) respond(['error' => 'ខ្វះ subject_id'], 400);
    
    $stmt = $pdo->prepare(
        "DELETE FROM scores WHERE subject_id = ? AND score_type = 'final'"
    );
    $stmt->execute([$subject_id]);
    
    respond([
        'success' => true,
        'deleted' => $stmt->rowCount(),
        'message' => '✅ លុបពិន្ទុ Final ជោគជ័យ',
    ]);
}

respond(['error' => 'Method not allowed'], 405);
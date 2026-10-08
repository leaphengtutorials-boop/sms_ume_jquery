<?php
/**
 * ============================================================
 * WEIGHTS — ទម្ងន់ពិន្ទុ (ត្រូវតែ = 100%)
 * ============================================================
 * 
 * Endpoints:
 *   GET  /weights.php?subject_id=X    → ទម្ងន់របស់មុខវិជ្ជា
 *   POST /weights.php                  → រក្សាទុកទម្ងន់
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET
// ============================================================
if ($method === 'GET') {
    $subject_id = (int)($_GET['subject_id'] ?? 0);
    if (!$subject_id) respond(['error' => 'ខ្វះ subject_id'], 400);
    
    $stmt = $pdo->prepare("SELECT * FROM weights WHERE subject_id = ?");
    $stmt->execute([$subject_id]);
    $w = $stmt->fetch();
    
    // Auto-create បើមិនទាន់មាន
    if (!$w) {
        $pdo->prepare("INSERT INTO weights (subject_id) VALUES (?)")->execute([$subject_id]);
        $stmt->execute([$subject_id]);
        $w = $stmt->fetch();
    }
    
    respond($w);
}

// ============================================================
// POST — រក្សាទុកទម្ងន់ (validate ផលបូក = 100)
// Body: { subject_id, attendance_weight, homework_weight, quiz_weight, 
//         midterm_weight, assignment_weight, final_weight }
// ============================================================
if ($method === 'POST') {
    $d = input();
    $subject_id = (int)($d['subject_id'] ?? 0);
    if (!$subject_id) respond(['error' => 'ខ្វះ subject_id'], 400);
    
    // គណនាផលបូក
    $total = 
        ($d['attendance_weight'] ?? 0) +
        ($d['homework_weight'] ?? 0) +
        ($d['quiz_weight'] ?? 0) +
        ($d['midterm_weight'] ?? 0) +
        ($d['assignment_weight'] ?? 0) +
        ($d['final_weight'] ?? 0);
    
    if (abs($total - 100) > 0.01) {
        respond([
            'error' => "ផលបូកភាគរយត្រូវតែ = 100 (បច្ចុប្បន្ន: {$total})",
        ], 400);
    }
    
    $stmt = $pdo->prepare(
        "INSERT INTO weights 
         (subject_id, attendance_weight, homework_weight, quiz_weight, 
          midterm_weight, assignment_weight, final_weight)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            attendance_weight = VALUES(attendance_weight),
            homework_weight   = VALUES(homework_weight),
            quiz_weight       = VALUES(quiz_weight),
            midterm_weight    = VALUES(midterm_weight),
            assignment_weight = VALUES(assignment_weight),
            final_weight      = VALUES(final_weight)"
    );
    $stmt->execute([
        $subject_id,
        (float)$d['attendance_weight'],
        (float)$d['homework_weight'],
        (float)$d['quiz_weight'],
        (float)$d['midterm_weight'],
        (float)$d['assignment_weight'],
        (float)$d['final_weight'],
    ]);
    
    respond(['success' => true, 'message' => '✅ រក្សាទុកទម្ងន់ជោគជ័យ']);
}

respond(['error' => 'Method not allowed'], 405);
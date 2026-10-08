<?php
/**
 * ============================================================
 * RULES — ច្បាប់វត្តមាន
 * ============================================================
 * 
 * Endpoints:
 *   GET  /rules.php?subject_id=X    → ច្បាប់វត្តមាន
 *   POST /rules.php                  → រក្សាទុកច្បាប់
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET
// ============================================================
if ($method === 'GET') {
    $subject_id = (int)($_GET['subject_id'] ?? 0);
    if (!$subject_id) respond(['error' => 'ខ្វះ subject_id'], 400);
    
    $stmt = $pdo->prepare("SELECT * FROM attendance_rules WHERE subject_id = ?");
    $stmt->execute([$subject_id]);
    $r = $stmt->fetch();
    
    // Auto-create បើមិនទាន់មាន
    if (!$r) {
        $pdo->prepare(
            "INSERT INTO attendance_rules (subject_id) VALUES (?)"
        )->execute([$subject_id]);
        $stmt->execute([$subject_id]);
        $r = $stmt->fetch();
    }
    
    respond($r);
}

// ============================================================
// POST — រក្សាទុកច្បាប់វត្តមាន
// Body: { subject_id, present_score, late_deduction, absent_deduction, permission_deduction }
// ============================================================
if ($method === 'POST') {
    $d = input();
    $subject_id = (int)($d['subject_id'] ?? 0);
    if (!$subject_id) respond(['error' => 'ខ្វះ subject_id'], 400);
    
    $stmt = $pdo->prepare(
        "INSERT INTO attendance_rules 
         (subject_id, present_score, late_deduction, absent_deduction, permission_deduction)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            present_score        = VALUES(present_score),
            late_deduction       = VALUES(late_deduction),
            absent_deduction     = VALUES(absent_deduction),
            permission_deduction = VALUES(permission_deduction)"
    );
    $stmt->execute([
        $subject_id,
        (float)$d['present_score'],
        (float)$d['late_deduction'],
        (float)$d['absent_deduction'],
        (float)$d['permission_deduction'],
    ]);
    
    respond(['success' => true, 'message' => '✅ រក្សាទុកច្បាប់ជោគជ័យ']);
}

respond(['error' => 'Method not allowed'], 405);
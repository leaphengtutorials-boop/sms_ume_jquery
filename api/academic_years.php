<?php
/**
 * ============================================================
 * ACADEMIC YEARS — គ្រប់គ្រងឆ្នាំសិក្សា
 * ============================================================
 * 
 * Endpoints:
 *   GET    /academic_years.php              → បញ្ជីឆ្នាំទាំងអស់
 *   POST   /academic_years.php              → បង្កើតឆ្នាំថ្មី
 *   DELETE /academic_years.php?id=X         → លុបឆ្នាំ
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET — បញ្ជីឆ្នាំសិក្សា
// Sort តាម year_name DESC (ថ្មីបំផុតមុន)
// ============================================================
if ($method === 'GET') {
    $rows = $pdo->query(
        "SELECT * FROM academic_years ORDER BY year_name DESC"
    )->fetchAll();
    respond($rows);
}

// ============================================================
// POST — បង្កើតឆ្នាំថ្មី
// Body: { year_name, start_date, end_date }
// ============================================================
if ($method === 'POST') {
    $d = input();
    
    if (empty($d['year_name'])) {
        respond(['error' => 'ខ្វះឈ្មោះឆ្នាំ'], 400);
    }
    
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO academic_years (year_name, start_date, end_date) 
             VALUES (?, ?, ?)"
        );
        $stmt->execute([
            $d['year_name'],
            !empty($d['start_date']) ? $d['start_date'] : null,
            !empty($d['end_date'])   ? $d['end_date']   : null,
        ]);
        
        respond([
            'success' => true,
            'id'      => (int)$pdo->lastInsertId(),
            'message' => '✅ បង្កើតឆ្នាំជោគជ័យ',
        ], 201);
    } catch (Exception $e) {
        respond(['error' => 'ឈ្មោះស្ទួន ឬ Error: ' . $e->getMessage()], 400);
    }
}

// ============================================================
// DELETE — លុបឆ្នាំសិក្សា
// Query: ?id=X
// ============================================================
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) respond(['error' => 'ខ្វះ id'], 400);
    
    $pdo->prepare("DELETE FROM academic_years WHERE id = ?")->execute([$id]);
    respond(['success' => true, 'message' => '✅ លុបជោគជ័យ']);
}

respond(['error' => 'Method not allowed'], 405);
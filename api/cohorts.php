<?php
/**
 * ============================================================
 * COHORTS — គ្រប់គ្រងជំនាន់
 * ============================================================
 * 
 * Endpoints:
 *   GET    /cohorts.php                     → បញ្ជី + current cohort
 *   POST   /cohorts.php                     → បង្កើតជំនាន់ថ្មី
 *   PUT    /cohorts.php?id=X&set_current=1  → កំណត់ជា current
 *   PUT    /cohorts.php                     → កែព័ត៌មាន
 *   DELETE /cohorts.php?id=X                → លុបជំនាន់
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET — បញ្ជីជំនាន់ + current_cohort_id
// Response: { list: [...], current_cohort_id: N }
// ============================================================
if ($method === 'GET') {
    $list = $pdo->query(
        "SELECT * FROM cohorts ORDER BY id DESC"
    )->fetchAll();
    
    // រកជំនាន់ current
    $current = null;
    foreach ($list as $c) {
        if (!empty($c['is_current'])) {
            $current = (int)$c['id'];
            break;
        }
    }
    // Fallback: បើគ្មាន current → យកចុងក្រោយ
    if (!$current && !empty($list)) {
        $current = (int)$list[0]['id'];
    }
    
    respond([
        'list'              => $list,
        'current_cohort_id' => $current,
    ]);
}

// ============================================================
// POST — បង្កើតជំនាន់ថ្មី
// Body: { cohort_name, description, is_active }
// ============================================================
if ($method === 'POST') {
    $d = input();
    
    if (empty($d['cohort_name'])) {
        respond(['error' => 'ខ្វះឈ្មោះជំនាន់'], 400);
    }
    
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO cohorts (cohort_name, description, is_active) 
             VALUES (?, ?, ?)"
        );
        $stmt->execute([
            $d['cohort_name'],
            $d['description'] ?? null,
            (int)($d['is_active'] ?? 1),
        ]);
        
        respond([
            'success' => true,
            'id'      => (int)$pdo->lastInsertId(),
            'message' => '✅ បង្កើតជំនាន់ជោគជ័យ',
        ], 201);
    } catch (Exception $e) {
        respond(['error' => 'ឈ្មោះស្ទួន ឬ Error: ' . $e->getMessage()], 400);
    }
}

// ============================================================
// PUT — កែព័ត៌មាន ឬ កំណត់ជា current
// ============================================================
if ($method === 'PUT') {
    // Sub-route: កំណត់ជា current
    if (!empty($_GET['set_current'])) {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) respond(['error' => 'ខ្វះ id'], 400);
        
        $pdo->beginTransaction();
        try {
            $pdo->prepare("UPDATE cohorts SET is_current = 0")->execute();
            $pdo->prepare("UPDATE cohorts SET is_current = 1 WHERE id = ?")->execute([$id]);
            $pdo->commit();
            respond([
                'success' => true,
                'message' => '✅ កំណត់ជំនាន់បច្ចុប្បន្នជោគជ័យ',
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            respond(['error' => $e->getMessage()], 500);
        }
    }
    
    // កែព័ត៌មានជំនាន់
    $d = input();
    $stmt = $pdo->prepare(
        "UPDATE cohorts SET cohort_name = ?, description = ? WHERE id = ?"
    );
    $stmt->execute([
        $d['cohort_name'],
        $d['description'] ?? null,
        (int)$d['id'],
    ]);
    respond(['success' => true, 'message' => '✅ កែជោគជ័យ']);
}

// ============================================================
// DELETE — លុបជំនាន់ (មិនអនុញ្ញាតលុប current)
// ============================================================
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) respond(['error' => 'ខ្វះ id'], 400);
    
    // ពិនិត្យ current
    $chk = $pdo->prepare("SELECT is_current FROM cohorts WHERE id = ?");
    $chk->execute([$id]);
    $row = $chk->fetch();
    
    if ($row && !empty($row['is_current'])) {
        respond(['error' => 'មិនអាចលុបជំនាន់បច្ចុប្បន្នបានទេ'], 400);
    }
    
    $pdo->prepare("DELETE FROM cohorts WHERE id = ?")->execute([$id]);
    respond(['success' => true, 'message' => '✅ លុបជោគជ័យ']);
}

respond(['error' => 'Method not allowed'], 405);
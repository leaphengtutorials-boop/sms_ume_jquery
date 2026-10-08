<?php
/**
 * ============================================================
 * PHOTO — Upload/Delete រូបថតសិស្ស (ម្នាក់ៗ)
 * ============================================================
 * 
 * Endpoints:
 *   POST   /photo.php                 → Upload រូបថត
 *          Body: FormData { student_id, photo }
 *   DELETE /photo.php?student_id=X    → លុបរូបថត
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// POST — Upload រូបថត
// ============================================================
if ($method === 'POST') {
    $student_id = (int)($_POST['student_id'] ?? 0);
    if (!$student_id) respond(['error' => 'ខ្វះ student_id'], 400);
    if (empty($_FILES['photo']['tmp_name'])) respond(['error' => 'សូមជ្រើសរូបថត'], 400);
    
    // ពិនិត្យសិស្សមាន
    $stmt = $pdo->prepare("SELECT photo FROM students WHERE id = ?");
    $stmt->execute([$student_id]);
    $old = $stmt->fetch();
    if (!$old) respond(['error' => 'រកមិនឃើញសិស្ស'], 404);
    
    // ពិនិត្យ file
    $ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
        respond(['error' => 'File ត្រូវតែជារូបភាព'], 400);
    }
    if ($_FILES['photo']['size'] > 5 * 1024 * 1024) {
        respond(['error' => 'File ធំពេក (max 5MB)'], 400);
    }
    
    // Upload
    $dir = __DIR__ . '/../uploads/';
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    
    $name = 'stu_' . $student_id . '_' . time() . '.' . $ext;
    if (!move_uploaded_file($_FILES['photo']['tmp_name'], $dir . $name)) {
        respond(['error' => 'Upload បរាជ័យ'], 500);
    }
    
    // លុបរូបថតចាស់
    if ($old['photo'] && file_exists(__DIR__ . '/../' . $old['photo'])) {
        @unlink(__DIR__ . '/../' . $old['photo']);
    }
    
    // Update DB
    $photoPath = 'uploads/' . $name;
    $pdo->prepare("UPDATE students SET photo = ? WHERE id = ?")
        ->execute([$photoPath, $student_id]);
    
    respond([
        'success' => true,
        'photo'   => $photoPath,
        'message' => '✅ Upload រូបថតជោគជ័យ',
    ]);
}

// ============================================================
// DELETE — លុបរូបថត
// ============================================================
if ($method === 'DELETE') {
    $student_id = (int)($_GET['student_id'] ?? 0);
    if (!$student_id) respond(['error' => 'ខ្វះ student_id'], 400);
    
    // ទាញ photo path
    $stmt = $pdo->prepare("SELECT photo FROM students WHERE id = ?");
    $stmt->execute([$student_id]);
    $old = $stmt->fetch();
    
    // លុប file
    if ($old && $old['photo'] && file_exists(__DIR__ . '/../' . $old['photo'])) {
        @unlink(__DIR__ . '/../' . $old['photo']);
    }
    
    // Update DB
    $pdo->prepare("UPDATE students SET photo = NULL WHERE id = ?")
        ->execute([$student_id]);
    
    respond(['success' => true, 'message' => '✅ លុបរូបថតជោគជ័យ']);
}

respond(['error' => 'Method not allowed'], 405);
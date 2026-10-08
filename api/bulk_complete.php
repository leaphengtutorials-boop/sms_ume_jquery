<?php
/**
 * ============================================================
 * BULK COMPLETE — បញ្ចប់មុខវិជ្ជាច្រើននាក់
 * ============================================================
 */

require 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$d = input();
$subject_id  = (int)($d['subject_id'] ?? 0);
$student_ids = $d['student_ids'] ?? [];

if (!$subject_id || empty($student_ids)) {
    respond(['error' => 'ខ្វះទិន្នន័យ'], 400);
}

$completed = 0;
$skipped = [];

foreach ($student_ids as $sid) {
    $sid = (int)$sid;
    if (!$sid) continue;

    $missing = [];

    $q = $pdo->prepare(
        "SELECT COUNT(*) AS c FROM attendance 
         WHERE subject_id = ? AND student_id = ?"
    );
    $q->execute([$subject_id, $sid]);
    if ((int)$q->fetch()['c'] === 0) $missing[] = 'វត្តមាន';

    $hwQ = $pdo->prepare(
        "SELECT h.type, h.title, hs.submitted, hs.score 
         FROM homework h
         LEFT JOIN homework_submissions hs 
            ON hs.homework_id = h.id AND hs.student_id = ?
         WHERE h.subject_id = ?"
    );
    $hwQ->execute([$sid, $subject_id]);
    $typeNames = ['homework' => 'HW', 'quiz' => 'Quiz', 'assignment' => 'Asg'];
    
    foreach ($hwQ->fetchAll() as $hw) {
        if (empty($hw['submitted']) || $hw['score'] === null) {
            $missing[] = ($typeNames[$hw['type']] ?? $hw['type']) . ': ' . $hw['title'];
        }
    }

    $mQ = $pdo->prepare(
        "SELECT COUNT(*) AS c FROM scores 
         WHERE subject_id = ? AND student_id = ? AND score_type = 'midterm'"
    );
    $mQ->execute([$subject_id, $sid]);
    if ((int)$mQ->fetch()['c'] === 0) $missing[] = 'Midterm';

    if (!empty($missing)) {
        $stQ = $pdo->prepare("SELECT full_name FROM students WHERE id = ?");
        $stQ->execute([$sid]);
        $name = $stQ->fetch()['full_name'] ?? "ID $sid";
        $skipped[] = "$name (ខ្វះ: " . implode(', ', array_slice($missing, 0, 3)) . ")";
        continue;
    }

    $update = $pdo->prepare(
        "UPDATE enrollments 
         SET status = 'completed', completed_at = NOW()
         WHERE student_id = ? AND subject_id = ?"
    );
    $update->execute([$sid, $subject_id]);
    $completed++;
}

respond([
    'success'   => true,
    'completed' => $completed,
    'skipped'   => $skipped,
    'message'   => "✅ បញ្ចប់ {$completed} នាក់" . (count($skipped) ? " · រំលង " . count($skipped) : "")
]);
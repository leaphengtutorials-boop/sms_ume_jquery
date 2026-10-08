<?php
/**
 * ============================================================
 * REPORTS — លទ្ធផលពិន្ទុសរុប
 * ============================================================
 * 
 * គណនាពិន្ទុសរុបរបស់សិស្សរាល់ៗនាក់:
 *   - Attendance score
 *   - Homework / Quiz / Assignment average
 *   - Midterm / Final exam score
 *   - Total = Weighted sum
 *   - Grade (A/B/C/D/E/F)
 * 
 * Query: ?subject_id=X&cohort_id=Y&only_current=1&include_completed=1
 */

require 'config.php';

$subject_id = (int)($_GET['subject_id'] ?? 0);
if (!$subject_id) respond(['error' => 'ខ្វះ subject_id'], 400);

$search            = trim($_GET['search'] ?? '');
$only_current      = !empty($_GET['only_current']);
$include_completed = !empty($_GET['include_completed']);

// ============================================================
// ព័ត៌មានមុខវិជ្ជា
// ============================================================
$sub = $pdo->prepare(
    "SELECT s.*, y.year_name FROM subjects s 
     LEFT JOIN academic_years y ON s.academic_year_id = y.id 
     WHERE s.id = ?"
);
$sub->execute([$subject_id]);
$subject = $sub->fetch();
if (!$subject) respond(['error' => 'រកមិនឃើញមុខវិជ្ជា'], 404);

// ============================================================
// ទម្ងន់ពិន្ទុ
// ============================================================
$w = $pdo->prepare("SELECT * FROM weights WHERE subject_id = ?");
$w->execute([$subject_id]);
$weights = $w->fetch() ?: [
    'attendance_weight' => 10, 'homework_weight' => 10,
    'quiz_weight' => 10, 'midterm_weight' => 20,
    'assignment_weight' => 15, 'final_weight' => 35,
];

// ============================================================
// បញ្ជីសិស្ស + Filters
// ============================================================
$sql = "SELECT st.*, c.cohort_name, c.is_current 
        FROM enrollments e
        JOIN students st ON e.student_id = st.id
        LEFT JOIN cohorts c ON st.cohort_id = c.id
        WHERE e.subject_id = ? AND e.is_active = 1";
$params = [$subject_id];

// លាក់សិស្សបញ្ចប់ (លុះត្រាតែ include_completed)
if (!$include_completed) {
    $sql .= " AND e.status = 'active'";
}
if ($only_current) {
    $sql .= " AND c.is_current = 1";
}
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

$total_weeks = (int)$subject['total_weeks'];

// ============================================================
// Attendance Map
// ============================================================
$attQ = $pdo->prepare(
    "SELECT student_id, week_no, status FROM attendance WHERE subject_id = ?"
);
$attQ->execute([$subject_id]);
$attMap = [];
foreach ($attQ->fetchAll() as $row) {
    $attMap[$row['student_id']][$row['week_no']] = $row['status'];
}

// ============================================================
// គណនាពិន្ទុរាល់សិស្ស
// ============================================================
$result = [];
foreach ($students as $stu) {
    $sid = $stu['id'];
    
    // ១. Attendance
    $present = 0; $late = 0; $absent = 0; $permission = 0;
    $weekStatus = [];
    
    for ($week = 1; $week <= $total_weeks; $week++) {
        $st = $attMap[$sid][$week] ?? 'absent';
        $weekStatus[$week] = $st;
        if ($st === 'present') $present++;
        elseif ($st === 'late') $late++;
        elseif ($st === 'permission') $permission++;
        else $absent++;
    }
    
    $attScore = 100 
        - ($absent * (100 / max(1, $total_weeks)))
        - ($permission * (100 / max(1, $total_weeks * 2)));
    $attScore = max(0, min(100, round($attScore, 2)));
    
    // ២. Midterm + Final
    $examScores = [];
    foreach (['midterm', 'final'] as $type) {
        $q = $pdo->prepare(
            "SELECT AVG(score / max_score * 100) AS avg_pct FROM scores 
             WHERE subject_id = ? AND student_id = ? AND score_type = ?"
        );
        $q->execute([$subject_id, $sid, $type]);
        $r = $q->fetch();
        $examScores[$type] = round((float)($r['avg_pct'] ?? 0), 2);
    }
    
    // ៣. Homework / Quiz / Assignment
    $hwQ = $pdo->prepare(
        "SELECT h.type, h.max_score, hs.submitted, hs.score 
         FROM homework h
         LEFT JOIN homework_submissions hs 
            ON hs.homework_id = h.id AND hs.student_id = ?
         WHERE h.subject_id = ?"
    );
    $hwQ->execute([$sid, $subject_id]);
    $hwList = $hwQ->fetchAll();
    
    $hwCounts = ['homework' => 0, 'quiz' => 0, 'assignment' => 0];
    $hwSums   = ['homework' => 0, 'quiz' => 0, 'assignment' => 0];
    
    foreach ($hwList as $hw) {
        $t = $hw['type'];
        $maxHw = (float)($hw['max_score'] ?: 10);
        $hwCounts[$t]++;
        if (!empty($hw['submitted']) && $hw['score'] !== null) {
            $hwSums[$t] += ($maxHw > 0) ? ((float)$hw['score'] / $maxHw) : 0;
        }
    }
    
    $hwScores = [];
    foreach (['homework', 'quiz', 'assignment'] as $t) {
        $cnt = $hwCounts[$t];
        $sum = $hwSums[$t];
        $hwScores[$t] = ($cnt > 0) ? round(($sum / $cnt) * 100, 2) : 0;
    }
    
    // ៤. Total
    $total_score = 
        ($attScore * $weights['attendance_weight'] / 100) +
        ($hwScores['homework'] * $weights['homework_weight'] / 100) +
        ($hwScores['quiz'] * $weights['quiz_weight'] / 100) +
        ($examScores['midterm'] * $weights['midterm_weight'] / 100) +
        ($hwScores['assignment'] * $weights['assignment_weight'] / 100) +
        ($examScores['final'] * $weights['final_weight'] / 100);
    $total_score = round($total_score, 2);
    
    // ៥. Grade
    $grade = 'F';
    if ($total_score >= 90) $grade = 'A';
    elseif ($total_score >= 80) $grade = 'B';
    elseif ($total_score >= 70) $grade = 'C';
    elseif ($total_score >= 60) $grade = 'D';
    elseif ($total_score >= 50) $grade = 'E';
    
    $result[] = [
        'student_id'      => $sid,
        'student_code'    => $stu['student_code'],
        'full_name'       => $stu['full_name'],
        'gender'          => $stu['gender'],
        'photo'           => $stu['photo'],
        'cohort_name'     => $stu['cohort_name'] ?? '',
        'cohort_id'       => $stu['cohort_id'] ?? null,
        'is_current'      => (int)($stu['is_current'] ?? 0),
        'week_status'     => $weekStatus,
        'attendance'      => [
            'present'    => $present,
            'late'       => $late,
            'absent'     => $absent,
            'permission' => $permission,
        ],
        'attendance_score' => $attScore,
        'scores' => [
            'homework'   => $hwScores['homework'],
            'quiz'       => $hwScores['quiz'],
            'midterm'    => $examScores['midterm'],
            'assignment' => $hwScores['assignment'],
            'final'      => $examScores['final'],
        ],
        'total_score' => $total_score,
        'grade'       => $grade,
    ];
}

respond([
    'subject'     => $subject,
    'weights'     => $weights,
    'total_weeks' => $total_weeks,
    'results'     => $result,
]);
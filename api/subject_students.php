<?php
/**
 * ============================================================
 * SUBJECT STUDENTS — បញ្ជីសិស្សក្នុងមុខវិជ្ជា
 * ============================================================
 * 
 * បង្ហាញសិស្សក្នុងមុខវិជ្ជាមួយ ជាមួយ:
 *   - ព័ត៌មានសិស្ស (ឈ្មោះ, កូដ, ជំនាន់)
 *   - ពិន្ទុគ្រប់ប្រភេទ (Attendance, HW, Quiz, Mid, Asg, Final)
 *   - ពិន្ទុសរុប + និទ្ទេស
 * 
 * Query: ?subject_id=X&cohort_id=Y&entry_year_id=Z&include_completed=1
 */

require 'config.php';

$subject_id = (int)($_GET['subject_id'] ?? 0);
if (!$subject_id) respond(['error' => 'ខ្វះ subject_id'], 400);

$include_completed = !empty($_GET['include_completed']);
$cohort_id         = (int)($_GET['cohort_id'] ?? 0);
$entry_year_id     = (int)($_GET['entry_year_id'] ?? 0);
$student_status    = $_GET['student_status'] ?? '';

// ============================================================
// ព័ត៌មានមុខវិជ្ជា
// ============================================================
$stmt = $pdo->prepare(
    "SELECT s.*, y.year_name FROM subjects s 
     LEFT JOIN academic_years y ON s.academic_year_id = y.id
     WHERE s.id = ?"
);
$stmt->execute([$subject_id]);
$subject = $stmt->fetch();
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
$sql = "SELECT st.id AS student_id, st.student_code, st.full_name, 
            st.gender, st.photo, st.cohort_id, st.entry_year_id,
            st.status AS student_status,
            c.cohort_name, c.is_current, 
            y.year_name AS entry_year_name,
            e.status AS enroll_status, e.completed_at
        FROM enrollments e
        JOIN students st ON e.student_id = st.id
        LEFT JOIN cohorts c ON st.cohort_id = c.id
        LEFT JOIN academic_years y ON st.entry_year_id = y.id
        WHERE e.subject_id = ?";
$params = [$subject_id];

if (!$include_completed)             { $sql .= " AND e.status = 'active'"; }
if ($cohort_id)                      { $sql .= " AND st.cohort_id = ?";     $params[] = $cohort_id; }
if ($entry_year_id)                  { $sql .= " AND st.entry_year_id = ?"; $params[] = $entry_year_id; }
if ($student_status && in_array($student_status, ['active', 'graduated', 'dropped', 'pending'])) {
    $sql .= " AND st.status = ?";
    $params[] = $student_status;
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
// គណនាពិន្ទុគ្រប់សិស្ស
// ============================================================
$result = [];
foreach ($students as $stu) {
    $sid = $stu['student_id'];
    
    // ១. Attendance
    $present = 0; $late = 0; $absent = 0; $permission = 0;
    for ($week = 1; $week <= $total_weeks; $week++) {
        $st = $attMap[$sid][$week] ?? 'absent';
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
        'cohort_id'       => $stu['cohort_id'],
        'cohort_name'     => $stu['cohort_name'] ?? '',
        'is_current'      => (int)($stu['is_current'] ?? 0),
        'entry_year_id'   => $stu['entry_year_id'],
        'entry_year_name' => $stu['entry_year_name'] ?? '',
        'student_status'  => $stu['student_status'],
        'enroll_status'   => $stu['enroll_status'],
        'completed_at'    => $stu['completed_at'],
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
    'students'    => $result,
]);
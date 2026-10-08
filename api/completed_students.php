<?php
/**
 * ============================================================
 * COMPLETED STUDENTS — សិស្សដែលបានបញ្ចប់មុខវិជ្ជា
 * ============================================================
 */

require 'config.php';

$cohort_id      = (int)($_GET['cohort_id'] ?? 0);
$year_id        = (int)($_GET['year_id'] ?? 0);
$study_year     = (int)($_GET['study_year'] ?? 0);
$semester       = (int)($_GET['semester'] ?? 0);
$subject_id     = (int)($_GET['subject_id'] ?? 0);
$student_status = $_GET['student_status'] ?? '';
$search         = trim($_GET['search'] ?? '');

$sql = "SELECT 
            e.id AS enrollment_id,
            e.completed_at,
            e.study_year AS enroll_study_year,
            e.semester AS enroll_semester,
            st.id AS student_id,
            st.student_code,
            st.full_name,
            st.gender,
            st.photo,
            st.status AS student_status,
            st.dob,
            st.phone,
            st.email,
            st.address,
            c.id AS cohort_id,
            c.cohort_name,
            c.is_current,
            s.id AS subject_id,
            s.subject_code,
            s.subject_name,
            s.study_year,
            s.semester,
            s.total_weeks,
            y.id AS year_id,
            y.year_name,
            -- Attendance counts
            (SELECT COUNT(*) FROM attendance 
             WHERE subject_id = s.id AND student_id = st.id 
             AND status = 'present') AS att_present,
            (SELECT COUNT(*) FROM attendance 
             WHERE subject_id = s.id AND student_id = st.id 
             AND status = 'late') AS att_late,
            (SELECT COUNT(*) FROM attendance 
             WHERE subject_id = s.id AND student_id = st.id 
             AND status = 'absent') AS att_absent,
            (SELECT COUNT(*) FROM attendance 
             WHERE subject_id = s.id AND student_id = st.id 
             AND status = 'permission') AS att_permission,
            -- Midterm + Final
            (SELECT AVG(score / max_score * 100) FROM scores 
             WHERE subject_id = s.id AND student_id = st.id 
             AND score_type = 'midterm') AS midterm_score,
            (SELECT AVG(score / max_score * 100) FROM scores 
             WHERE subject_id = s.id AND student_id = st.id 
             AND score_type = 'final') AS final_score
        FROM enrollments e
        JOIN students st ON e.student_id = st.id
        JOIN subjects s ON e.subject_id = s.id
        LEFT JOIN cohorts c ON st.cohort_id = c.id
        LEFT JOIN academic_years y ON s.academic_year_id = y.id
        WHERE e.status = 'completed'";
$params = [];

if ($cohort_id)      { $sql .= " AND st.cohort_id = ?";          $params[] = $cohort_id; }
if ($year_id)        { $sql .= " AND s.academic_year_id = ?";    $params[] = $year_id; }
if ($study_year)     { $sql .= " AND s.study_year = ?";          $params[] = $study_year; }
if ($semester)       { $sql .= " AND s.semester = ?";            $params[] = $semester; }
if ($subject_id)     { $sql .= " AND s.id = ?";                  $params[] = $subject_id; }
if ($student_status) { $sql .= " AND st.status = ?";             $params[] = $student_status; }
if ($search) {
    $sql .= " AND (st.student_code LIKE ? OR st.full_name LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$sql .= " ORDER BY e.completed_at DESC, st.student_code";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

// ✅ គណនាពិន្ទុសរុប
foreach ($rows as &$r) {
    $present    = (int)$r['att_present'];
    $late       = (int)$r['att_late'];
    $absent     = (int)$r['att_absent'];
    $permission = (int)$r['att_permission'];
    $tw         = (int)$r['total_weeks'];

    $attScore = 100 
        - ($absent * (100 / max(1, $tw)))
        - ($permission * (100 / max(1, $tw * 2)));
    $attScore = max(0, min(100, round($attScore, 2)));

    // Homework/Quiz/Assignment
    $hwQ = $pdo->prepare(
        "SELECT h.type, h.max_score, hs.submitted, hs.score 
         FROM homework h
         LEFT JOIN homework_submissions hs 
            ON hs.homework_id = h.id AND hs.student_id = ?
         WHERE h.subject_id = ?"
    );
    $hwQ->execute([$r['student_id'], $r['subject_id']]);
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

    // Weights
    $w = $pdo->prepare("SELECT * FROM weights WHERE subject_id = ?");
    $w->execute([$r['subject_id']]);
    $weights = $w->fetch() ?: [
        'attendance_weight' => 10, 'homework_weight' => 10,
        'quiz_weight' => 10, 'midterm_weight' => 20,
        'assignment_weight' => 15, 'final_weight' => 35,
    ];

    $mid = (float)$r['midterm_score'];
    $fin = (float)$r['final_score'];

    $total = ($attScore * $weights['attendance_weight'] / 100)
           + ($hwScores['homework'] * $weights['homework_weight'] / 100)
           + ($hwScores['quiz'] * $weights['quiz_weight'] / 100)
           + ($mid * $weights['midterm_weight'] / 100)
           + ($hwScores['assignment'] * $weights['assignment_weight'] / 100)
           + ($fin * $weights['final_weight'] / 100);
    $total = round($total, 2);

    $grade = 'F';
    if ($total >= 90) $grade = 'A';
    elseif ($total >= 80) $grade = 'B';
    elseif ($total >= 70) $grade = 'C';
    elseif ($total >= 60) $grade = 'D';
    elseif ($total >= 50) $grade = 'E';

    // ✅ បន្ថែមព័ត៌មានពេញលេញ
    $r['total_score'] = $total;
    $r['grade']       = $grade;
    $r['att_score']   = $attScore;
    $r['hw_score']    = $hwScores['homework'];
    $r['quiz_score']  = $hwScores['quiz'];
    $r['asg_score']   = $hwScores['assignment'];
    $r['mid_score']   = round($mid, 2);
    $r['fin_score']   = round($fin, 2);
    $r['weights']     = $weights;
}
unset($r);

respond($rows);
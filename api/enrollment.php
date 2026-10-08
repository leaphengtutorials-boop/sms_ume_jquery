<?php
/**
 * ============================================================
 * ENROLLMENT — ចុះឈ្មោះ + ប្រវត្តិ
 * ============================================================
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET
// ============================================================
if ($method === 'GET') {

    // ---- History ----
    if (isset($_GET['history']) && isset($_GET['student_id'])) {
        $student_id = (int)$_GET['student_id'];
        $stmt = $pdo->prepare(
            "SELECT e.id, e.subject_id, e.status, e.completed_at, e.enrolled_at,
                    s.subject_code, s.subject_name, s.total_weeks,
                    s.study_year, s.semester,
                    y.year_name
             FROM enrollments e
             JOIN subjects s ON e.subject_id = s.id
             LEFT JOIN academic_years y ON s.academic_year_id = y.id
             WHERE e.student_id = ?
             ORDER BY e.enrolled_at DESC"
        );
        $stmt->execute([$student_id]);
        $enrollments = $stmt->fetchAll();

        $result = [];
        foreach ($enrollments as $en) {
            $subject_id  = (int)$en['subject_id'];
            $total_weeks = (int)$en['total_weeks'];

            $w = $pdo->prepare("SELECT * FROM weights WHERE subject_id = ?");
            $w->execute([$subject_id]);
            $weights = $w->fetch() ?: [
                'attendance_weight' => 10, 'homework_weight' => 10,
                'quiz_weight' => 10, 'midterm_weight' => 20,
                'assignment_weight' => 15, 'final_weight' => 35,
            ];

            $attQ = $pdo->prepare(
                "SELECT week_no, status FROM attendance 
                 WHERE subject_id = ? AND student_id = ?"
            );
            $attQ->execute([$subject_id, $student_id]);
            $attMap = [];
            foreach ($attQ->fetchAll() as $row) {
                $attMap[$row['week_no']] = $row['status'];
            }

            $present = 0; $late = 0; $absent = 0; $permission = 0;
            for ($week = 1; $week <= $total_weeks; $week++) {
                $st = $attMap[$week] ?? 'absent';
                if ($st === 'present') $present++;
                elseif ($st === 'late') $late++;
                elseif ($st === 'permission') $permission++;
                else $absent++;
            }
            $attScore = 100 
                - ($absent * (100 / max(1, $total_weeks)))
                - ($permission * (100 / max(1, $total_weeks * 2)));
            $attScore = max(0, min(100, round($attScore, 2)));

            $examScores = [];
            foreach (['midterm', 'final'] as $type) {
                $q = $pdo->prepare(
                    "SELECT AVG(score / max_score * 100) AS avg_pct FROM scores 
                     WHERE subject_id = ? AND student_id = ? AND score_type = ?"
                );
                $q->execute([$subject_id, $student_id, $type]);
                $r = $q->fetch();
                $examScores[$type] = round((float)($r['avg_pct'] ?? 0), 2);
            }

            $hwQ = $pdo->prepare(
                "SELECT h.type, h.max_score, hs.submitted, hs.score 
                 FROM homework h
                 LEFT JOIN homework_submissions hs 
                    ON hs.homework_id = h.id AND hs.student_id = ?
                 WHERE h.subject_id = ?"
            );
            $hwQ->execute([$student_id, $subject_id]);
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

            $total_score = ($attScore * $weights['attendance_weight'] / 100)
                         + ($hwScores['homework'] * $weights['homework_weight'] / 100)
                         + ($hwScores['quiz'] * $weights['quiz_weight'] / 100)
                         + ($examScores['midterm'] * $weights['midterm_weight'] / 100)
                         + ($hwScores['assignment'] * $weights['assignment_weight'] / 100)
                         + ($examScores['final'] * $weights['final_weight'] / 100);
            $total_score = round($total_score, 2);

            $grade = 'F';
            if ($total_score >= 90) $grade = 'A';
            elseif ($total_score >= 80) $grade = 'B';
            elseif ($total_score >= 70) $grade = 'C';
            elseif ($total_score >= 60) $grade = 'D';
            elseif ($total_score >= 50) $grade = 'E';

            $result[] = [
                'id' => $en['id'],
                'subject_id' => $subject_id,
                'subject_code' => $en['subject_code'],
                'subject_name' => $en['subject_name'],
                'study_year' => $en['study_year'],
                'semester' => $en['semester'],
                'year_name' => $en['year_name'],
                'status' => $en['status'],
                'completed_at' => $en['completed_at'],
                'enrolled_at' => $en['enrolled_at'],
                'attendance_score' => $attScore,
                'scores' => [
                    'homework' => $hwScores['homework'],
                    'quiz' => $hwScores['quiz'],
                    'midterm' => $examScores['midterm'],
                    'assignment' => $hwScores['assignment'],
                    'final' => $examScores['final'],
                ],
                'total_score' => $total_score,
                'grade' => $grade,
            ];
        }

        respond($result);
    }

    // ---- Main List ----
    $subject_id = (int)($_GET['subject_id'] ?? 0);
    if (!$subject_id) respond([]);

    $search         = trim($_GET['search'] ?? '');
    $cohort         = $_GET['cohort_id'] ?? '';
    $year           = $_GET['entry_year_id'] ?? '';
    $status         = $_GET['enroll_status'] ?? '';
    $student_status = $_GET['student_status'] ?? '';

    $sql = "SELECT st.*, 
                c.cohort_name, c.is_current,
                y.year_name AS entry_year_name,
                e.id AS enrollment_id,
                COALESCE(e.status, 'none') AS enroll_status,
                e.completed_at,
                CASE WHEN e.id IS NULL THEN 0 ELSE 1 END AS enrolled,
                (SELECT COUNT(*) FROM enrollments e2 
                 WHERE e2.student_id = st.id 
                 AND e2.status = 'active' 
                 AND e2.subject_id != ?) AS other_active_count,
                (SELECT GROUP_CONCAT(
                    CONCAT(s2.subject_name, ' (ឆ្នាំ ', s2.study_year, ' ឆមាស ', s2.semester, ')')
                    SEPARATOR ', ') 
                FROM enrollments e2 
                JOIN subjects s2 ON e2.subject_id = s2.id
                WHERE e2.student_id = st.id 
                AND e2.status = 'active' 
                AND e2.subject_id != ?) AS other_active_subjects
            FROM students st
            LEFT JOIN cohorts c ON st.cohort_id = c.id
            LEFT JOIN academic_years y ON st.entry_year_id = y.id
            LEFT JOIN enrollments e ON e.student_id = st.id AND e.subject_id = ?
            WHERE 1 = 1";
    $params = [$subject_id, $subject_id, $subject_id];

    // Filter Status
    if ($status === 'completed') {
        $sql .= " AND e.status = 'completed'";
    } else if ($status === 'dropped') {
        $sql .= " AND e.status = 'dropped'";
    } else if ($status === 'active') {
        $sql .= " AND e.status = 'active'";
    } else {
        // Default → លាក់ completed
        $sql .= " AND (e.status IS NULL OR e.status != 'completed')";
    }

    if ($search) {
        $sql .= " AND (st.student_code LIKE ? OR st.full_name LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    if ($cohort) {
        $sql .= " AND st.cohort_id = ?";
        $params[] = (int)$cohort;
    }
    if ($year) {
        $sql .= " AND st.entry_year_id = ?";
        $params[] = (int)$year;
    }
    if ($student_status && in_array($student_status, ['active', 'graduated', 'dropped'])) {
        $sql .= " AND st.status = ?";
        $params[] = $student_status;
    }

    $sql .= " ORDER BY st.student_code";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

// ============================================================
// POST — រក្សាទុក enrollment
// ============================================================
if ($method === 'POST') {
    $d = input();
    $subject_id = (int)($d['subject_id'] ?? 0);
    if (!$subject_id) respond(['error' => 'ខ្វះ subject_id'], 400);

    $subQ = $pdo->prepare("SELECT study_year, semester FROM subjects WHERE id = ?");
    $subQ->execute([$subject_id]);
    $subj = $subQ->fetch();
    if (!$subj) respond(['error' => 'រកមិនឃើញមុខវិជ្ជា'], 404);

    $study_year = (int)$subj['study_year'];
    $semester   = (int)$subj['semester'];

    $students = $d['students'] ?? null;
    if (!$students) {
        $ids = $d['student_ids'] ?? [];
        $students = array_map(fn($id) => ['id' => $id, 'status' => 'active'], $ids);
    }

    // Validation: ១ active subject ជាសកល
    $conflicts = [];
    foreach ($students as $stu) {
        $sid = (int)($stu['id'] ?? 0);
        if (!$sid) continue;

        $chk = $pdo->prepare(
            "SELECT s.subject_name, s.study_year, s.semester
             FROM enrollments e
             JOIN subjects s ON e.subject_id = s.id
             WHERE e.student_id = ? 
               AND e.status = 'active'
               AND e.subject_id != ?"
        );
        $chk->execute([$sid, $subject_id]);
        $existing = $chk->fetch();

        if ($existing) {
            $stQ = $pdo->prepare("SELECT full_name FROM students WHERE id = ?");
            $stQ->execute([$sid]);
            $stName = $stQ->fetch()['full_name'] ?? "ID $sid";
            $conflicts[] = "$stName — កំពុងរៀន {$existing['subject_name']}";
        }
    }

    if (!empty($conflicts)) {
        respond([
            'error' => 'មិនអាចចុះឈ្មោះបានទេ',
            'conflicts' => $conflicts,
            'message' => "សិស្សទាំងនេះកំពុងរៀនមុខវិជ្ជាផ្សេង:\n• " . implode("\n• ", array_slice($conflicts, 0, 10))
        ], 400);
    }

    $pdo->beginTransaction();
    try {
        // លុបតែ active/dropped
        $pdo->prepare(
            "DELETE FROM enrollments 
             WHERE subject_id = ? AND status IN ('active', 'dropped')"
        )->execute([$subject_id]);

        $count = 0;
        if (!empty($students)) {
            // ON DUPLICATE KEY UPDATE → Update completed ជា active
            $stmt = $pdo->prepare(
                "INSERT INTO enrollments 
                 (student_id, subject_id, study_year, semester, status, completed_at, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, 1)
                 ON DUPLICATE KEY UPDATE 
                    study_year   = VALUES(study_year),
                    semester     = VALUES(semester),
                    status       = VALUES(status),
                    completed_at = VALUES(completed_at),
                    is_active    = 1"
            );
            
            foreach ($students as $stu) {
                $sid    = (int)($stu['id'] ?? 0);
                $status = $stu['status'] ?? 'active';
                if (!in_array($status, ['active', 'completed', 'dropped'])) $status = 'active';
                if (!$sid) continue;

                $completedAt = ($status === 'completed') ? date('Y-m-d H:i:s') : null;
                $stmt->execute([$sid, $subject_id, $study_year, $semester, $status, $completedAt]);
                $count++;
            }
        }

        $pdo->commit();
        respond(['success' => true, 'count' => $count, 'message' => "✅ រក្សាទុក {$count} សិស្ស"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 500);
    }
}

// ============================================================
// PATCH — ផ្លាស់ប្តូរ status
// ============================================================
if ($method === 'PATCH') {
    $d = input();
    $student_id = (int)($d['student_id'] ?? 0);
    $subject_id = (int)($d['subject_id'] ?? 0);
    $status     = $d['status'] ?? 'active';

    if (!$student_id || !$subject_id) respond(['error' => 'ខ្វះទិន្នន័យ'], 400);
    if (!in_array($status, ['active', 'completed', 'dropped'])) {
        respond(['error' => 'Status មិនត្រឹមត្រូវ'], 400);
    }

    if ($status === 'completed') {
        $missing = [];

        $q = $pdo->prepare(
            "SELECT COUNT(*) AS c FROM attendance 
             WHERE subject_id = ? AND student_id = ?"
        );
        $q->execute([$subject_id, $student_id]);
        if ((int)$q->fetch()['c'] === 0) $missing[] = 'មិនទាន់ស្រង់វត្តមាន';

        $hwQ = $pdo->prepare(
            "SELECT h.type, h.title, hs.submitted, hs.score 
             FROM homework h
             LEFT JOIN homework_submissions hs 
                ON hs.homework_id = h.id AND hs.student_id = ?
             WHERE h.subject_id = ?"
        );
        $hwQ->execute([$student_id, $subject_id]);
        $typeNames = ['homework' => 'កិច្ចការផ្ទះ', 'quiz' => 'ឃ្វីស', 'assignment' => 'កិច្ចការ'];
        foreach ($hwQ->fetchAll() as $hw) {
            if (empty($hw['submitted']) || $hw['score'] === null) {
                $missing[] = ($typeNames[$hw['type']] ?? $hw['type']) . ': ' . $hw['title'];
            }
        }

        $mQ = $pdo->prepare(
            "SELECT COUNT(*) AS c FROM scores 
             WHERE subject_id = ? AND student_id = ? AND score_type = 'midterm'"
        );
        $mQ->execute([$subject_id, $student_id]);
        if ((int)$mQ->fetch()['c'] === 0) $missing[] = 'មិនទាន់បញ្ចូលពិន្ទុ Midterm';

        if (!empty($missing)) {
            respond([
                'error' => 'មិនអាចបញ្ចប់បានទេ',
                'missing' => $missing,
                'message' => 'សូមបំពេញពិន្ទុទាំងនេះជាមុន',
            ], 400);
        }
    }

    $completedAt = ($status === 'completed') ? date('Y-m-d H:i:s') : null;

    $stmt = $pdo->prepare(
        "UPDATE enrollments SET status = ?, completed_at = ?
         WHERE student_id = ? AND subject_id = ?"
    );
    $stmt->execute([$status, $completedAt, $student_id, $subject_id]);

    if ($stmt->rowCount() === 0) {
        $subQ = $pdo->prepare("SELECT study_year, semester FROM subjects WHERE id = ?");
        $subQ->execute([$subject_id]);
        $subj = $subQ->fetch();

        $pdo->prepare(
            "INSERT INTO enrollments 
             (student_id, subject_id, study_year, semester, status, completed_at, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, 1)"
        )->execute([
            $student_id, $subject_id,
            $subj['study_year'] ?? 1, $subj['semester'] ?? 1,
            $status, $completedAt
        ]);
    }

    respond(['success' => true, 'message' => '✅ កែស្ថានភាពជោគជ័យ']);
}
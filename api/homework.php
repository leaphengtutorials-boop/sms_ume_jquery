<?php
/**
 * ============================================================
 * HOMEWORK — កិច្ចការ / Quiz / Assignment
 * ============================================================
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET
// ============================================================
if ($method === 'GET') {
    
    // ---- LIST ----
    if (isset($_GET['subject_id'])) {
        $subject_id = (int)$_GET['subject_id'];
        $cohort_id  = (int)($_GET['cohort_id'] ?? 0);
        $year_id    = (int)($_GET['year_id'] ?? 0);
        $study_year = (int)($_GET['study_year'] ?? 0);
        $semester   = (int)($_GET['semester'] ?? 0);
        $type       = $_GET['type'] ?? '';
        $search     = trim($_GET['search'] ?? '');

        $sql = "SELECT h.*, c.cohort_name, c.is_current,
                    (SELECT COUNT(*) FROM homework_submissions 
                     WHERE homework_id = h.id AND submitted = 1) AS submitted_count
                FROM homework h
                LEFT JOIN cohorts c ON h.cohort_id = c.id
                WHERE h.subject_id = ?";
        $p = [$subject_id];

        // Filter Cohort
        if ($cohort_id) {
            $sql .= " AND h.cohort_id = ?";
            $p[] = $cohort_id;
        }

        // Filter Year
        if ($year_id) {
            $sql .= " AND EXISTS (
                SELECT 1 FROM subjects s2 
                WHERE s2.id = h.subject_id 
                AND s2.academic_year_id = ?
            )";
            $p[] = $year_id;
        }

        // Filter Study Year
        if ($study_year) {
            $sql .= " AND EXISTS (
                SELECT 1 FROM subjects s3 
                WHERE s3.id = h.subject_id 
                AND s3.study_year = ?
            )";
            $p[] = $study_year;
        }

        // Filter Semester
        if ($semester) {
            $sql .= " AND EXISTS (
                SELECT 1 FROM subjects s4 
                WHERE s4.id = h.subject_id 
                AND s4.semester = ?
            )";
            $p[] = $semester;
        }

        // Filter Type
        if ($type && in_array($type, ['homework', 'quiz', 'assignment'])) {
            $sql .= " AND h.type = ?";
            $p[] = $type;
        }

        // Search
        if ($search) {
            $sql .= " AND h.title LIKE ?";
            $p[] = "%$search%";
        }

        $sql .= " ORDER BY h.created_at DESC";

        $s = $pdo->prepare($sql);
        $s->execute($p);
        respond($s->fetchAll());
    }

    // ---- DETAIL ----
    if (isset($_GET['id'])) {
        $hid = (int)$_GET['id'];
        
        $h = $pdo->prepare(
            "SELECT h.*, c.cohort_name, c.is_current 
             FROM homework h
             LEFT JOIN cohorts c ON h.cohort_id = c.id
             WHERE h.id = ?"
        );
        $h->execute([$hid]);
        $hw = $h->fetch();
        if (!$hw) respond(['error' => 'រកមិនឃើញកិច្ចការ'], 404);

        $cohort_id = (int)($hw['cohort_id'] ?? 0);

        // Students in this subject (active)
        $sql = "SELECT st.id AS student_id, st.student_code, st.full_name,
                    st.photo, st.gender,
                    c.cohort_name,
                    COALESCE(hs.submitted, 0) AS submitted,
                    hs.score AS score
                FROM enrollments e
                JOIN students st ON e.student_id = st.id
                LEFT JOIN cohorts c ON st.cohort_id = c.id
                LEFT JOIN homework_submissions hs 
                    ON hs.student_id = st.id AND hs.homework_id = ?
                WHERE e.subject_id = ? 
                  AND e.is_active = 1 
                  AND e.status = 'active'";
        $p2 = [$hid, $hw['subject_id']];

        if ($cohort_id) {
            $sql .= " AND st.cohort_id = ?";
            $p2[] = $cohort_id;
        }
        $sql .= " ORDER BY st.student_code";

        $s = $pdo->prepare($sql);
        $s->execute($p2);
        $students = $s->fetchAll();

        respond([
            'homework'    => $hw,
            'students'    => $students,
            'is_readonly' => ((int)($hw['is_current'] ?? 0) === 0),
        ]);
    }

    respond([]);
}

// ============================================================
// POST
// ============================================================
if ($method === 'POST') {
    $d = input();

    // ---- Submissions ----
    if (!empty($d['submissions']) && !empty($d['homework_id'])) {
        $hid = (int)$d['homework_id'];
        
        $chk = $pdo->prepare(
            "SELECT h.max_score, c.is_current 
             FROM homework h
             LEFT JOIN cohorts c ON h.cohort_id = c.id
             WHERE h.id = ?"
        );
        $chk->execute([$hid]);
        $hw = $chk->fetch();
        if (!$hw) respond(['error' => 'រកមិនឃើញកិច្ចការ'], 404);

        if ($hw['is_current'] !== null && (int)$hw['is_current'] === 0) {
            respond(['error' => 'ជំនាន់នេះបានបញ្ចប់រួច មិនអាចកែបានទេ'], 403);
        }

        $maxScore = (float)$hw['max_score'];

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                "INSERT INTO homework_submissions 
                 (homework_id, student_id, submitted, score) 
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                    submitted = VALUES(submitted), 
                    score = VALUES(score)"
            );

            $count = 0;
            foreach ($d['submissions'] as $sub) {
                $submitted = !empty($sub['submitted']) ? 1 : 0;
                $score = null;
                if ($submitted && isset($sub['score']) && $sub['score'] !== '' && $sub['score'] !== null) {
                    $score = min($maxScore, max(0, (float)$sub['score']));
                }
                $stmt->execute([$hid, (int)$sub['student_id'], $submitted, $score]);
                $count++;
            }
            $pdo->commit();
            respond(['success' => true, 'count' => $count, 'message' => "✅ រក្សាទុក {$count} នាក់"]);
        } catch (Exception $e) {
            $pdo->rollBack();
            respond(['error' => $e->getMessage()], 500);
        }
    }

    // ---- Create ----
    if (!empty($d['title']) && !empty($d['subject_id'])) {
        $type = $d['type'] ?? 'homework';
        if (!in_array($type, ['homework', 'quiz', 'assignment'])) {
            respond(['error' => 'ប្រភេទមិនត្រឹមត្រូវ'], 400);
        }

        if (empty($d['cohort_id'])) {
            respond(['error' => 'សូមជ្រើសជំនាន់'], 400);
        }

        $chkCohort = $pdo->prepare("SELECT is_current FROM cohorts WHERE id = ?");
        $chkCohort->execute([(int)$d['cohort_id']]);
        $cohort = $chkCohort->fetch();
        if (!$cohort) respond(['error' => 'ជំនាន់មិនត្រឹមត្រូវ'], 400);
        if ((int)$cohort['is_current'] === 0) {
            respond(['error' => 'មិនអាចបង្កើតកិច្ចការឱ្យជំនាន់ចាស់បានទេ'], 403);
        }

        $s = $pdo->prepare(
            "INSERT INTO homework 
             (subject_id, cohort_id, type, title, description, due_date, max_score) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $s->execute([
            (int)$d['subject_id'],
            (int)$d['cohort_id'],
            $type,
            $d['title'],
            $d['description'] ?? '',
            !empty($d['due_date']) ? $d['due_date'] : null,
            (float)($d['max_score'] ?? 100),
        ]);

        respond([
            'success' => true,
            'id'      => (int)$pdo->lastInsertId(),
            'message' => '✅ បង្កើតកិច្ចការជោគជ័យ',
        ], 201);
    }

    respond(['error' => 'ខ្វះព័ត៌មាន'], 400);
}

// ============================================================
// DELETE
// ============================================================
if ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        $hid = (int)$_GET['id'];
        
        $chk = $pdo->prepare(
            "SELECT c.is_current FROM homework h
             LEFT JOIN cohorts c ON h.cohort_id = c.id
             WHERE h.id = ?"
        );
        $chk->execute([$hid]);
        $row = $chk->fetch();

        if ($row && $row['is_current'] !== null && (int)$row['is_current'] === 0) {
            respond(['error' => 'មិនអាចលុបកិច្ចការរបស់ជំនាន់ចាស់បានទេ'], 403);
        }

        $pdo->prepare("DELETE FROM homework WHERE id = ?")->execute([$hid]);
        respond(['success' => true, 'message' => '✅ លុបជោគជ័យ']);
    }
    respond(['error' => 'ខ្វះ id'], 400);
}

respond(['error' => 'Method not allowed'], 405);
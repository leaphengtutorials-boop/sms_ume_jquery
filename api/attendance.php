<?php
/**
 * ============================================================
 * ATTENDANCE — ស្រង់វត្តមាន + របាយការណ៍
 * ============================================================
 * 
 * Endpoints:
 *   GET  /attendance.php?subject_id=X&week=Y          → បញ្ជីសិស្សស្រង់វត្តមាន
 *   GET  /attendance.php?report=1&subject_id=X        → របាយការណ៍វត្តមាន
 *   GET  /attendance.php?last_week=1&subject_id=X     → សប្តាហ៍ចុងក្រោយ
 *   POST /attendance.php                              → រក្សាទុកវត្តមាន
 */

require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    
    // ============================================================
    // 1. LAST WEEK — សប្តាហ៍ចុងក្រោយដែលបានស្រង់
    // Query: ?last_week=1&subject_id=X&cohort_id=Y
    // ============================================================
    if (isset($_GET['last_week']) && isset($_GET['subject_id'])) {
        $subject_id = (int)$_GET['subject_id'];
        $cohort_id  = (int)($_GET['cohort_id'] ?? 0);
        
        if (!$subject_id) respond(['last_week' => 0, 'completed' => false]);
        
        // រាប់សប្តាហ៍ដែលបានស្រង់
        $sql = "SELECT MAX(a.week_no) AS last_week, 
                       COUNT(DISTINCT a.week_no) AS total_recorded
                FROM attendance a
                JOIN students st ON a.student_id = st.id
                WHERE a.subject_id = ?";
        $params = [$subject_id];
        
        if ($cohort_id) {
            $sql .= " AND st.cohort_id = ?";
            $params[] = $cohort_id;
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $r = $stmt->fetch();
        
        // ទាញចំនួនសប្តាហ៍សរុប
        $tw = $pdo->prepare("SELECT total_weeks FROM subjects WHERE id = ?");
        $tw->execute([$subject_id]);
        $totalWeeks = (int)($tw->fetch()['total_weeks'] ?? 15);
        
        $lastWeek      = (int)($r['last_week'] ?? 0);
        $totalRecorded = (int)($r['total_recorded'] ?? 0);
        $completed     = ($totalRecorded >= $totalWeeks);
        
        respond([
            'subject_id'     => $subject_id,
            'cohort_id'      => $cohort_id,
            'last_week'      => $lastWeek,
            'total_recorded' => $totalRecorded,
            'total_weeks'    => $totalWeeks,
            'completed'      => $completed,
        ]);
    }
    
    // ============================================================
    // 2. TAKE ATTENDANCE — បញ្ជីសិស្សសម្រាប់ស្រង់វត្តមាន
    // Query: ?subject_id=X&week=Y&cohort_id=Z&search=...
    // ============================================================
    if (isset($_GET['subject_id'], $_GET['week'])) {
        $sid    = (int)$_GET['subject_id'];
        $week   = (int)$_GET['week'];
        $search = trim($_GET['search'] ?? '');
        $only_current = !empty($_GET['only_current']);
        
        $sql = "SELECT st.id AS student_id, st.student_code, st.full_name, 
                    st.gender, st.photo,
                    c.cohort_name,
                    COALESCE(a.status, 'absent') AS status,
                    COALESCE(a.note, '') AS note,
                    a.id AS attendance_id
                FROM enrollments e
                JOIN students st ON e.student_id = st.id
                LEFT JOIN cohorts c ON st.cohort_id = c.id
                LEFT JOIN attendance a ON a.student_id = st.id 
                    AND a.subject_id = e.subject_id 
                    AND a.week_no = ?
                WHERE e.subject_id = ? AND e.is_active = 1 AND e.status = 'active'";
        $params = [$week, $sid];
        
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
        respond($stmt->fetchAll());
    }
    
    // ============================================================
    // 3. REPORT — របាយការណ៍វត្តមាន (គ្រប់សប្តាហ៍)
    // Query: ?report=1&subject_id=X&cohort_id=Z&only_current=1
    // ============================================================
    if (isset($_GET['report']) && isset($_GET['subject_id'])) {
        $subject_id   = (int)$_GET['subject_id'];
        $search       = trim($_GET['search'] ?? '');
        $cohort_id    = (int)($_GET['cohort_id'] ?? 0);
        $only_current = !empty($_GET['only_current']);
        
        // ព័ត៌មានមុខវិជ្ជា
        $sub = $pdo->prepare(
            "SELECT s.*, y.year_name FROM subjects s 
             LEFT JOIN academic_years y ON s.academic_year_id = y.id 
             WHERE s.id = ?"
        );
        $sub->execute([$subject_id]);
        $subject = $sub->fetch();
        if (!$subject) respond(['error' => 'រកមិនឃើញមុខវិជ្ជា'], 404);
        
        // បញ្ជីសិស្ស
        $sql = "SELECT st.*, c.cohort_name, c.is_current 
                FROM enrollments e
                JOIN students st ON e.student_id = st.id
                LEFT JOIN cohorts c ON st.cohort_id = c.id
                WHERE e.subject_id = ? AND e.is_active = 1 AND e.status = 'active'";
        $params = [$subject_id];
        
        if ($cohort_id)   { $sql .= " AND st.cohort_id = ?";  $params[] = $cohort_id; }
        if ($only_current){ $sql .= " AND c.is_current = 1"; }
        if ($search) {
            $sql .= " AND (st.student_code LIKE ? OR st.full_name LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        $sql .= " ORDER BY st.student_code";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $students = $stmt->fetchAll();
        
        $total_weeks = (int)$subject['total_weeks'];
        
        // Attendance map
        $attQ = $pdo->prepare(
            "SELECT student_id, week_no, status FROM attendance WHERE subject_id = ?"
        );
        $attQ->execute([$subject_id]);
        $attMap = [];
        foreach ($attQ->fetchAll() as $row) {
            $attMap[$row['student_id']][$row['week_no']] = $row['status'];
        }
        
        // Build results
        $result = [];
        foreach ($students as $stu) {
            $present = 0; $late = 0; $absent = 0; $permission = 0;
            $weekStatus = [];
            
            for ($w = 1; $w <= $total_weeks; $w++) {
                $st = $attMap[$stu['id']][$w] ?? 'absent';
                $weekStatus[$w] = $st;
                if ($st === 'present') $present++;
                elseif ($st === 'late') $late++;
                elseif ($st === 'permission') $permission++;
                else $absent++;
            }
            
            $attPercent = 100 
                - ($absent * (100 / max(1, $total_weeks)))
                - ($permission * (100 / max(1, $total_weeks * 2)));
            $attPercent = max(0, min(100, round($attPercent, 2)));
            
            $result[] = [
                'student_id'   => $stu['id'],
                'student_code' => $stu['student_code'],
                'full_name'    => $stu['full_name'],
                'gender'       => $stu['gender'],
                'photo'        => $stu['photo'],
                'cohort_name'  => $stu['cohort_name'] ?? '',
                'cohort_id'    => $stu['cohort_id'] ?? null,
                'is_current'   => (int)($stu['is_current'] ?? 0),
                'week_status'  => $weekStatus,
                'attendance'   => [
                    'present'    => $present,
                    'late'       => $late,
                    'absent'     => $absent,
                    'permission' => $permission,
                ],
                'attendance_percent' => $attPercent,
            ];
        }
        
        respond([
            'subject'     => $subject,
            'total_weeks' => $total_weeks,
            'results'     => $result,
        ]);
    }
    
    respond([]);
}

// ============================================================
// POST — រក្សាទុកវត្តមាន
// Body: { subject_id, week, attend_date, records: [{student_id, status, note}] }
// ============================================================
if ($method === 'POST') {
    $d = input();
    
    if (empty($d['records']) || empty($d['subject_id']) || empty($d['week'])) {
        respond(['error' => 'ខ្វះទិន្នន័យ'], 400);
    }
    
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO attendance 
             (subject_id, student_id, week_no, attend_date, status, note, recorded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                status = VALUES(status),
                note = VALUES(note),
                attend_date = VALUES(attend_date)"
        );
        
        foreach ($d['records'] as $rec) {
            $stmt->execute([
                (int)$d['subject_id'],
                (int)$rec['student_id'],
                (int)$d['week'],
                !empty($d['attend_date']) ? $d['attend_date'] : null,
                $rec['status'],
                $rec['note'] ?? null,
                null,
            ]);
        }
        
        $pdo->commit();
        respond([
            'success' => true,
            'count'   => count($d['records']),
            'message' => '✅ រក្សាទុកវត្តមានជោគជ័យ',
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 500);
    }
}

respond(['error' => 'Method not allowed'], 405);
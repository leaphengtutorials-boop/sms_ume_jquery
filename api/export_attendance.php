<?php
/**
 * ============================================================
 * EXPORT ATTENDANCE — ទាញរបាយការណ៍វត្តមានជា Excel
 * ============================================================
 * 
 * GET /export_attendance.php?subject_id=X
 * Returns: Excel file (.xls — HTML table)
 */

require 'config.php';

$subject_id = (int)($_GET['subject_id'] ?? 0);
if (!$subject_id) die('subject_id required');

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
if (!$subject) die('Subject not found');

// ============================================================
// បញ្ជីសិស្ស (active)
// ============================================================
$stmt = $pdo->prepare(
    "SELECT st.* FROM enrollments e
     JOIN students st ON e.student_id = st.id
     WHERE e.subject_id = ? AND e.is_active = 1 AND e.status = 'active'
     ORDER BY st.student_code"
);
$stmt->execute([$subject_id]);
$students = $stmt->fetchAll();

// ============================================================
// Attendance Map
// ============================================================
$att = $pdo->prepare(
    "SELECT student_id, week_no, status FROM attendance WHERE subject_id = ?"
);
$att->execute([$subject_id]);
$attMap = [];
foreach ($att->fetchAll() as $row) {
    $attMap[$row['student_id']][$row['week_no']] = $row['status'];
}

$total_weeks = (int)$subject['total_weeks'];

// ============================================================
// Helper: Status → Symbol
// ============================================================
function statusCode($status) {
    switch ($status) {
        case 'present':    return '✓';
        case 'late':       return 'L';
        case 'absent':     return 'A';
        case 'permission': return 'P';
        default:           return '';
    }
}

// ============================================================
// Excel Headers (HTML table)
// ============================================================
header('Content-Type: application/vnd.ms-excel; charset=utf-8');
header('Content-Disposition: attachment; filename="attendance_' . $subject['subject_code'] . '_' . date('Ymd') . '.xls"');
header('Cache-Control: max-age=0');

echo "\xEF\xBB\xBF";  // BOM
?>
<html>
<head><meta charset="UTF-8"></head>
<body>
<table border="1" cellpadding="4">

    <!-- Title Row -->
    <tr>
        <td colspan="<?= 3 + $total_weeks + 3 ?>" style="background:#6366f1;color:white;font-size:16pt;text-align:center;padding:12px;font-weight:bold;">
            📊 របាយការណ៍វត្តមាន — <?= htmlspecialchars($subject['subject_name']) ?>
        </td>
    </tr>

    <!-- Sub Info -->
    <tr>
        <td colspan="<?= 3 + $total_weeks + 3 ?>" style="background:#f8fafc;text-align:center;padding:6px;color:#64748b;">
            លេខកូដ: <?= htmlspecialchars($subject['subject_code']) ?> · 
            ឆ្នាំ: <?= htmlspecialchars($subject['year_name'] ?? '') ?> · 
            សប្តាហ៍: <?= $total_weeks ?> · 
            កាលបរិច្ឆេទ: <?= date('d/m/Y') ?>
        </td>
    </tr>

    <!-- Header Row -->
    <tr style="background:#6366f1;color:white;font-weight:bold;">
        <td>N°</td>
        <td>លេខកូដ</td>
        <td>ឈ្មោះ</td>
        <?php for ($i = 1; $i <= $total_weeks; $i++): ?>
            <td>W<?= $i ?></td>
        <?php endfor; ?>
        <td>Count A</td>
        <td>Count P</td>
        <td>ពិន្ទុវត្តមាន</td>
    </tr>

    <!-- Data Rows -->
    <?php
    $totA = 0;
    $totP = 0;
    foreach ($students as $idx => $stu):
        $present = 0; $late = 0; $permission = 0; $absent = 0;
        for ($w = 1; $w <= $total_weeks; $w++) {
            $st = $attMap[$stu['id']][$w] ?? 'absent';
            if ($st === 'present') $present++;
            elseif ($st === 'late') $late++;
            elseif ($st === 'permission') $permission++;
            else $absent++;
        }
        
        $attPercent = 100 
            - ($absent * (100 / max(1, $total_weeks)))
            - ($permission * (100 / max(1, $total_weeks * 2)));
        $attPercent = max(0, min(100, round($attPercent, 2)));
        
        $totA += $absent;
        $totP += $present;
    ?>
    <tr>
        <td><?= $idx + 1 ?></td>
        <td><b><?= htmlspecialchars($stu['student_code']) ?></b></td>
        <td><?= htmlspecialchars($stu['full_name']) ?></td>
        <?php for ($w = 1; $w <= $total_weeks; $w++):
            $st = $attMap[$stu['id']][$w] ?? 'absent';
        ?>
            <td style="text-align:center;"><?= statusCode($st) ?></td>
        <?php endfor; ?>
        <td style="background:#fee2e2;font-weight:bold;text-align:center;"><?= $absent ?></td>
        <td style="background:#dbeafe;font-weight:bold;text-align:center;"><?= $permission ?></td>
        <td style="background:#eef2ff;font-weight:bold;color:#4f46e5;text-align:center;"><?= $attPercent ?></td>
    </tr>
    <?php endforeach; ?>

    <!-- Summary -->
    <tr style="background:#f1f5f9;font-weight:bold;">
        <td colspan="3">សរុប</td>
        <?php for ($w = 1; $w <= $total_weeks; $w++): ?><td></td><?php endfor; ?>
        <td style="text-align:center;"><?= $totA ?></td>
        <td></td>
        <td></td>
    </tr>

    <!-- Legend -->
    <tr>
        <td colspan="<?= 3 + $total_weeks + 3 ?>" style="background:#fffbeb;font-size:10pt;text-align:left;padding:8px;">
            <b>📖 តំណាង៖</b> ✓ = មាន | L = យឺត | P = ច្បាប់ | A = អវត្តមាន<br>
            <b>📐 រូបមន្ត៖</b> ពិន្ទុវត្តមាន = 100 - (A × 100/<?= $total_weeks ?>) - (P × 100/<?= $total_weeks * 2 ?>)
        </td>
    </tr>

</table>
</body>
</html>
<?php exit; ?>
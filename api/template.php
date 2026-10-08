<?php
/**
 * ============================================================
 * TEMPLATE — ទាញ CSV Template សម្រាប់ Import
 * ============================================================
 * 
 * GET /template.php
 * Returns: CSV file download
 * 
 * Columns:
 *   student_code, full_name, gender, cohort_name, entry_year_name,
 *   status, dob, phone, email, address, subject_codes
 */

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="template_students_import.csv"');

// UTF-8 BOM សម្រាប់ Excel
echo "\xEF\xBB\xBF";

$out = fopen('php://output', 'w');

// ============================================================
// Header Row
// ============================================================
fputcsv($out, [
    'student_code',
    'full_name',
    'gender',
    'cohort_name',
    'entry_year_name',
    'status',
    'dob',
    'phone',
    'email',
    'address',
    'subject_codes',
]);

// ============================================================
// Sample Rows
// ============================================================
fputcsv($out, [
    'S101', 'សុខ សុភា', 'F', 'ជំនាន់ទី ៣', '2025-2026', 'active',
    '2006-01-15', '012345678', 'sok.s@student.edu', 'ភ្នំពេញ', 'AND101,WEB01',
]);

fputcsv($out, [
    'S102', 'ចាន់ ដារា', 'M', 'ជំនាន់ទី ៣', '2025-2026', 'active',
    '2006-03-20', '098765432', 'chan.d@student.edu', 'កណ្តាល', 'WEB01,WEB301',
]);

fputcsv($out, [
    'S103', 'លី ម៉េង', 'M', 'ជំនាន់ទី ២', '2024-2025', 'graduated',
    '2005-05-10', '011223344', '', 'សៀមរាប', '',
]);

fclose($out);
exit;
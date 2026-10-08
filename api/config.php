<?php
/**
 * ============================================================
 * CONFIG — Database + Helpers
 * ============================================================
 */

error_reporting(0);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$DB_HOST = 'localhost';
$DB_NAME = 'ume_db';
$DB_USER = 'root';
$DB_PASS = '';

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER, $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'DB: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit();
}

function respond($data, $code = 200) {
    if (ob_get_length()) ob_end_clean();
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit();
}

function input() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

set_exception_handler(function ($e) {
    if (ob_get_length()) ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Exception: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit();
});

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error: $errstr in $errfile on line $errline");
    return true;
});
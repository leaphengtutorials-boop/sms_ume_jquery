-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 06, 2026 at 07:33 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ume_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_years`
--

CREATE TABLE `academic_years` (
  `id` int(11) NOT NULL,
  `year_name` varchar(50) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `academic_years`
--

INSERT INTO `academic_years` (`id`, `year_name`, `start_date`, `end_date`, `is_active`, `created_at`) VALUES
(1, '2023-2024', '2023-10-01', '2024-07-31', 0, '2026-10-06 15:11:17'),
(2, '2024-2025', '2024-10-01', '2025-07-31', 0, '2026-10-06 15:11:17'),
(3, '2025-2026', '2025-10-01', '2026-07-31', 1, '2026-10-06 15:11:17'),
(5, '2026-2027', '2026-10-06', '2026-12-31', 1, '2026-10-06 16:29:34');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `week_no` tinyint(4) NOT NULL,
  `attend_date` date DEFAULT NULL,
  `status` enum('present','late','absent','permission') DEFAULT 'absent',
  `note` varchar(255) DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `subject_id`, `student_id`, `week_no`, `attend_date`, `status`, `note`, `recorded_by`, `updated_at`) VALUES
(1, 2, 1, 1, '2026-10-06', 'late', '', NULL, '2026-10-06 16:13:46'),
(2, 2, 2, 1, '2026-10-06', 'absent', '', NULL, '2026-10-06 16:13:46'),
(3, 2, 3, 1, '2026-10-06', 'absent', '', NULL, '2026-10-06 16:13:46'),
(4, 2, 1, 2, '2026-10-06', 'present', '', NULL, '2026-10-06 16:25:21'),
(5, 2, 2, 2, '2026-10-06', 'present', '', NULL, '2026-10-06 16:25:21'),
(6, 2, 3, 2, '2026-10-06', 'present', '', NULL, '2026-10-06 16:25:21');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_rules`
--

CREATE TABLE `attendance_rules` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `present_score` decimal(5,2) DEFAULT 1.00,
  `late_deduction` decimal(5,2) DEFAULT 0.50,
  `absent_deduction` decimal(5,2) DEFAULT 1.00,
  `permission_deduction` decimal(5,2) DEFAULT 0.30,
  `allow_negative` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_rules`
--

INSERT INTO `attendance_rules` (`id`, `subject_id`, `present_score`, `late_deduction`, `absent_deduction`, `permission_deduction`, `allow_negative`) VALUES
(1, 1, 1.00, 0.50, 1.00, 0.30, 0),
(2, 2, 1.00, 0.50, 1.00, 0.30, 0),
(3, 3, 1.00, 0.50, 1.00, 0.30, 0),
(4, 4, 1.00, 0.50, 1.00, 0.30, 0),
(5, 5, 1.00, 0.50, 1.00, 0.30, 0),
(6, 6, 1.00, 0.50, 1.00, 0.30, 0);

-- --------------------------------------------------------

--
-- Table structure for table `cohorts`
--

CREATE TABLE `cohorts` (
  `id` int(11) NOT NULL,
  `cohort_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_current` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cohorts`
--

INSERT INTO `cohorts` (`id`, `cohort_name`, `description`, `is_active`, `is_current`, `created_at`) VALUES
(1, 'ជំនាន់ទី ១', 'និស្សិតឆ្នាំ 2023', 1, 0, '2026-10-06 15:11:17'),
(2, 'ជំនាន់ទី ២', 'និស្សិតឆ្នាំ 2024', 1, 0, '2026-10-06 15:11:17'),
(3, 'ជំនាន់ទី ៣', 'និស្សិតឆ្នាំ 2025', 1, 0, '2026-10-06 15:11:17'),
(4, 'ជំនាន់ទី ៤', '', 1, 1, '2026-10-06 16:28:13');

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `study_year` tinyint(1) NOT NULL DEFAULT 1,
  `semester` tinyint(1) NOT NULL DEFAULT 1,
  `enrolled_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `status` enum('active','completed','dropped') NOT NULL DEFAULT 'active',
  `completed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`id`, `student_id`, `subject_id`, `study_year`, `semester`, `enrolled_at`, `is_active`, `status`, `completed_at`) VALUES
(10, 7, 3, 1, 1, '2026-10-06 15:11:17', 1, 'active', NULL),
(11, 8, 3, 1, 1, '2026-10-06 15:11:17', 1, 'active', NULL),
(12, 9, 3, 1, 1, '2026-10-06 15:11:17', 1, 'active', NULL),
(25, 1, 1, 1, 1, '2026-10-06 17:09:24', 1, 'completed', '2026-10-06 19:09:24'),
(26, 2, 1, 1, 1, '2026-10-06 17:09:24', 1, 'completed', '2026-10-06 19:09:24'),
(27, 3, 1, 1, 1, '2026-10-06 17:09:24', 1, 'completed', '2026-10-06 19:09:24'),
(28, 4, 1, 1, 1, '2026-10-06 17:09:24', 1, 'completed', '2026-10-06 19:09:24'),
(29, 5, 1, 1, 1, '2026-10-06 17:09:24', 1, 'completed', '2026-10-06 19:09:24'),
(30, 6, 1, 1, 1, '2026-10-06 17:09:24', 1, 'completed', '2026-10-06 19:09:24'),
(31, 11, 1, 1, 1, '2026-10-06 17:31:27', 1, 'active', NULL),
(34, 12, 3, 1, 1, '2026-10-06 17:31:27', 1, 'active', NULL),
(35, 15, 2, 1, 1, '2026-10-06 17:33:07', 1, 'active', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `homework`
--

CREATE TABLE `homework` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `cohort_id` int(11) DEFAULT NULL,
  `type` enum('homework','quiz','assignment') DEFAULT 'homework',
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `max_score` decimal(5,2) DEFAULT 100.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `homework`
--

INSERT INTO `homework` (`id`, `subject_id`, `cohort_id`, `type`, `title`, `description`, `due_date`, `max_score`, `created_at`) VALUES
(1, 2, 3, 'homework', 'h1', '', NULL, 100.00, '2026-10-06 16:14:04'),
(2, 2, 3, 'quiz', 'q1', '', NULL, 100.00, '2026-10-06 16:26:17'),
(3, 2, 3, 'assignment', 'ass', '', NULL, 100.00, '2026-10-06 16:26:34');

-- --------------------------------------------------------

--
-- Table structure for table `homework_submissions`
--

CREATE TABLE `homework_submissions` (
  `id` int(11) NOT NULL,
  `homework_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submitted` tinyint(1) DEFAULT 0,
  `score` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `homework_submissions`
--

INSERT INTO `homework_submissions` (`id`, `homework_id`, `student_id`, `submitted`, `score`) VALUES
(1, 1, 1, 1, 100.00),
(2, 1, 2, 1, 100.00),
(3, 1, 3, 1, 100.00),
(7, 2, 1, 1, 100.00),
(8, 2, 2, 1, 100.00),
(9, 2, 3, 1, 100.00),
(10, 3, 1, 1, 100.00),
(11, 3, 2, 1, 100.00),
(12, 3, 3, 1, 100.00);

-- --------------------------------------------------------

--
-- Table structure for table `scores`
--

CREATE TABLE `scores` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `score_type` enum('homework','quiz','midterm','assignment','final') NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `score` decimal(5,2) DEFAULT 0.00,
  `max_score` decimal(5,2) DEFAULT 100.00,
  `exam_date` date DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `scores`
--

INSERT INTO `scores` (`id`, `subject_id`, `student_id`, `score_type`, `title`, `score`, `max_score`, `exam_date`, `note`, `created_at`) VALUES
(1, 2, 1, 'midterm', 'Midterm Exam', 50.00, 100.00, '2026-10-06', NULL, '2026-10-06 16:25:03'),
(2, 2, 2, 'midterm', 'Midterm Exam', 60.00, 100.00, '2026-10-06', NULL, '2026-10-06 16:25:03'),
(3, 2, 3, 'midterm', 'Midterm Exam', 70.00, 100.00, '2026-10-06', NULL, '2026-10-06 16:25:03');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `student_code` varchar(30) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `gender` enum('M','F') NOT NULL,
  `cohort_id` int(11) DEFAULT NULL,
  `entry_year_id` int(11) DEFAULT NULL,
  `status` enum('active','graduated','dropped','pending') NOT NULL DEFAULT 'active',
  `dob` date DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `student_code`, `full_name`, `gender`, `cohort_id`, `entry_year_id`, `status`, `dob`, `photo`, `phone`, `email`, `address`, `created_at`) VALUES
(1, 'S001', 'សុខ ដារា', 'M', 3, 3, 'graduated', NULL, NULL, '012345678', '', '', '2026-10-06 15:11:17'),
(2, 'S002', 'ចាន់ សុភា', 'F', 3, 3, 'graduated', NULL, NULL, '098765432', NULL, NULL, '2026-10-06 15:11:17'),
(3, 'S003', 'លី ម៉េង', 'M', 3, 3, 'graduated', NULL, NULL, '011223344', NULL, NULL, '2026-10-06 15:11:17'),
(4, 'S004', 'ហេង សុវណ្ណ', 'F', 3, 3, 'graduated', NULL, NULL, '015556677', NULL, NULL, '2026-10-06 15:11:17'),
(5, 'S005', 'គង់ រតនា', 'M', 3, 3, 'graduated', NULL, NULL, '088778899', NULL, NULL, '2026-10-06 15:11:17'),
(6, 'S006', 'ព្រាប សុភាព', 'F', 3, 3, 'graduated', NULL, NULL, '096112233', '', '', '2026-10-06 15:11:17'),
(7, 'S007', 'មាស ធារី', 'F', 2, 2, 'graduated', NULL, NULL, '012667788', NULL, NULL, '2026-10-06 15:11:17'),
(8, 'S008', 'សេង ហុង', 'M', 2, 2, 'graduated', NULL, NULL, '017889900', NULL, NULL, '2026-10-06 15:11:17'),
(9, 'S009', 'ញ៉ែម ចន្ធា', 'F', 2, 2, 'graduated', NULL, NULL, '088556677', NULL, NULL, '2026-10-06 15:11:17'),
(10, 'S010', 'ទូច សុវណ្ណ', 'M', 1, 1, 'graduated', NULL, NULL, '015334455', NULL, NULL, '2026-10-06 15:11:17'),
(11, 'S101', 'សុខ សុភា', 'F', 3, 3, 'active', '2006-01-15', NULL, '012345678', 'sok.s@student.edu', 'ភ្នំពេញ', '2026-10-06 17:31:26'),
(12, 'S102', 'ចាន់ ដារា', 'M', 3, 3, 'active', '2006-03-20', NULL, '098765432', 'chan.d@student.edu', 'កណ្តាល', '2026-10-06 17:31:27'),
(13, 'S103', 'លី ម៉េង', 'M', 2, 2, 'graduated', '2005-05-10', NULL, '011223344', '', 'សៀមរាប', '2026-10-06 17:31:27'),
(15, 'S00645', 'ដថងស', 'M', 4, 5, 'active', NULL, NULL, '', '', '', '2026-10-06 17:32:31');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `subject_code` varchar(30) NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `study_year` tinyint(1) NOT NULL DEFAULT 1,
  `semester` tinyint(1) NOT NULL DEFAULT 1,
  `teacher_id` int(11) DEFAULT NULL,
  `total_weeks` tinyint(4) DEFAULT 15,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `subject_code`, `subject_name`, `academic_year_id`, `study_year`, `semester`, `teacher_id`, `total_weeks`, `description`, `is_active`, `created_at`) VALUES
(1, 'AND101', 'Android Programming', 3, 1, 1, NULL, 15, NULL, 1, '2026-10-06 15:11:17'),
(2, 'WEB01', 'Web Design', 3, 1, 1, NULL, 13, NULL, 1, '2026-10-06 15:11:17'),
(3, 'WEB301', 'Web Development Advance', 3, 1, 1, NULL, 15, NULL, 1, '2026-10-06 15:11:17'),
(4, 'NET401', 'Dot Net', 3, 1, 1, NULL, 13, NULL, 1, '2026-10-06 15:11:17'),
(5, 'AND201', 'Android Advance', 2, 1, 1, NULL, 15, NULL, 1, '2026-10-06 15:11:17'),
(6, 'WEB0២', 'Web Design', 5, 1, 1, NULL, 15, '', 1, '2026-10-06 16:31:43');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('admin','teacher') DEFAULT 'teacher',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `email`, `role`, `created_at`) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'អ្នកគ្រប់គ្រង', 'admin@school.edu', 'admin', '2026-10-06 15:11:17'),
(2, 'teacher1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'លោកគ្រូ សុខ', 't1@school.edu', 'teacher', '2026-10-06 15:11:17');

-- --------------------------------------------------------

--
-- Table structure for table `weights`
--

CREATE TABLE `weights` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `attendance_weight` decimal(5,2) DEFAULT 10.00,
  `homework_weight` decimal(5,2) DEFAULT 10.00,
  `quiz_weight` decimal(5,2) DEFAULT 10.00,
  `midterm_weight` decimal(5,2) DEFAULT 20.00,
  `assignment_weight` decimal(5,2) DEFAULT 15.00,
  `final_weight` decimal(5,2) DEFAULT 35.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `weights`
--

INSERT INTO `weights` (`id`, `subject_id`, `attendance_weight`, `homework_weight`, `quiz_weight`, `midterm_weight`, `assignment_weight`, `final_weight`) VALUES
(1, 1, 10.00, 10.00, 10.00, 20.00, 15.00, 35.00),
(2, 2, 10.00, 10.00, 10.00, 20.00, 15.00, 35.00),
(3, 3, 10.00, 10.00, 10.00, 20.00, 15.00, 35.00),
(4, 4, 10.00, 10.00, 10.00, 20.00, 15.00, 35.00),
(5, 5, 10.00, 10.00, 10.00, 20.00, 15.00, 35.00),
(6, 6, 10.00, 10.00, 10.00, 20.00, 15.00, 35.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `year_name` (`year_name`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_attendance` (`subject_id`,`student_id`,`week_no`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `attendance_rules`
--
ALTER TABLE `attendance_rules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subject_id` (`subject_id`);

--
-- Indexes for table `cohorts`
--
ALTER TABLE `cohorts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cohort_name` (`cohort_name`),
  ADD KEY `idx_current` (`is_current`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_enrollment` (`student_id`,`subject_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `idx_enroll_status` (`status`),
  ADD KEY `idx_enroll_sem` (`student_id`,`study_year`,`semester`);

--
-- Indexes for table `homework`
--
ALTER TABLE `homework`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `cohort_id` (`cohort_id`);

--
-- Indexes for table `homework_submissions`
--
ALTER TABLE `homework_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_sub` (`homework_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `scores`
--
ALTER TABLE `scores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `idx_type` (`subject_id`,`student_id`,`score_type`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_code` (`student_code`),
  ADD KEY `idx_cohort` (`cohort_id`),
  ADD KEY `idx_entry_year` (`entry_year_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subject_code` (`subject_code`),
  ADD KEY `academic_year_id` (`academic_year_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `idx_year_sem` (`study_year`,`semester`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `weights`
--
ALTER TABLE `weights`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subject_id` (`subject_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_years`
--
ALTER TABLE `academic_years`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `attendance_rules`
--
ALTER TABLE `attendance_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `cohorts`
--
ALTER TABLE `cohorts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `homework`
--
ALTER TABLE `homework`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `homework_submissions`
--
ALTER TABLE `homework_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `scores`
--
ALTER TABLE `scores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `weights`
--
ALTER TABLE `weights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance_rules`
--
ALTER TABLE `attendance_rules`
  ADD CONSTRAINT `attendance_rules_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `homework`
--
ALTER TABLE `homework`
  ADD CONSTRAINT `homework_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `homework_ibfk_2` FOREIGN KEY (`cohort_id`) REFERENCES `cohorts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `homework_submissions`
--
ALTER TABLE `homework_submissions`
  ADD CONSTRAINT `homework_submissions_ibfk_1` FOREIGN KEY (`homework_id`) REFERENCES `homework` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `homework_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `scores`
--
ALTER TABLE `scores`
  ADD CONSTRAINT `scores_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_stu_cohort` FOREIGN KEY (`cohort_id`) REFERENCES `cohorts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_stu_year` FOREIGN KEY (`entry_year_id`) REFERENCES `academic_years` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subjects_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `weights`
--
ALTER TABLE `weights`
  ADD CONSTRAINT `weights_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

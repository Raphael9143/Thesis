-- Xóa bảng class_students nếu đã tồn tại (chỉ dùng khi không cần giữ dữ liệu)
DROP TABLE IF EXISTS class_students;

-- Tạo bảng class_students với các trường đúng chuẩn N-N
CREATE TABLE IF NOT EXISTS class_students (
	id INT AUTO_INCREMENT PRIMARY KEY,
	class_id INT NOT NULL,
	student_id INT NOT NULL,
	role ENUM('student','leader') DEFAULT 'student',
	joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
	CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Tạo database thesis_db
CREATE DATABASE IF NOT EXISTS thesis_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sử dụng database
USE thesis_db;

SHOW TABLES;

-- Tạo bảng classes với các trường theo yêu cầu API
CREATE TABLE IF NOT EXISTS classes (
	id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	code VARCHAR(50) NOT NULL UNIQUE,
	description TEXT,
	teacher_id INT NOT NULL,
	semester VARCHAR(50),
	year INT,
	max_students INT DEFAULT NULL,
	status ENUM('draft','active','in_progress','closed','archived','cancelled') NOT NULL DEFAULT 'draft',
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_teacher FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Tạo bảng students
DROP TABLE IF EXISTS students;
CREATE TABLE IF NOT EXISTS students (
	student_id INT PRIMARY KEY,
	student_code VARCHAR(50) NOT NULL UNIQUE,
	major VARCHAR(100),
	year INT,
	completed_assignments INT DEFAULT 0,
	gpa FLOAT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_student_user FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
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
-- Tạo bảng users với các trường chuẩn hóa
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
	id INT AUTO_INCREMENT PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	email VARCHAR(100) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	role ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
	avatar_url VARCHAR(255),
	gender ENUM('MALE', 'FEMALE', 'OTHER'),
	dob DATE,
	phone_number VARCHAR(20),
	address VARCHAR(255),
	status ENUM('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION') NOT NULL DEFAULT 'ACTIVE',
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE DATABASE IF NOT EXISTS thesis_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
-- Tạo bảng teachers
DROP TABLE IF EXISTS teachers;
CREATE TABLE IF NOT EXISTS teachers (
	teacher_id INT PRIMARY KEY,
	teacher_code VARCHAR(50) NOT NULL UNIQUE,
	department VARCHAR(100),
	expertise JSON,
	research_papers JSON,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_teacher_user FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
-- Thêm ràng buộc teacher_id trong bảng classes
ALTER TABLE classes
	ADD CONSTRAINT fk_teacher_profile FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE ON UPDATE CASCADE;

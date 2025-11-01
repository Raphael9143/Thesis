const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Researcher = require('./models/Researcher');
const Course = require('./models/Course');
const Class = require('./models/Class');
const ClassCourse = require('./models/ClassCourse');
const ClassStudent = require('./models/ClassStudent');
const Assignment = require('./models/Assignment');
const Lecture = require('./models/Lecture');
const Exam = require('./models/Exam');
const AssignmentCourse = require('./models/AssignmentCourse');

async function initDatabase() {
	await User.create({
		full_name: 'Admin',
		email: 'admin@example.com',
		password: await bcrypt.hash('admin123', 10),
		role: 'ADMIN',
		status: 'ACTIVE'
	});

	const teacherUser = await User.create({
		full_name: 'Nguyen Van A',
		email: 'teacher1@example.com',
		password: await bcrypt.hash('teacher123', 10),
		role: 'TEACHER',
		status: 'ACTIVE'
	});

	const teacher = await Teacher.create({
		teacher_id: teacherUser.id,
		teacher_code: 'GV001',
		department: 'Computer Science'
	});

	const studentUser = await User.create({
		full_name: 'Le Thi B',
		email: 'student1@example.com',
		password: await bcrypt.hash('student123', 10),
		role: 'STUDENT',
		status: 'ACTIVE'
	});
	const student = await Student.create({
		student_id: studentUser.id,
		student_code: 'SV001',
		major: 'Computer Science',
		year: 3
	});

	const researcherUser = await User.create({
		full_name: 'Dr. Tran Van C',
		email: 'researcher1@example.com',
		password: await bcrypt.hash('researcher123', 10),
		role: 'RESEARCHER',
		status: 'ACTIVE'
	});

	const researcher = await Researcher.create({
		researcher_id: researcherUser.id,
		researcher_code: 'RES001',
		department: 'Computer Science',
		field_of_study: 'Artificial Intelligence',
		research_interests: ['Machine Learning', 'Deep Learning', 'Computer Vision'],
		publications: ['AI in Education: A Survey', 'Deep Learning for Image Recognition'],
		current_projects: ['Smart Learning Platform', 'AI-powered Assessment System'],
		academic_rank: 'SENIOR_RESEARCHER',
		years_of_experience: 8
	});

	const course = await Course.create({
		course_name: 'OCL Fundamentals',
		course_code: 'OCL101',
		description: 'A course about OCL fundamentals',
		created_by: teacherUser.id,
		semester: 'Spring 2025',
		start_week: 1,
		end_week: 15,
		status: 'ACTIVE'
	});

	const class1 = await Class.create({
		name: 'OCL Basic',
		code: 'OCL2025',
		description: 'OCL Basic class for 1st year students',
		teacherId: teacherUser.id,
		semester: 'Spring 2025',
		year: 2025,
		max_students: 50,
		status: 'active'
	});

	await ClassCourse.create({
		class_id: class1.id,
		course_id: course.course_id
	});

	await ClassStudent.create({
		classId: class1.id,
		studentId: studentUser.id,
		joinedAt: new Date()
	});

	const assignment = await Assignment.create({
		course_id: course.course_id,
		title: 'Exercise 1: Basic OCL',
		description: 'Learn the basics of OCL programming.',
		created_by: teacherUser.id,
		file: 'uploads/assignments/1761965756726-57902127-sample.use',
		start_date: new Date('2025-09-20T08:00:00Z'),
		end_date: new Date('2025-10-01T23:59:00Z')
	});

	await AssignmentCourse.create({
		assignment_id: assignment.assignment_id,
		course_id: course.course_id,
		start_date: new Date('2025-09-20T08:00:00Z'),
		due_date: new Date('2025-10-01T23:59:00Z'),
		week: 2
	});

	const lecture1 = await Lecture.create({
		course_id: course.course_id,
		teacher_id: teacherUser.id,
		title: 'Lecture 1: Basics of OCL',
		attachments: [
			{
				"url": "/uploads/lectures/test.docx",
				"size": 636531,
				"filename": "test.docx",
				"mimetype": "docx",
				"originalname": "test.docx"
			}
		],
		publish_date: new Date('2025-09-21T08:00:00Z'),
		status: 'published'
	});

	const lecture2 = await Lecture.create({
		course_id: course.course_id,
		teacher_id: teacherUser.id,
		title: 'Reference Materials for OCL',
		attachments: [
			{
				"url": "/uploads/lectures/usecaseSpecification_template.pdf",
				"size": 636531,
				"filename": "usecaseSpecification_template.pdf",
				"mimetype": "pdf",
				"originalname": "usecaseSpecification_template.pdf"
			}
		],
		publish_date: new Date('2025-09-22T08:00:00Z'),
		status: 'published'
	});

	const exam1 = await Exam.create({
		course_id: course.course_id,
		title: 'Midterm Exam',
		description: 'Midterm exam for USE fundamentals',
		start_time: new Date('2025-10-15T09:00:00Z'),
		end_time: new Date('2025-10-15T11:00:00Z'),
		model_file: '/uploads/exams/sample.use'
	});

	console.log('✅ Seeded sample data!');
}

module.exports = initDatabase;

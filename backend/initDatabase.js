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
const Submission = require('./models/Submission');
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
		status: 'ACTIVE'
	});

	const class1 = await Class.create({
		name: 'OCL Basic',
		code: 'OCL2025',
		description: 'OCL Basic class for 1st year students',
		teacherId: teacherUser.id,
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

	for (let i = 2; i <= 30; i++) {
		const email = `student${i}@example.com`;
		const u = await User.create({
			full_name: `Le Thi B ${i}`,
			email,
			password: await bcrypt.hash('student123', 10),
			role: 'STUDENT',
			status: 'ACTIVE'
		});
		await Student.create({
			student_id: u.id,
			student_code: `SV${String(i).padStart(3, '0')}`,
			major: 'Computer Science',
			year: 3
		});
		await ClassStudent.create({
			classId: class1.id,
			studentId: u.id,
			joinedAt: new Date()
		});
	}

	const assignment = await Assignment.create({
		course_id: course.course_id,
		title: 'Exercise 1: Basic OCL',
		description: 'Learn the basics of OCL programming.',
		created_by: teacherUser.id,
		attachment: '/uploads/assignments/sample.use',
		type: 'SINGLE',
		start_date: new Date('2025-09-20T08:00:00Z'),
		end_date: new Date('2025-10-01T23:59:00Z')
	});

	await AssignmentCourse.create({
		assignment_id: assignment.id,
		course_id: course.course_id,
		start_date: new Date('2025-09-20T08:00:00Z'),
		due_date: new Date('2025-10-01T23:59:00Z'),
		week: 2
	});

	const lecture1 = await Lecture.create({
		course_id: course.course_id,
		teacher_id: teacherUser.id,
		title: 'Lecture 1: Basics of OCL',
		attachment: '/uploads/lectures/SYLL.doc',
		publish_date: new Date('2025-09-21T08:00:00Z'),
		status: 'published'
	});

	const lecture2 = await Lecture.create({
		course_id: course.course_id,
		teacher_id: teacherUser.id,
		title: 'Reference Materials for OCL',
		attachment: '/uploads/lectures/usecaseSpecification_template.pdf',
		publish_date: new Date('2025-09-22T08:00:00Z'),
		status: 'published'
	});

	const exam1 = await Exam.create({
		course_id: course.course_id,
		title: 'Midterm Exam',
		description: 'Midterm exam for USE fundamentals',
		start_date: new Date('2025-10-15T09:00:00Z'),
		end_date: new Date('2025-10-15T11:00:00Z'),
		type: 'SINGLE',
		attachment: '/uploads/exams/sample.use'
	});

	// Additional sample assignments
	const assignment2 = await Assignment.create({
		course_id: course.course_id,
		title: 'Exercise 2: Advanced OCL',
		description: 'Advanced exercises to deepen OCL knowledge.',
		created_by: teacherUser.id,
		attachment: '/uploads/assignments/exercise2.use',
		type: 'SINGLE',
		start_date: new Date('2025-10-05T08:00:00Z'),
		end_date: new Date('2025-10-20T23:59:00Z')
	});

	await AssignmentCourse.create({
		assignment_id: assignment2.id,
		course_id: course.course_id,
		start_date: new Date('2025-10-05T08:00:00Z'),
		due_date: new Date('2025-10-20T23:59:00Z'),
		week: 4
	});

	const assignment3 = await Assignment.create({
		course_id: course.course_id,
		title: 'Group Project: OCL Use Case',
		description: 'A group assignment to model a real-world use case with OCL.',
		created_by: teacherUser.id,
		attachment: '/uploads/assignments/group_project.use',
		type: 'GROUP',
		start_date: new Date('2025-10-25T08:00:00Z'),
		end_date: new Date('2025-11-30T23:59:00Z')
	});

	await AssignmentCourse.create({
		assignment_id: assignment3.id,
		course_id: course.course_id,
		start_date: new Date('2025-10-25T08:00:00Z'),
		due_date: new Date('2025-11-30T23:59:00Z'),
		week: 8
	});

	// Final exam sample
	const finalExam = await Exam.create({
		course_id: course.course_id,
		title: 'Final Exam',
		description: 'Comprehensive final exam covering the whole course.',
		start_date: new Date('2025-12-10T09:00:00Z'),
		end_date: new Date('2025-12-10T12:00:00Z'),
		type: 'SINGLE',
		attachment: '/uploads/exams/final_exam.use'
	});

	// Sample submission (student submitted to the assignment)
	await Submission.create({
		assignment_id: assignment.id,
		exam_id: null,
		student_id: studentUser.id,
		submission_time: new Date(),
		attempt_number: 1,
		attachment: '/uploads/submission/sample.use',
		created_at: new Date()
	});

	// Additional sample submissions by other students (mix of assignment and exam)
	const { Op } = require('sequelize');
	const otherStudents = await Student.findAll({ where: { student_id: { [Op.ne]: studentUser.id } }, limit: 8 });
	for (let i = 0; i < otherStudents.length; i++) {
		const s = otherStudents[i];
		if (i % 4 === 0) {
			// assignment2 submission
			await Submission.create({ assignment_id: assignment2.id, exam_id: null, student_id: s.student_id, submission_time: new Date(), attempt_number: 1, attachment: '/uploads/submission/sample.use', created_at: new Date() });
		} else if (i % 4 === 1) {
			// assignment3 submission
			await Submission.create({ assignment_id: assignment3.id, exam_id: null, student_id: s.student_id, submission_time: new Date(), attempt_number: 1, attachment: '/uploads/submission/sample.use', created_at: new Date() });
		} else if (i % 4 === 2) {
			// midterm exam submission
			await Submission.create({ assignment_id: null, exam_id: exam1.id, student_id: s.student_id, submission_time: new Date(), attempt_number: 1, attachment: '/uploads/submission/sample.use', created_at: new Date() });
		} else {
			// final exam submission
			await Submission.create({ assignment_id: null, exam_id: finalExam.id, student_id: s.student_id, submission_time: new Date(), attempt_number: 1, attachment: '/uploads/submission/sample.use', created_at: new Date() });
		}
	}

	console.log('✅ Seeded sample data!');
}

module.exports = initDatabase;

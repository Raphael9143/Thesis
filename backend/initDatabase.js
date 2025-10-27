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

async function initDatabase() {
    // 1. Admin
    await User.create({
        full_name: 'Admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
        status: 'ACTIVE'
    });

    // 2. Teacher
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
        department: 'CNTT'
    });

    // 3. Student
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
        major: 'Khoa học máy tính',
        year: 3
    });

    // 4. Researcher
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
        department: 'Khoa học máy tính',
        field_of_study: 'Artificial Intelligence',
        research_interests: ['Machine Learning', 'Deep Learning', 'Computer Vision'],
        publications: ['AI in Education: A Survey', 'Deep Learning for Image Recognition'],
        current_projects: ['Smart Learning Platform', 'AI-powered Assessment System'],
        academic_rank: 'SENIOR_RESEARCHER',
        years_of_experience: 8
    });

    // 5. Course
    const course = await Course.create({
        course_name: 'Lập trình Web',
        course_code: 'WEB101',
        description: 'Môn học về lập trình web',
        created_by: teacherUser.id,
        semester: 'Spring 2025',
        start_week: 1,
        end_week: 15,
        status: 'ACTIVE'
    });

    // 6. Class
    const class1 = await Class.create({
        name: 'Web 2025 Nhóm 1',
        code: 'WEB2025-1',
        description: 'Lớp học Web cho sinh viên năm 3',
        teacherId: teacherUser.id,
        semester: 'Spring 2025',
        year: 2025,
        max_students: 50,
        status: 'active'
    });

    // 7. Gán course vào class (ClassCourse)
    await ClassCourse.create({
        class_id: class1.id,
        course_id: course.course_id
    });

    // 8. Thêm sinh viên vào lớp (ClassStudent)
    await ClassStudent.create({
        classId: class1.id,
        studentId: studentUser.id,
        joinedAt: new Date()
    });

    // 9. Assignment mẫu
    const assignment = await Assignment.create({
        title: 'Bài tập 1: HTML cơ bản',
        description: 'Tạo một trang web HTML đơn giản.',
        type: 'EXERCISE',
        created_by: teacherUser.id,
        difficulty: 'EASY',
        file: null
    });
    // Ánh xạ assignment với course
    const AssignmentCourse = require('./models/AssignmentCourse');
    await AssignmentCourse.create({
        assignment_id: assignment.assignment_id,
        course_id: course.course_id,
        start_date: new Date('2025-09-20T08:00:00Z'),
        due_date: new Date('2025-10-01T23:59:00Z'),
        week: 2
    });

    // 10. Lecture mẫu: bài giảng gán cho lớp cụ thể
    const lecture1 = await Lecture.create({
        course_id: course.course_id,
        class_id: class1.id,
        teacher_id: teacherUser.id,
        title: 'Bài giảng 1: Giới thiệu HTML',
        attachments: [
            { type: 'pdf', filename: 'test', url: '/uploads/lectures/test.docx' }
        ],
        publish_date: new Date('2025-09-21T08:00:00Z'),
        status: 'published'
    });

    // 11. Lecture mẫu: bài giảng theo course (không gán lớp cụ thể)
    const lecture2 = await Lecture.create({
        course_id: course.course_id,
        class_id: null,
        teacher_id: teacherUser.id,
        title: 'Bài giảng chung: Tài nguyên tham khảo',
        attachments: [
            { type: 'link', description: 'Slides mở rộng', url: 'https://example.com/web-slides' }
        ],
        publish_date: new Date('2025-09-22T08:00:00Z'),
        status: 'published'
    });

    // 12. Exam mẫu
    const exam1 = await Exam.create({
        course_id: course.course_id,
        title: 'Kiểm tra giữa kỳ',
        description: 'Bài kiểm tra giữa kỳ môn Lập trình Web',
        start_time: new Date('2025-10-15T09:00:00Z'),
        end_time: new Date('2025-10-15T11:00:00Z'),
        model_file: '/uploads/exams/sample.use'
    });

    console.log('✅ Đã seed dữ liệu mẫu!');
}

module.exports = initDatabase;

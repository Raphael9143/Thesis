const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Course = require('./models/Course');
const Class = require('./models/Class');
const ClassCourse = require('./models/ClassCourse');
const ClassStudent = require('./models/ClassStudent');
const Assignment = require('./models/Assignment');

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

    // 4. Course
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

    // 5. Class
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

    // 6. Gán course vào class (ClassCourse)
    await ClassCourse.create({
        class_id: class1.id,
        course_id: course.course_id
    });

    // 7. Thêm sinh viên vào lớp (ClassStudent)
    await ClassStudent.create({
        classId: class1.id,
        studentId: studentUser.id,
        joinedAt: new Date()
    });

    // 8. Assignment mẫu
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

    console.log('✅ Đã seed dữ liệu mẫu!');
}

module.exports = initDatabase;

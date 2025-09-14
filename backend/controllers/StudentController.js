const Student = require('../models/Student');
const ClassStudent = require('../models/ClassStudent');
const Class = require('../models/Class');


const StudentController = {
    // Lấy danh sách các lớp đã enrolled của sinh viên hiện tại
    getEnrolledClasses: async (req, res) => {
        try {
            const studentId = req.user.userId;
            // Kiểm tra student tồn tại
            const student = await Student.findByPk(studentId);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found!' });
            }
            // Lấy danh sách class đã enrolled
            const classStudents = await ClassStudent.findAll({
                where: { student_id: studentId },
                include: [{ model: Class }]
            });
            const classes = classStudents.map(cs => cs.Class);
            res.json({ success: true, data: { classes } });
        } catch (error) {
            console.error('Get enrolled classes error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Lấy thông tin profile sinh viên hiện tại
    getProfile: async (req, res) => {
        try {
            const studentId = req.user.userId;
            const student = await Student.findByPk(studentId);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found!' });
            }
            res.json({ success: true, data: student });
        } catch (error) {
            console.error('Get student profile error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Sửa thông tin profile sinh viên hiện tại
    updateProfile: async (req, res) => {
        try {
            const studentId = req.user.userId;
            const { student_code, major, year, completed_assignments, gpa } = req.body;
            const student = await Student.findByPk(studentId);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found!' });
            }
            // Cập nhật các trường cho phép
            if (student_code !== undefined) student.student_code = student_code;
            if (major !== undefined) student.major = major;
            if (year !== undefined) student.year = year;
            if (completed_assignments !== undefined) student.completed_assignments = completed_assignments;
            if (gpa !== undefined) student.gpa = gpa;
            await student.save();
            res.json({ success: true, message: 'Student profile updated!', data: student });
        } catch (error) {
            console.error('Update student profile error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = StudentController;

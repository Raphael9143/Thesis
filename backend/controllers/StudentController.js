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
    }
};

module.exports = StudentController;

const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const User = require('../models/User');

const TeacherController = {
    // Lấy profile giảng viên hiện tại
    getProfile: async (req, res) => {
        try {
            const userId = req.user.userId;
            // Lấy user
            const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
            if (!user || user.role !== 'TEACHER') {
                return res.status(404).json({ success: false, message: 'Teacher not found!' });
            }
            // Lấy teacher profile
            const teacher = await Teacher.findByPk(userId);
            if (!teacher) {
                return res.status(404).json({ success: false, message: 'Teacher profile not found!' });
            }
            // Lấy các lớp đã/đang dạy
            const courses = await Class.findAll({ where: { teacherId: userId }, attributes: ['id'] });
            res.json({
                success: true,
                data: {
                    ...user.toJSON(),
                    ...teacher.toJSON(),
                    courses_taught: courses.map(c => c.id)
                }
            });
        } catch (error) {
            console.error('Get teacher profile error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = TeacherController;

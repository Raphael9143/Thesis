const Course = require('../models/Course');
const User = require('../models/User');

const CourseController = {
    // Lấy danh sách tất cả môn học
    getAllCourses: async (req, res) => {
        try {
            const courses = await Course.findAll();
            res.json({ success: true, data: courses });
        } catch (error) {
            console.error('Get all courses error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },
    // Tạo môn học mới
    createCourse: async (req, res) => {
        try {
            const { course_name, course_code, description, semester } = req.body;
            if (!course_name || !course_code) {
                return res.status(400).json({ success: false, message: 'course_name và course_code là bắt buộc.' });
            }
            // Chỉ cho phép TEACHER tạo môn học
            const user = await User.findByPk(req.user.userId);
            if (!user || user.role !== 'TEACHER') {
                return res.status(403).json({ success: false, message: 'Chỉ giáo viên mới được tạo môn học.' });
            }
            const created_by = req.user.userId;
            const newCourse = await Course.create({
                course_name,
                course_code,
                description,
                semester,
                created_by,
                created_at: new Date()
            });
            res.status(201).json({ success: true, data: newCourse });
        } catch (error) {
            console.error('Create course error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = CourseController;

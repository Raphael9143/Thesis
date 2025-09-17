const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');

const AssignmentController = {
    // Tạo bài tập mới (chỉ giáo viên)
    createAssignment: async (req, res) => {
        try {
            if (req.user.role !== 'TEACHER') {
                return res.status(403).json({ success: false, message: 'Chỉ giáo viên mới được tạo bài tập.' });
            }
            const { course_id, title, description, type, constraints, difficulty } = req.body;
            if (!course_id || !title || !type || !difficulty) {
                return res.status(400).json({ success: false, message: 'course_id, title, type, difficulty là bắt buộc.' });
            }
            // Kiểm tra course tồn tại
            const course = await Course.findByPk(course_id);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course không tồn tại.' });
            }
            // Xử lý file upload nếu có
            let filePath = null;
            if (req.file) {
                // Lưu đường dẫn file tương đối
                filePath = 'uploads/assignments/' + req.file.filename;
            }
            // Tạo assignment
            const assignment = await Assignment.create({
                course_id,
                title,
                description,
                type,
                constraints,
                created_by: req.user.userId,
                difficulty,
                file: filePath,
                created_at: new Date()
            });
            res.status(201).json({ success: true, data: assignment });
        } catch (error) {
            console.error('Create assignment error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
};

module.exports = AssignmentController;

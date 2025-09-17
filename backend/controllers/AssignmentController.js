const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');
const ClassCourse = require('../models/ClassCourse');

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
    },

    // Lấy tất cả bài tập
    getAllAssignments: async (req, res) => {
        try {
            const assignments = await Assignment.findAll({
                include: [
                    { model: Course, as: 'course', attributes: ['course_id', 'course_name', 'course_code'] },
                    { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
                ],
                order: [['created_at', 'DESC']]
            });
            res.json({ success: true, data: assignments });
        } catch (error) {
            console.error('Get all assignments error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    },
    // Lấy tất cả bài tập theo lớp
    getAssignmentsByClass: async (req, res) => {
        try {
            const { classId } = req.params;
            if (!classId) {
                return res.status(400).json({ success: false, message: 'Thiếu classId.' });
            }
            // Lấy tất cả course_id thuộc class này
            const classCourses = await ClassCourse.findAll({ where: { class_id: classId } });
            const courseIds = classCourses.map(cc => cc.course_id);
            if (courseIds.length === 0) {
                return res.json({ success: true, data: [] });
            }
            // Lấy assignment theo các course_id này
            const assignments = await Assignment.findAll({
                where: { course_id: courseIds },
                include: [
                    { model: Course, as: 'course', attributes: ['course_id', 'course_name', 'course_code'] },
                    { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
                ],
                order: [['created_at', 'DESC']]
            });
            res.json({ success: true, data: assignments });
        } catch (error) {
            console.error('Get assignments by class error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    },
    // Sửa bài tập (chỉ giảng viên đứng lớp chứa bài tập đó)
    updateAssignment: async (req, res) => {
        try {
            if (req.user.role !== 'TEACHER') {
                return res.status(403).json({ success: false, message: 'Chỉ giáo viên mới được sửa bài tập.' });
            }
            const { id } = req.params;
            const assignment = await Assignment.findByPk(id);
            if (!assignment) {
                return res.status(404).json({ success: false, message: 'Assignment không tồn tại.' });
            }
            // Tìm class chứa course này
            const classCourse = await ClassCourse.findOne({ where: { course_id: assignment.course_id } });
            if (!classCourse) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy lớp chứa bài tập này.' });
            }
            const classObj = await Class.findByPk(classCourse.class_id);
            if (!classObj) {
                return res.status(404).json({ success: false, message: 'Lớp không tồn tại.' });
            }
            if (classObj.teacherId !== req.user.userId) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa bài tập này.' });
            }
            // Xử lý file upload nếu có
            let filePath = assignment.file;
            if (req.file) {
                filePath = 'uploads/assignments/' + req.file.filename;
            }
            // Cập nhật assignment
            const fields = ['title', 'description', 'type', 'constraints', 'difficulty'];
            fields.forEach(f => {
                if (req.body[f] !== undefined) assignment[f] = req.body[f];
            });
            assignment.file = filePath;
            await assignment.save();
            res.json({ success: true, data: assignment });
        } catch (error) {
            console.error('Update assignment error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    },
};

module.exports = AssignmentController;

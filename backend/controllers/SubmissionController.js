const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const AssignmentCourse = require('../models/AssignmentCourse');
const Class = require('../models/Class');
const ClassStudent = require('../models/ClassStudent');

const SubmissionController = {
    // Nộp submission của sinh viên
    submitAssignment: async (req, res) => {
        try {
            if (!req.user || req.user.role !== 'STUDENT') {
                return res.status(403).json({ success: false, message: 'Chỉ sinh viên mới được nộp bài.' });
            }
            const { assignment_id, class_id, ocl_constraints } = req.body;
            // Kiểm tra assignment và class tồn tại
            const assignment = await Assignment.findByPk(assignment_id);
            if (!assignment) {
                return res.status(404).json({ success: false, message: 'Assignment không tồn tại.' });
            }
            const classObj = await Class.findByPk(class_id);
            if (!classObj) {
                return res.status(404).json({ success: false, message: 'Class không tồn tại.' });
            }
            // Kiểm tra sinh viên có trong lớp không
            const isMember = await ClassStudent.findOne({ where: { classId: class_id, studentId: req.user.userId } });
            if (!isMember) {
                return res.status(403).json({ success: false, message: 'Bạn không thuộc lớp này.' });
            }
            // Kiểm tra assignment có thuộc class này không (qua assignment_courses)
            const assignmentCourse = await AssignmentCourse.findOne({ where: { assignment_id: assignment_id, course_id: assignment.course_id } });
            if (!assignmentCourse) {
                return res.status(403).json({ success: false, message: 'Bài tập này không thuộc lớp này.' });
            }
            // Xử lý file upload
            let filePath = null;
            if (req.file) {
                filePath = 'uploads/submission/' + req.file.filename;
            }
            // Lần nộp thứ mấy
            const attempt_number = await Submission.count({ where: { class_assignment_id: assignmentCourse.id, student_id: req.user.userId } }) + 1;
            // Tạo submission
            const submission = await Submission.create({
                class_assignment_id: assignmentCourse.id,
                student_id: req.user.userId,
                submission_time: new Date(),
                attempt_number,
                file_path: filePath,
                ocl_constraints,
                status: 'submitted',
                is_final: false,
                created_at: new Date()
            });
            res.status(201).json({ success: true, data: submission });
        } catch (error) {
            console.error('Submit assignment error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    },
};

module.exports = SubmissionController;

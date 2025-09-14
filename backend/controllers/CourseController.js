const Course = require('../models/Course');
const User = require('../models/User');
const ClassCourse = require('../models/ClassCourse');
const Class = require('../models/Class');

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
            const { course_name, course_code, description, semester, class_id, start_week, end_week, status } = req.body;
            if (!course_name || !course_code || !class_id) {
                return res.status(400).json({ success: false, message: 'course_name, course_code và class_id là bắt buộc.' });
            }
            // Chỉ cho phép TEACHER tạo môn học
            const user = await User.findByPk(req.user.userId);
            if (!user || user.role !== 'TEACHER') {
                return res.status(403).json({ success: false, message: 'Chỉ giáo viên mới được tạo môn học.' });
            }
            // Kiểm tra class tồn tại
            const foundClass = await Class.findByPk(class_id);
            if (!foundClass) {
                return res.status(404).json({ success: false, message: 'Class không tồn tại.' });
            }
            // Kiểm tra giáo viên đứng lớp có đúng không
            if (foundClass.teacherId !== user.id) {
                return res.status(403).json({ success: false, message: 'Bạn không phải giáo viên chủ nhiệm của lớp này.' });
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
            // Tạo mapping vào class_courses
            const classCourse = await ClassCourse.create({
                class_id,
                course_id: newCourse.course_id,
                start_week,
                end_week,
                status: status || 'ACTIVE'
            });
            res.status(201).json({ success: true, data: { ...newCourse.toJSON(), class_course: classCourse } });
        } catch (error) {
            console.error('Create course error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },
    // Lấy danh sách môn học theo lớp
    getCoursesByClass: async (req, res) => {
        try {
            const classId = req.params.classId;
            // Kiểm tra class tồn tại
            const foundClass = await Class.findByPk(classId);
            if (!foundClass) {
                return res.status(404).json({ success: false, message: 'Class not found.' });
            }
            // Lấy danh sách courses qua quan hệ N-N
            const courses = await foundClass.getCourses();
            res.json({ success: true, data: courses });
        } catch (error) {
            console.error('Get courses by class error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
    , // Cập nhật thông tin lớp môn học (class_courses)
    updateClassCourse: async (req, res) => {
        try {
            const { id } = req.params; // id của class_course
            const { start_week, end_week, status, name, description } = req.body;
            const userId = req.user.userId;
            const userRole = req.user.role;
            // Tìm class_course
            const classCourse = await ClassCourse.findByPk(id);
            if (!classCourse) {
                return res.status(404).json({ success: false, message: 'ClassCourse not found.' });
            }
            // Lấy thông tin lớp để kiểm tra quyền
            const foundClass = await Class.findByPk(classCourse.class_id);
            if (!foundClass) {
                return res.status(404).json({ success: false, message: 'Class not found.' });
            }
            // Chỉ giáo viên chủ nhiệm hoặc admin mới được sửa
            if (userRole !== 'ADMIN' && foundClass.teacherId !== userId) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật lớp môn học này.' });
            }
            // Cập nhật các trường cho phép
            if (start_week !== undefined) classCourse.start_week = start_week;
            if (end_week !== undefined) classCourse.end_week = end_week;
            if (status !== undefined) classCourse.status = status;
            // Nếu có cập nhật name hoặc description thì cập nhật vào Course
            let updatedCourse = null;
            if (name !== undefined || description !== undefined) {
                const course = await require('../models/Course').findByPk(classCourse.course_id);
                if (!course) {
                    return res.status(404).json({ success: false, message: 'Course not found.' });
                }
                if (name !== undefined) course.course_name = name;
                if (description !== undefined) course.description = description;
                await course.save();
                updatedCourse = course;
            }
            await classCourse.save();
            res.json({ success: true, message: 'Cập nhật thành công!', data: { classCourse, course: updatedCourse } });
        } catch (error) {
            console.error('Update class_course error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },
};

module.exports = CourseController;

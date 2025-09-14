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
            // Validate status cho Course
            let courseStatus = status || 'ACTIVE';
            if (!['ACTIVE', 'INACTIVE'].includes(courseStatus)) {
                return res.status(400).json({ success: false, message: 'Chỉ cho phép status là ACTIVE hoặc INACTIVE.' });
            }
            const newCourse = await Course.create({
                course_name,
                course_code,
                description,
                semester,
                start_week,
                end_week,
                status: courseStatus,
                created_by,
                created_at: new Date()
            });
            // Tạo mapping vào class_courses (chỉ id, class_id, course_id)
            const classCourse = await ClassCourse.create({
                class_id,
                course_id: newCourse.course_id
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
            // Cập nhật vào Course
            const course = await Course.findByPk(classCourse.course_id);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found.' });
            }
            let updated = false;
            if (start_week !== undefined) { course.start_week = start_week; updated = true; }
            if (end_week !== undefined) { course.end_week = end_week; updated = true; }
            if (status !== undefined) {
                if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                    return res.status(400).json({ success: false, message: 'Chỉ cho phép status là ACTIVE hoặc INACTIVE.' });
                }
                course.status = status;
                updated = true;
            }
            if (name !== undefined) { course.course_name = name; updated = true; }
            if (description !== undefined) { course.description = description; updated = true; }
            if (updated) await course.save();
            res.json({ success: true, message: 'Cập nhật thành công!', data: { course } });
        } catch (error) {
            console.error('Update class_course error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },  // Cập nhật status của course
    updateCourseStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ success: false, message: 'Trường status là bắt buộc.' });
            }
            if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Chỉ cho phép status là ACTIVE hoặc INACTIVE.' });
            }
            const course = await Course.findByPk(id);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found.' });
            }
            // Chỉ cho phép ADMIN hoặc người tạo course cập nhật status
            const user = req.user;
            if (user.role !== 'ADMIN' && course.created_by !== user.userId) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật status của course này.' });
            }
            course.status = status;
            await course.save();
            res.json({ success: true, message: 'Cập nhật status thành công!', data: course });
        } catch (error) {
            console.error('Update course status error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },
    // Xóa môn học
    deleteCourse: async (req, res) => {
        try {
            const courseId = req.params.id;
            const user = req.user;
            const course = await Course.findByPk(courseId);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found.' });
            }
            // Chỉ admin hoặc người tạo course mới được xóa
            if (user.role !== 'ADMIN' && course.created_by !== user.userId) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa môn học này.' });
            }
            await course.destroy();
            res.json({ success: true, message: 'Course deleted.' });
        } catch (error) {
            console.error('Delete course error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    },

    // Lấy thông tin môn học theo id
    getCourseById: async (req, res) => {
        try {
            const id = req.params.id;
            const course = await Course.findByPk(id);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found.' });
            }
            res.json({ success: true, data: course });
        } catch (error) {
            console.error('Get course by id error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Lấy thông tin môn học theo code
    getCourseByCode: async (req, res) => {
        try {
            const code = req.params.code;
            const course = await Course.findOne({ where: { course_code: code } });
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found.' });
            }
            res.json({ success: true, data: course });
        } catch (error) {
            console.error('Get course by code error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = CourseController;

const Submission = require('../models/Submission');
const submissionUpload = require('../middlewares/submissionUpload');
const AssignmentCourse = require('../models/AssignmentCourse');
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
			const { course_id, title, description, start_date, end_date } = req.body;
			if (!course_id || !title) {
				return res.status(400).json({ success: false, message: 'course_id và title là bắt buộc.' });
			}
			// Kiểm tra course tồn tại
			const course = await Course.findByPk(course_id);
			if (!course) {
				return res.status(404).json({ success: false, message: 'Course không tồn tại.' });
			}
			// Xử lý file upload (bắt buộc .use)
			let filePath = null;
			if (req.file) {
				filePath = 'uploads/assignments/' + req.file.filename;
			} else {
				return res.status(400).json({ success: false, message: 'File .use là bắt buộc.' });
			}
			// Tạo assignment
			const assignment = await Assignment.create({
				course_id,
				title,
				description: description || null,
				created_by: req.user.userId,
				file: filePath,
				start_date: start_date || null,
				end_date: end_date || null,
				created_at: new Date()
			});
			// Tạo ánh xạ assignment_courses for backward compatibility
			await AssignmentCourse.create({
				assignment_id: assignment.assignment_id,
				course_id
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
					{
						model: Course,
						as: 'courses',
						through: { attributes: ['due_date', 'start_date', 'week'] },
						attributes: ['course_id', 'course_name', 'course_code']
					},
					{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
				],
				order: [['created_at', 'DESC']]
			});
			// Convert AssignmentCourse to assignment_course in response
			const data = assignments.map(a => {
				const obj = a.toJSON();
				if (obj.courses) {
					obj.courses = obj.courses.map(c => {
						if (c.AssignmentCourse) {
							c.assignment_course = c.AssignmentCourse;
							delete c.AssignmentCourse;
						}
						return c;
					});
				}
				return obj;
			});
			res.json({ success: true, data });
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
			// Lấy assignment qua assignment_courses
			const assignmentCourses = await AssignmentCourse.findAll({ where: { course_id: courseIds } });
			const assignmentIds = assignmentCourses.map(ac => ac.assignment_id);
			if (assignmentIds.length === 0) {
				return res.json({ success: true, data: [] });
			}
			const assignments = await Assignment.findAll({
				where: { assignment_id: assignmentIds },
				include: [
					{
						model: Course,
						as: 'courses',
						through: { attributes: ['due_date', 'start_date', 'week'] },
						attributes: ['course_id', 'course_name', 'course_code']
					},
					{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
				],
				order: [['created_at', 'DESC']]
			});
			// Convert AssignmentCourse to assignment_course in response
			const data = assignments.map(a => {
				const obj = a.toJSON();
				if (obj.courses) {
					obj.courses = obj.courses.map(c => {
						if (c.AssignmentCourse) {
							c.assignment_course = c.AssignmentCourse;
							delete c.AssignmentCourse;
						}
						return c;
					});
				}
				return obj;
			});
			res.json({ success: true, data });
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
			const fields = ['title', 'description', 'start_date', 'end_date'];
			fields.forEach(f => {
				if (req.body[f] !== undefined) assignment[f] = req.body[f];
			});
			assignment.file = filePath;
			await assignment.save();
			// Cập nhật due_date, week nếu có (keep existing behavior if needed)
			if (req.body.due_date !== undefined || req.body.week !== undefined) {
				const assignmentCourse = await AssignmentCourse.findOne({ where: { assignment_id: assignment.assignment_id } });
				if (assignmentCourse) {
					if (req.body.due_date !== undefined) assignmentCourse.due_date = req.body.due_date;
					if (req.body.week !== undefined) assignmentCourse.week = req.body.week;
					await assignmentCourse.save();
				}
			}
			res.json({ success: true, data: assignment });
		} catch (error) {
			console.error('Update assignment error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},
	// Xoá assignment khỏi course (ClassCourse), không xoá khỏi assignments
	removeAssignmentFromCourse: async (req, res) => {
		try {
			if (req.user.role !== 'TEACHER') {
				return res.status(403).json({ success: false, message: 'Chỉ giáo viên mới được xoá assignment.' });
			}
			const { assignmentId } = req.params;
			// Tìm assignment
			const assignment = await Assignment.findByPk(assignmentId);
			if (!assignment) {
				return res.status(404).json({ success: false, message: 'Assignment không tồn tại.' });
			}
			// Xoá ánh xạ assignment-course (chỉ xoá row assignment_courses)
			// Tìm assignment_courses
			const assignmentCourse = await AssignmentCourse.findOne({ where: { assignment_id: assignment.assignment_id } });
			if (!assignmentCourse) {
				return res.status(404).json({ success: false, message: 'Không tìm thấy ánh xạ assignment-course.' });
			}
			// Kiểm tra quyền giáo viên
			const classCourse = await ClassCourse.findOne({ where: { course_id: assignmentCourse.course_id } });
			if (!classCourse) {
				return res.status(404).json({ success: false, message: 'Không tìm thấy lớp chứa course này.' });
			}
			const classObj = await Class.findByPk(classCourse.class_id);
			if (!classObj) {
				return res.status(404).json({ success: false, message: 'Lớp không tồn tại.' });
			}
			if (classObj.teacherId !== req.user.userId) {
				return res.status(403).json({ success: false, message: 'Bạn không có quyền xoá assignment này.' });
			}
			await AssignmentCourse.destroy({ where: { assignment_id: assignment.assignment_id, course_id: assignmentCourse.course_id } });
			res.json({ success: true, message: 'Đã xoá assignment khỏi course. Assignment vẫn còn trong hệ thống.', data: assignment });
		} catch (error) {
			console.error('Remove assignment from course error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},
	// Thêm assignment đã có vào lớp (qua course)
	addAssignmentToClass: async (req, res) => {
		try {
			const { assignment_id, course_id, due_date, week } = req.body;
			const assignment = await Assignment.findByPk(assignment_id);
			if (!assignment) {
				return res.status(404).json({ success: false, message: 'Assignment không tồn tại.' });
			}
			const course = await Course.findByPk(course_id);
			if (!course) {
				return res.status(404).json({ success: false, message: 'Course không tồn tại.' });
			}
			// Kiểm tra đã ánh xạ chưa
			const exist = await AssignmentCourse.findOne({ where: { assignment_id, course_id } });
			if (exist) {
				return res.status(400).json({ success: false, message: 'Assignment đã có trong course này.' });
			}
			await AssignmentCourse.create({ assignment_id, course_id, due_date, week });
			res.json({ success: true, data: assignment });
		} catch (error) {
			console.error('Add assignment to class error:', error);
			res.status(500).json({ success: false, message: 'Server error' });
		}
	},
	// Xoá assignment khỏi database (chỉ admin)
	deleteAssignment: async (req, res) => {
		try {
			if (req.user.role !== 'ADMIN') {
				return res.status(403).json({ success: false, message: 'Chỉ admin mới được xoá assignment.' });
			}
			const { id } = req.params;
			const assignment = await Assignment.findByPk(id);
			if (!assignment) {
				return res.status(404).json({ success: false, message: 'Assignment không tồn tại.' });
			}
			// Xoá tất cả ánh xạ assignment_courses trước
			await AssignmentCourse.destroy({ where: { assignment_id: id } });
			// Xoá assignment
			await assignment.destroy();
			res.json({ success: true, message: 'Đã xoá assignment khỏi database.' });
		} catch (error) {
			console.error('Delete assignment error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},
	// Lấy bài tập theo id
	getAssignmentById: async (req, res) => {
		try {
			if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER')) {
				return res.status(403).json({ success: false, message: 'Chỉ admin hoặc giáo viên mới được truy cập.' });
			}
			const { id } = req.params;
			const assignment = await Assignment.findByPk(id, {
				include: [
					{
						model: Course,
						as: 'courses',
						through: { attributes: ['due_date', 'start_date', 'week'] },
						attributes: ['course_id', 'course_name', 'course_code']
					},
					{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
				]
			});
			if (!assignment) {
				return res.status(404).json({ success: false, message: 'Assignment không tồn tại.' });
			}
			// Convert AssignmentCourse to assignment_course in response
			const obj = assignment.toJSON();
			if (obj.courses) {
				obj.courses = obj.courses.map(c => {
					if (c.AssignmentCourse) {
						c.assignment_course = c.AssignmentCourse;
						delete c.AssignmentCourse;
					}
					return c;
				});
			}
			res.json({ success: true, data: obj });
		} catch (error) {
			console.error('Get assignment by id error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},

	// Lấy tất cả bài tập theo course id (admin, giáo viên liên quan, hoặc sinh viên trong lớp)
	getAssignmentsByCourseId: async (req, res) => {
		try {
			const courseId = parseInt(req.params.id, 10);
			if (isNaN(courseId)) return res.status(400).json({ success: false, message: 'Invalid course id' });

			const course = await Course.findByPk(courseId);
			if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

			const user = req.user;
			// Admin allowed
			if (user && user.role === 'admin') {
				// allowed
			} else if (user && user.role === 'TEACHER') {
				// allowed if teacher created the course or teaches at least one class linked to it
				if (course.created_by === user.userId) {
					// allowed
				} else {
					const links = await ClassCourse.findAll({ where: { course_id: courseId } });
					const classIds = links.map(l => l.class_id);
					const owned = await Class.findOne({ where: { id: classIds, teacherId: user.userId } });
					if (!owned) return res.status(403).json({ success: false, message: 'Forbidden' });
				}
			} else if (user && user.role === 'STUDENT') {
				// allowed if student enrolled in any class linked to this course
				const links = await ClassCourse.findAll({ where: { course_id: courseId } });
				const classIds = links.map(l => l.class_id);
				if (classIds.length === 0) return res.status(403).json({ success: false, message: 'Forbidden' });
				const member = await ClassStudent.findOne({ where: { classId: classIds, studentId: user.userId } });
				if (!member) return res.status(403).json({ success: false, message: 'Forbidden' });
			} else {
				return res.status(403).json({ success: false, message: 'Forbidden' });
			}

			// find assignment ids via AssignmentCourse
			const assignmentCourses = await AssignmentCourse.findAll({ where: { course_id: courseId } });
			const assignmentIds = assignmentCourses.map(ac => ac.assignment_id);
			if (assignmentIds.length === 0) return res.json({ success: true, data: [] });

			const assignments = await Assignment.findAll({
				where: { assignment_id: assignmentIds },
				include: [
					{
						model: Course,
						as: 'courses',
						through: { attributes: ['due_date', 'start_date', 'week'] },
						attributes: ['course_id', 'course_name', 'course_code']
					},
					{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
				],
				order: [['created_at', 'DESC']]
			});

			// Convert AssignmentCourse to assignment_course in response
			const data = assignments.map(a => {
				const obj = a.toJSON();
				if (obj.courses) {
					obj.courses = obj.courses.map(c => {
						if (c.AssignmentCourse) {
							c.assignment_course = c.AssignmentCourse;
							delete c.AssignmentCourse;
						}
						return c;
					});
				}
				return obj;
			});

			res.json({ success: true, data });
		} catch (error) {
			console.error('Get assignments by course error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},
};

module.exports = AssignmentController;

const Submission = require('../models/Submission');
const submissionUpload = require('../middlewares/submissionUpload');
const AssignmentCourse = require('../models/AssignmentCourse');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');
const ClassCourse = require('../models/ClassCourse');
const ClassStudent = require('../models/ClassStudent');

const AssignmentController = {
	// Create assignment (teachers only)
	createAssignment: async (req, res) => {
		try {
			if (!req.user || req.user.role !== 'TEACHER') {
				return res.status(403).json({ success: false, message: 'Only teachers can create assignments.' });
			}
			const { course_id, title, description, start_date, end_date, status } = req.body;
			if (!course_id || !title) {
				return res.status(400).json({ success: false, message: 'course_id and title are required.' });
			}

			// Verify course exists
			const course = await Course.findByPk(course_id);
			if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

			// File upload is optional
			let filePath = null;
			if (req.file) filePath = 'uploads/assignments/' + req.file.filename;

			// Validate status if provided
			const allowedStatuses = ['draft', 'published', 'archived'];
			if (status && !allowedStatuses.includes(status)) {
				return res.status(400).json({ success: false, message: 'Invalid status' });
			}

			const assignment = await Assignment.create({
				course_id,
				title,
				description: description || null,
				created_by: req.user.userId,
				file: filePath,
				status: status || 'draft',
				start_date: start_date || null,
				end_date: end_date || null,
				created_at: new Date()
			});

			// Create assignment_course mapping for backward compatibility
			await AssignmentCourse.create({
				assignment_id: assignment.assignment_id,
				course_id
			});

			res.status(201).json({ success: true, message: 'Assignment created', data: assignment });
		} catch (error) {
			console.error('Create assignment error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},

	// Get all assignments
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

	// Get assignments by class
	getAssignmentsByClass: async (req, res) => {
		try {
			const { classId } = req.params;
			if (!classId) {
				return res.status(400).json({ success: false, message: 'Missing classId.' });
			}
			// Find course_ids for this class
			const classCourses = await ClassCourse.findAll({ where: { class_id: classId } });
			const courseIds = classCourses.map(cc => cc.course_id);
			if (courseIds.length === 0) return res.json({ success: true, data: [] });

			// Find assignment ids via AssignmentCourse
			const assignmentCourses = await AssignmentCourse.findAll({ where: { course_id: courseIds } });
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
			console.error('Get assignments by class error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},

	// Update assignment (teacher of the class that contains the course)
	updateAssignment: async (req, res) => {
		try {
			if (req.user.role !== 'TEACHER') {
				return res.status(403).json({ success: false, message: 'Only teachers can update assignments.' });
			}
			const { id } = req.params;
			const assignment = await Assignment.findByPk(id);
			if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

			// Find a class that contains this course
			const classCourse = await ClassCourse.findOne({ where: { course_id: assignment.course_id } });
			if (!classCourse) return res.status(404).json({ success: false, message: 'No class found for this assignment.' });
			const classObj = await Class.findByPk(classCourse.class_id);
			if (!classObj) return res.status(404).json({ success: false, message: 'Class not found.' });
			if (classObj.teacherId !== req.user.userId) return res.status(403).json({ success: false, message: 'You do not have permission to edit this assignment.' });

			// Handle file upload if present
			let filePath = assignment.file;
			if (req.file) filePath = 'uploads/assignments/' + req.file.filename;

			// Update fields
			const fields = ['title', 'description', 'start_date', 'end_date'];
			fields.forEach(f => { if (req.body[f] !== undefined) assignment[f] = req.body[f]; });

			// Handle status update if provided
			if (req.body.status !== undefined) {
				const allowedStatuses = ['draft', 'published', 'archived'];
				if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid status' });
				assignment.status = req.body.status;
			}

			assignment.file = filePath;
			await assignment.save();

			// Update AssignmentCourse due_date/week if provided
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

	// Remove assignment from course (do not delete assignment)
	removeAssignmentFromCourse: async (req, res) => {
		try {
			if (req.user.role !== 'TEACHER') return res.status(403).json({ success: false, message: 'Only teachers can remove assignments.' });
			const { assignmentId } = req.params;
			const assignment = await Assignment.findByPk(assignmentId);
			if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

			const assignmentCourse = await AssignmentCourse.findOne({ where: { assignment_id: assignment.assignment_id } });
			if (!assignmentCourse) return res.status(404).json({ success: false, message: 'Assignment-course mapping not found.' });

			const classCourse = await ClassCourse.findOne({ where: { course_id: assignmentCourse.course_id } });
			if (!classCourse) return res.status(404).json({ success: false, message: 'No class found for this course.' });
			const classObj = await Class.findByPk(classCourse.class_id);
			if (!classObj) return res.status(404).json({ success: false, message: 'Class not found.' });
			if (classObj.teacherId !== req.user.userId) return res.status(403).json({ success: false, message: 'You do not have permission to remove this assignment.' });

			await AssignmentCourse.destroy({ where: { assignment_id: assignment.assignment_id, course_id: assignmentCourse.course_id } });
			res.json({ success: true, message: 'Assignment removed from course. Assignment still exists in the system.', data: assignment });
		} catch (error) {
			console.error('Remove assignment from course error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},

	// Add existing assignment to a course
	addAssignmentToClass: async (req, res) => {
		try {
			const { assignment_id, course_id, due_date, week } = req.body;
			const assignment = await Assignment.findByPk(assignment_id);
			if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
			const course = await Course.findByPk(course_id);
			if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
			const exist = await AssignmentCourse.findOne({ where: { assignment_id, course_id } });
			if (exist) return res.status(400).json({ success: false, message: 'Assignment already in this course.' });
			await AssignmentCourse.create({ assignment_id, course_id, due_date, week });
			res.json({ success: true, data: assignment });
		} catch (error) {
			console.error('Add assignment to class error:', error);
			res.status(500).json({ success: false, message: 'Server error' });
		}
	},

	// Delete assignment from database (admin only)
	deleteAssignment: async (req, res) => {
		try {
			if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Only admin can delete assignments.' });
			const { id } = req.params;
			const assignment = await Assignment.findByPk(id);
			if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
			await AssignmentCourse.destroy({ where: { assignment_id: id } });
			await assignment.destroy();
			res.json({ success: true, message: 'Assignment deleted from database.' });
		} catch (error) {
			console.error('Delete assignment error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},

	// Get assignment by id (admin or teacher)
	getAssignmentById: async (req, res) => {
		try {
			if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER')) return res.status(403).json({ success: false, message: 'Only admin or teacher can access.' });
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
			if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
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

	// Get assignments by course id (admin, related teacher, or enrolled student)
	getAssignmentsByCourseId: async (req, res) => {
		try {
			const courseId = parseInt(req.params.id, 10);
			if (isNaN(courseId)) return res.status(400).json({ success: false, message: 'Invalid course id' });

			const course = await Course.findByPk(courseId);
			if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

			const user = req.user;
			// Admin allowed
			if (user && user.role === 'ADMIN') {
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

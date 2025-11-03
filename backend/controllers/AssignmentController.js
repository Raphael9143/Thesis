const Assignment = require('../models/Assignment');
const AssignmentCourse = require('../models/AssignmentCourse');
const Course = require('../models/Course');
const ClassCourse = require('../models/ClassCourse');
const Class = require('../models/Class');
const User = require('../models/User');
const ClassStudent = require('../models/ClassStudent');

const AssignmentController = {
	// Create assignment (teachers only). Single file under field 'attachment' is optional.
	createAssignment: async (req, res) => {
		try {
			if (!req.user || req.user.role !== 'TEACHER') {
				return res.status(403).json({ success: false, message: 'Only teachers can create assignments.' });
			}

			const { course_id, title, description, start_date, end_date, status } = req.body;
			if (!course_id || !title) {
				return res.status(400).json({ success: false, message: 'course_id and title are required.' });
			}

			// start_date and end_date are required
			if (!start_date || !end_date) {
				return res.status(400).json({ success: false, message: 'start_date and end_date are required.' });
			}

			// validate dates
			const sDate = new Date(start_date);
			const eDate = new Date(end_date);
			if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
				return res.status(400).json({ success: false, message: 'Invalid start_date or end_date.' });
			}
			if (sDate >= eDate) {
				return res.status(400).json({ success: false, message: 'start_date must be before end_date.' });
			}

			const course = await Course.findByPk(course_id);
			if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

			// File upload is optional
			let attachment = null;
			if (req.file) attachment = '/uploads/assignments/' + req.file.filename;

			const allowedStatuses = ['draft', 'published', 'archived'];
			if (status && !allowedStatuses.includes(status)) {
				return res.status(400).json({ success: false, message: 'Invalid status' });
			}

			const assignment = await Assignment.create({
				course_id,
				title,
				description: description || null,
				created_by: req.user.userId,
				attachment: attachment,
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

	// List all assignments
	getAllAssignments: async (req, res) => {
		try {
			const assignments = await Assignment.findAll({
				include: [
						{ model: Course, as: 'course', attributes: ['course_id', 'course_name', 'course_code'] },
						{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
					],
				order: [['created_at', 'DESC']]
			});

			const data = assignments.map(a => a.toJSON());

			res.json({ success: true, data });
		} catch (error) {
			console.error('Get all assignments error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},

	// Get assignments by class id
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

			const assignmentCourses = await AssignmentCourse.findAll({ where: { course_id: courseIds } });
			const assignmentIds = assignmentCourses.map(ac => ac.assignment_id);
			if (assignmentIds.length === 0) return res.json({ success: true, data: [] });

			// assignments belong to a single course via course_id
			const assignments = await Assignment.findAll({
				where: { course_id: courseIds },
				include: [
					{ model: Course, as: 'course', attributes: ['course_id', 'course_name', 'course_code'] },
					{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
				],
				order: [['created_at', 'DESC']]
			});

			const data = assignments.map(a => a.toJSON());

			res.json({ success: true, data });
		} catch (error) {
			console.error('Get assignments by class error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},

	// Update assignment (teacher of class containing course)
	updateAssignment: async (req, res) => {
		try {
			if (!req.user || req.user.role !== 'TEACHER') return res.status(403).json({ success: false, message: 'Only teachers can update assignments.' });
			const { id } = req.params;
			const assignment = await Assignment.findByPk(id);
			if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

			const classCourse = await ClassCourse.findOne({ where: { course_id: assignment.course_id } });
			let classObj = null;
			if (classCourse) classObj = await Class.findByPk(classCourse.class_id);
			// Permission: admin OR the teacher who created the assignment OR the homeroom teacher of the class containing the course
			if (req.user.role === 'ADMIN') {
				// allowed
			} else if (req.user.role === 'TEACHER') {
				const isCreator = assignment.created_by === req.user.userId;
				const isClassTeacher = classObj && classObj.teacherId === req.user.userId;
				if (!isCreator && !isClassTeacher) return res.status(403).json({ success: false, message: 'You do not have permission to update this assignment.' });
			} else {
				return res.status(403).json({ success: false, message: 'Only teachers or admins can update assignments.' });
			}

			// handle file
			if (req.file) assignment.attachment = '/uploads/assignments/' + req.file.filename;

			// Handle updates to start/end dates: if either is provided, ensure both exist and are valid
			if (req.body.start_date !== undefined || req.body.end_date !== undefined) {
				const newStart = req.body.start_date !== undefined ? new Date(req.body.start_date) : new Date(assignment.start_date);
				const newEnd = req.body.end_date !== undefined ? new Date(req.body.end_date) : new Date(assignment.end_date);
				if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) return res.status(400).json({ success: false, message: 'Invalid start_date or end_date.' });
				if (newStart >= newEnd) return res.status(400).json({ success: false, message: 'start_date must be before end_date.' });
				assignment.start_date = newStart;
				assignment.end_date = newEnd;
			}
			const fields = ['title', 'description'];
			fields.forEach(f => { if (req.body[f] !== undefined) assignment[f] = req.body[f]; });
			if (req.body.status !== undefined) {
				const allowed = ['draft', 'published', 'archived'];
				if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid status' });
				assignment.status = req.body.status;
			}

			// ensure assignment has start_date and end_date (required invariant)
			if (!assignment.start_date || !assignment.end_date) return res.status(400).json({ success: false, message: 'start_date and end_date must be set.' });
			await assignment.save();

			// update assignment_course if present
			if (req.body.due_date !== undefined || req.body.week !== undefined) {
				const ac = await AssignmentCourse.findOne({ where: { assignment_id: assignment.assignment_id } });
				if (ac) { if (req.body.due_date !== undefined) ac.due_date = req.body.due_date; if (req.body.week !== undefined) ac.week = req.body.week; await ac.save(); }
			}

			res.json({ success: true, data: assignment });
		} catch (error) {
			console.error('Update assignment error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},

	// Remove assignment-course mapping (teacher only)
	removeAssignmentFromCourse: async (req, res) => {
		try {
			if (!req.user || req.user.role !== 'TEACHER') return res.status(403).json({ success: false, message: 'Only teachers can remove assignments from a course.' });
			const { assignmentId } = req.params;
			const assignment = await Assignment.findByPk(assignmentId);
			if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
			const ac = await AssignmentCourse.findOne({ where: { assignment_id: assignment.assignment_id } });
			if (!ac) return res.status(404).json({ success: false, message: 'Assignment-course mapping not found.' });

			const classCourse = await ClassCourse.findOne({ where: { course_id: ac.course_id } });
			if (!classCourse) return res.status(404).json({ success: false, message: 'No class found for this course.' });
			const classObj = await Class.findByPk(classCourse.class_id);
			if (!classObj || classObj.teacherId !== req.user.userId) return res.status(403).json({ success: false, message: 'You do not have permission to remove this assignment.' });

			await ac.destroy();
			res.json({ success: true, message: 'Assignment removed from course.', data: assignment });
		} catch (error) {
			console.error('Remove assignment from course error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},

	// Add assignment to course
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

	// Delete assignment (admin only)
	deleteAssignment: async (req, res) => {
		try {
			if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Only admin can delete assignments.' });
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

	// Get assignment by id
	getAssignmentById: async (req, res) => {
		try {
			if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER')) return res.status(403).json({ success: false, message: 'Only admin or teacher can access.' });
			const { id } = req.params;
			const assignment = await Assignment.findByPk(id, {
				include: [
					{ model: Course, as: 'course', attributes: ['course_id', 'course_name', 'course_code'] },
					{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
				]
			});
			if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
			const obj = assignment.toJSON();
			res.json({ success: true, data: obj });
		} catch (error) {
			console.error('Get assignment by id error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	},

	// Get assignments by course id (admin, related teacher, or student enrolled)
	getAssignmentsByCourseId: async (req, res) => {
		try {
			const courseId = parseInt(req.params.id, 10);
			if (isNaN(courseId)) return res.status(400).json({ success: false, message: 'Invalid course id' });
			const course = await Course.findByPk(courseId);
			if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
			const user = req.user;
			if (user && user.role === 'ADMIN') {
				// allowed
			} else if (user && user.role === 'TEACHER') {
				if (course.created_by === user.userId) {
					// allowed
				} else {
					const links = await ClassCourse.findAll({ where: { course_id: courseId } });
					const classIds = links.map(l => l.class_id);
					const owned = await Class.findOne({ where: { id: classIds, teacherId: user.userId } });
					if (!owned) return res.status(403).json({ success: false, message: 'Forbidden' });
				}
			} else if (user && user.role === 'STUDENT') {
				const links = await ClassCourse.findAll({ where: { course_id: courseId } });
				const classIds = links.map(l => l.class_id);
				if (classIds.length === 0) return res.status(403).json({ success: false, message: 'Forbidden' });
				const member = await ClassStudent.findOne({ where: { classId: classIds, studentId: user.userId } });
				if (!member) return res.status(403).json({ success: false, message: 'Forbidden' });
			} else {
				return res.status(403).json({ success: false, message: 'Forbidden' });
			}

			// fetch assignments directly by course_id
			const assignments = await Assignment.findAll({
				where: { course_id: courseId },
				include: [
					{ model: Course, as: 'course', attributes: ['course_id', 'course_name', 'course_code'] },
					{ model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] }
				],
				order: [['created_at', 'DESC']]
			});

			const data = assignments.map(a => a.toJSON());

			res.json({ success: true, data });
		} catch (error) {
			console.error('Get assignments by course error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	}
	,

	// Patch assignment status by id
	updateAssignmentStatus: async (req, res) => {
		try {
			const { id } = req.params;
			const { status } = req.body;
			if (!status) return res.status(400).json({ success: false, message: 'Missing status in request body.' });
			const allowed = ['draft', 'published', 'archived'];
			if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status value.' });

			const assignment = await Assignment.findByPk(id);
			if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

			// Permission: admin OR creator OR homeroom teacher of class containing the course
			const classCourse = await ClassCourse.findOne({ where: { course_id: assignment.course_id } });
			let classObj = null;
			if (classCourse) classObj = await Class.findByPk(classCourse.class_id);

			if (!req.user) return res.status(403).json({ success: false, message: 'Authentication required.' });
			if (req.user.role === 'ADMIN') {
				// allowed
			} else if (req.user.role === 'TEACHER') {
				const isCreator = assignment.created_by === req.user.userId;
				const isClassTeacher = classObj && classObj.teacherId === req.user.userId;
				if (!isCreator && !isClassTeacher) return res.status(403).json({ success: false, message: 'You do not have permission to change status of this assignment.' });
			} else {
				return res.status(403).json({ success: false, message: 'Only teachers or admins can change assignment status.' });
			}

			assignment.status = status;
			assignment.updated_at = new Date();
			await assignment.save();

			res.json({ success: true, data: assignment });
		} catch (error) {
			console.error('Update assignment status error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	}
};

module.exports = AssignmentController;

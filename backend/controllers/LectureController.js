const Lecture = require('../models/Lecture');
const Course = require('../models/Course');
const Class = require('../models/Class');
const ClassCourse = require('../models/ClassCourse');
const ClassStudent = require('../models/ClassStudent');
const User = require('../models/User');

const LectureController = {
  // Create a lecture. Only a teacher who is the homeroom teacher of the class linked to the course
  // can create a lecture for that class/course. If class_id is provided, teacher must be that class.teacherId
  // and the class must be linked to the course. If class_id omitted, teacher must be homeroom teacher of at
  // least one class that links to the course.
  createLecture: async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'TEACHER') {
        return res.status(403).json({ success: false, message: 'Only teachers can create lectures.' });
      }
  const teacherId = req.user.userId;
  const { course_id, title, attachments, publish_date, status } = req.body;
      if (!course_id || !title) {
        return res.status(400).json({ success: false, message: 'course_id and title are required.' });
      }

      // Verify course exists
      const course = await Course.findByPk(course_id);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

      // Require the teacher to be homeroom teacher for at least one class linked to this course
      const links = await ClassCourse.findAll({ where: { course_id } });
      const classIds = links.map(l => l.class_id);
      if (classIds.length === 0) return res.status(400).json({ success: false, message: 'No classes linked to this course.' });
      const owned = await Class.findOne({ where: { id: classIds, teacherId } });
      if (!owned) return res.status(403).json({ success: false, message: 'You are not the homeroom teacher for any class of this course.' });

      // Build attachments array from uploaded files (req.files) or from request body
      let attachmentsArray = null;
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        attachmentsArray = req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          url: `/uploads/lectures/${file.filename}`,
          mimetype: file.mimetype,
          size: file.size
        }));
        // If client also sent attachments in body (e.g., links), try to merge
        if (attachments && typeof attachments !== 'object') {
          try {
            const parsed = JSON.parse(attachments);
            if (Array.isArray(parsed)) attachmentsArray = attachmentsArray.concat(parsed);
          } catch (e) {
            // ignore parse error
          }
        } else if (attachments && Array.isArray(attachments)) {
          attachmentsArray = attachmentsArray.concat(attachments);
        }
      } else if (attachments) {
        // No uploaded files; use attachments from body if provided
        if (typeof attachments === 'string') {
          try {
            attachmentsArray = JSON.parse(attachments);
          } catch (e) {
            attachmentsArray = [attachments];
          }
        } else {
          attachmentsArray = attachments;
        }
      }

      const lecture = await Lecture.create({
        course_id,
        teacher_id: teacherId,
        title,
        attachments: attachmentsArray || null,
        publish_date: publish_date || null,
        status: status || 'draft'
      });

      res.status(201).json({ success: true, message: 'Lecture created!', data: lecture });
    } catch (error) {
      console.error('Create lecture error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  // Get lecture by id
  getLectureById: async (req, res) => {
    try {
      const id = req.params.id;
      const lecture = await Lecture.findByPk(id, {
        include: [
          { model: Course, as: 'course' }
        ]
      });
      if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found.' });
      res.json({ success: true, data: lecture });
    } catch (error) {
      console.error('Get lecture error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
  ,

  // Update lecture fields (title, publish_date, status, attachments)
  updateLecture: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const id = req.params.id;
      const lecture = await Lecture.findByPk(id);
      if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found.' });

      const user = req.user;
      if (!(user.role === 'admin' || lecture.teacher_id === user.userId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const { title, publish_date, status, attachments } = req.body;
      const allowed = ['draft', 'published', 'archived'];
      if (status && !allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

      // Merge uploaded files into attachments
      let attachmentsArray = lecture.attachments && Array.isArray(lecture.attachments) ? [...lecture.attachments] : [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const uploaded = req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          url: `/uploads/lectures/${file.filename}`,
          mimetype: file.mimetype,
          size: file.size
        }));
        attachmentsArray = attachmentsArray.concat(uploaded);
      }

      // Merge attachments from body if present
      if (attachments) {
        if (typeof attachments === 'string') {
          try {
            const parsed = JSON.parse(attachments);
            if (Array.isArray(parsed)) attachmentsArray = attachmentsArray.concat(parsed);
          } catch (e) {
            attachmentsArray.push(attachments);
          }
        } else if (Array.isArray(attachments)) {
          attachmentsArray = attachmentsArray.concat(attachments);
        }
      }

      if (title) lecture.title = title;
      if (publish_date) lecture.publish_date = publish_date;
      if (status) lecture.status = status;
      lecture.attachments = attachmentsArray.length > 0 ? attachmentsArray : null;

      await lecture.save();
      res.json({ success: true, message: 'Lecture updated', data: lecture });
    } catch (error) {
      console.error('Update lecture error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  // Update lecture status (only lecture's teacher or admin)
  updateLectureStatus: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const id = req.params.id;
      const { status } = req.body;
      const allowed = ['draft', 'published', 'archived'];
      if (!status || !allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

      const lecture = await Lecture.findByPk(id);
      if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found.' });

      // Only admin or the teacher who created the lecture can change status
      const user = req.user;
      if (!(user.role === 'admin' || lecture.teacher_id === user.userId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      lecture.status = status;
      await lecture.save();

      res.json({ success: true, message: 'Lecture status updated', data: lecture });
    } catch (error) {
      console.error('Update lecture status error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  // Delete lecture by id (only lecture's teacher or admin)
  deleteLecture: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const id = req.params.id;
      const lecture = await Lecture.findByPk(id);
      if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found.' });

      const user = req.user;
      if (!(user.role === 'admin' || lecture.teacher_id === user.userId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      await lecture.destroy();
      res.json({ success: true, message: 'Lecture deleted' });
    } catch (error) {
      console.error('Delete lecture error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  // Get all lectures for a given course id. Access allowed to admin, the class teacher(s) of linked classes, or students
  // enrolled in any class linked to the course.
  getLecturesByCourseId: async (req, res) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      if (isNaN(courseId)) return res.status(400).json({ success: false, message: 'Invalid course id' });

      const course = await Course.findByPk(courseId);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

      const user = req.user;
      // Admin allowed
      if (user && user.role === 'admin') {
        // proceed
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

      const lectures = await Lecture.findAll({
        where: { course_id: courseId },
        include: [
          { model: User, as: 'teacher', attributes: ['id', 'full_name', 'email'] }
        ],
        order: [['publish_date', 'DESC']]
      });

      res.json({ success: true, data: lectures });
    } catch (error) {
      console.error('Get lectures by course id error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
};

module.exports = LectureController;

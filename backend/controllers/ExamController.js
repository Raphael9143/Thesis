const Exam = require('../models/Exam');
const Course = require('../models/Course');
const ClassCourse = require('../models/ClassCourse');
const Class = require('../models/Class');
const ClassStudent = require('../models/ClassStudent');
const User = require('../models/User');

const ExamController = {
  // Create an exam (only teachers allowed)
  createExam: async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'TEACHER') {
        return res.status(403).json({ success: false, message: 'Only teachers can create exams.' });
      }
      const { course_id, title, description, start_time, end_time } = req.body;
      if (!course_id || !title) return res.status(400).json({ success: false, message: 'course_id and title are required.' });

      const course = await Course.findByPk(course_id);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

      // handle uploaded single attachment
      let attachment = null;
      if (req.file) attachment = '/uploads/exams/' + req.file.filename;

      const exam = await Exam.create({
        course_id,
        title,
        description: description || null,
        start_time: start_time || null,
        end_time: end_time || null,
        attachment: attachment || null
      });

      res.status(201).json({ success: true, message: 'Exam created!', data: exam });
    } catch (error) {
      console.error('Create exam error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  getExamById: async (req, res) => {
    try {
      const id = req.params.id;
      const exam = await Exam.findByPk(id, { include: [{ model: Course, as: 'course' }] });
      if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
      res.json({ success: true, data: exam });
    } catch (error) {
      console.error('Get exam error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  // Get all exams for a given course id. Access allowed to admin, teachers who created or teach the course,
  // or students enrolled in any class that is linked to the course.
  getExamsByCourseId: async (req, res) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      if (isNaN(courseId)) return res.status(400).json({ success: false, message: 'Invalid course id' });

      const course = await Course.findByPk(courseId);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

      const user = req.user;
      // Admin can view
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

      const exams = await Exam.findAll({ where: { course_id: courseId }, include: [{ model: Course, as: 'course' }], order: [['start_time', 'DESC']] });
      res.json({ success: true, data: exams });
    } catch (error) {
      console.error('Get exams by course id error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
};

module.exports = ExamController;

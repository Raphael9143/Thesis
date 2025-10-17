const Lecture = require('../models/Lecture');
const Course = require('../models/Course');
const Class = require('../models/Class');
const ClassCourse = require('../models/ClassCourse');

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
      const { course_id, class_id, title, attachments, publish_date, status } = req.body;
      if (!course_id || !title) {
        return res.status(400).json({ success: false, message: 'course_id and title are required.' });
      }

      // Verify course exists
      const course = await Course.findByPk(course_id);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

      // If class_id provided, ensure class exists and is taught by teacher and linked to course
      if (class_id) {
        const cls = await Class.findByPk(class_id);
        if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });
        if (cls.teacherId !== teacherId) return res.status(403).json({ success: false, message: 'You are not the homeroom teacher of this class.' });
        // Check link between class and course
        const link = await ClassCourse.findOne({ where: { class_id: class_id, course_id } });
        if (!link) return res.status(400).json({ success: false, message: 'This class is not linked to the specified course.' });
      } else {
        // No class specified: require teacher to teach at least one class that links to the course
        const links = await ClassCourse.findAll({ where: { course_id } });
        const classIds = links.map(l => l.class_id);
        if (classIds.length === 0) return res.status(400).json({ success: false, message: 'No classes linked to this course.' });
        const owned = await Class.findOne({ where: { id: classIds, teacherId } });
        if (!owned) return res.status(403).json({ success: false, message: 'You are not the homeroom teacher for any class of this course.' });
      }

      const lecture = await Lecture.create({
        course_id,
        class_id: class_id || null,
        teacher_id: teacherId,
        title,
        attachments: attachments || null,
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
          { model: Course, as: 'course' },
          { model: Class, as: 'class' }
        ]
      });
      if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found.' });
      res.json({ success: true, data: lecture });
    } catch (error) {
      console.error('Get lecture error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
};

module.exports = LectureController;

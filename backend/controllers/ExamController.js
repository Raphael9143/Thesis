const Exam = require('../models/Exam');
const Course = require('../models/Course');

const ExamController = {
  // Create an exam (only teachers allowed)
  createExam: async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'TEACHER') {
        return res.status(403).json({ success: false, message: 'Only teachers can create exams.' });
      }
      const { course_id, title, description, start_time, end_time, model_file } = req.body;
      if (!course_id || !title) return res.status(400).json({ success: false, message: 'course_id and title are required.' });

      const course = await Course.findByPk(course_id);
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

      const exam = await Exam.create({
        course_id,
        title,
        description: description || null,
        start_time: start_time || null,
        end_time: end_time || null,
        model_file: model_file || null
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
  }
};

module.exports = ExamController;

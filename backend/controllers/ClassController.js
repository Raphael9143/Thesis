const Class = require('../models/Class');
const ClassStudent = require('../models/ClassStudent');
const User = require('../models/User');

// Tạo lớp học (chỉ teacher)
exports.createClass = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can create classes.' });
    }
    const { name, studentEmails } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Class name is required.' });
    }
    // Tạo lớp học
    const newClass = await Class.create({ name, teacherId: req.user.userId });
    // Thêm học sinh vào lớp nếu có
    if (Array.isArray(studentEmails) && studentEmails.length > 0) {
      // Tìm các user có email trong danh sách và role là student
      const students = await User.findAll({ where: { email: studentEmails, role: 'student' } });
      if (students.length !== studentEmails.length) {
        const foundEmails = students.map(s => s.email);
        const notFound = studentEmails.filter(e => !foundEmails.includes(e));
        return res.status(400).json({ success: false, message: `Các email sau không hợp lệ hoặc không phải student: ${notFound.join(', ')}` });
      }
      const classStudents = students.map(s => ({ classId: newClass.id, studentId: s.id }));
      await ClassStudent.bulkCreate(classStudents);
    }
    res.status(201).json({
      success: true,
      message: 'Class created!',
      data: {
        class: {
          id: newClass.id,
          name: newClass.name,
          teacherId: newClass.teacherId,
          createdAt: newClass.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

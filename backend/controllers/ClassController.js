const Class = require('../models/Class');
const ClassStudent = require('../models/ClassStudent');
const User = require('../models/User');

// Tạo lớp học (chỉ teacher)
exports.createClass = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can create classes.' });
    }
    const { name, studentIds } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Class name is required.' });
    }
    // Tạo lớp học
    const newClass = await Class.create({ name, teacherId: req.user.userId });
    // Thêm học sinh vào lớp nếu có
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const students = await User.findAll({ where: { id: studentIds, role: 'student' } });
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

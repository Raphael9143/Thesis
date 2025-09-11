// Lấy số lượng học sinh của lớp
exports.getStudentCountOfClass = async (req, res) => {
  try {
    const classId = req.params.id;
    // Kiểm tra lớp tồn tại
    const foundClass = await Class.findByPk(classId);
    if (!foundClass) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }
    // Đếm số lượng học sinh
    const count = await ClassStudent.count({ where: { classId } });
    res.json({ success: true, classId, studentCount: count });
  } catch (error) {
    console.error('Get student count of class error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
// Lấy danh sách sinh viên của lớp
exports.getStudentsOfClass = async (req, res) => {
  try {
    const classId = req.params.id;

    // Kiểm tra lớp tồn tại
    const foundClass = await Class.findByPk(classId);
    if (!foundClass) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    // Lấy danh sách sinh viên
    const students = await ClassStudent.findAll({
      where: { classId },
      include: [{ model: User, as: 'student', attributes: ['id', 'email', 'role', 'createdAt', 'updatedAt'] }]
    });

    res.json({
      success: true,
      data: students.map(cs => ({
        id: cs.student.id,
        email: cs.student.email,
        role: cs.student.role,
        joinedAt: cs.joinedAt,
        classStudentId: cs.id
      }))
    });
  } catch (error) {
    console.error('Get students of class error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
// Xóa lớp học (chỉ admin)
exports.deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can delete class. Teachers can only set status to cancelled or closed.' });
    }

    const foundClass = await Class.findByPk(classId);
    if (!foundClass) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    await foundClass.destroy();

    res.json({ success: true, message: 'Class deleted.' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
// Xóa nhiều học sinh khỏi lớp học
exports.removeStudentFromClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'studentIds (array) is required.' });
    }

    // Tìm lớp học
    const foundClass = await Class.findByPk(classId);
    if (!foundClass) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    // Chỉ admin hoặc giáo viên chủ nhiệm mới được xóa học sinh
    if (userRole !== 'admin' && foundClass.teacherId !== userId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to remove students from this class.' });
    }

    // Xóa các học sinh khỏi lớp
    const deleted = await ClassStudent.destroy({
      where: {
        classId,
        studentId: studentIds
      }
    });

    if (deleted === 0) {
      return res.status(404).json({ success: false, message: 'No students were removed (not found in class).' });
    }

    res.json({ success: true, message: 'Students removed from class.', count: deleted });
  } catch (error) {
    console.error('Remove student from class error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
// Sửa trạng thái lớp học
exports.updateClassStatus = async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { status } = req.body;

    // Danh sách status hợp lệ
    const validStatus = ['draft', 'active', 'in_progress', 'closed', 'archived', 'cancelled'];
    if (!status || !validStatus.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing status.' });
    }

    // Tìm lớp học
    const foundClass = await Class.findByPk(classId);
    if (!foundClass) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    // Chỉ admin hoặc giáo viên chủ nhiệm mới được sửa
    if (userRole !== 'admin' && foundClass.teacherId !== userId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this class.' });
    }

    foundClass.status = status;
    await foundClass.save();

    res.json({
      success: true,
      message: 'Class status updated!',
      data: {
        class: {
          id: foundClass.id,
          status: foundClass.status,
          updatedAt: foundClass.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update class status error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
// Thêm học sinh vào lớp học
exports.addStudentToClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, message: 'Missing request body.' });
    }
    const { studentEmails } = req.body;
    if (!Array.isArray(studentEmails) || studentEmails.length === 0) {
      return res.status(400).json({ success: false, message: 'studentEmails (array) is required.' });
    }

    // Tìm lớp học
    const foundClass = await Class.findByPk(classId);
    if (!foundClass) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    // Chỉ admin hoặc giáo viên chủ nhiệm mới được thêm học sinh
    if (userRole !== 'admin' && foundClass.teacherId !== userId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to add students to this class.' });
    }

    // Tìm tất cả học sinh theo email
    const students = await User.findAll({ where: { email: studentEmails, role: 'student' } });
    const foundEmails = students.map(s => s.email);
    const notFound = studentEmails.filter(e => !foundEmails.includes(e));
    if (notFound.length > 0) {
      return res.status(400).json({ success: false, message: `Các email sau không hợp lệ hoặc không phải student: ${notFound.join(', ')}` });
    }

    // Kiểm tra học sinh đã có trong lớp chưa
    const existed = await ClassStudent.findAll({
      where: {
        classId: classId,
        studentId: students.map(s => s.id)
      }
    });
    const existedIds = existed.map(e => e.studentId);
    let newStudents = students.filter(s => !existedIds.includes(s.id));
    if (newStudents.length === 0) {
      return res.status(400).json({ success: false, message: 'Tất cả học sinh đã có trong lớp.' });
    }

    // Kiểm tra giới hạn max_students
    if (foundClass.max_students !== null && foundClass.max_students > 0) {
      const currentCount = await ClassStudent.count({ where: { classId } });
      const availableSlots = foundClass.max_students - currentCount;
      if (availableSlots <= 0) {
        return res.status(400).json({ success: false, message: 'Lớp đã đủ số lượng học sinh.' });
      }
      if (newStudents.length > availableSlots) {
        newStudents = newStudents.slice(0, availableSlots);
      }
    }

    // Thêm vào bảng class_students
    const now = new Date();
    const classStudents = newStudents.map(s => ({
      classId: classId,
      studentId: s.id,
      role: 'student',
      joinedAt: now
    }));
    const created = await ClassStudent.bulkCreate(classStudents);

    res.status(201).json({
      success: true,
      message: 'Students added to class!',
      data: {
        added: created.map(cs => ({
          id: cs.id,
          classId: cs.classId,
          studentId: cs.studentId,
          role: cs.role,
          joinedAt: cs.joinedAt
        }))
      }
    });
  } catch (error) {
    console.error('Add student to class error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
// Sửa thông tin lớp học
exports.updateClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Tìm lớp học
    const foundClass = await Class.findByPk(classId);
    if (!foundClass) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    // Chỉ admin hoặc giáo viên chủ nhiệm mới được sửa
    if (userRole !== 'admin' && foundClass.teacherId !== userId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this class.' });
    }

    const { name, code, description, semester, year, status } = req.body;
    // Chỉ cập nhật các trường được phép
    if (name !== undefined) foundClass.name = name;
    if (code !== undefined) foundClass.code = code;
    if (description !== undefined) foundClass.description = description;
    if (semester !== undefined) foundClass.semester = semester;
    if (year !== undefined) foundClass.year = year;
    if (status !== undefined) foundClass.status = status;

    await foundClass.save();

    res.json({
      success: true,
      message: 'Class updated!',
      data: {
        class: {
          id: foundClass.id,
          name: foundClass.name,
          code: foundClass.code,
          description: foundClass.description,
          teacherId: foundClass.teacherId,
          semester: foundClass.semester,
          year: foundClass.year,
          status: foundClass.status,
          createdAt: foundClass.createdAt,
          updatedAt: foundClass.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update class error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Class code already exists.' });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
const Class = require('../models/Class');
const ClassStudent = require('../models/ClassStudent');
const User = require('../models/User');

// Tạo lớp học (chỉ teacher)
exports.createClass = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can create classes.' });
    }
    const { name, code, description, semester, year, status, studentEmails } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Class name and code are required.' });
    }
    // Tạo lớp học
    const newClass = await Class.create({
      name,
      code,
      description,
      semester,
      year,
      status: status || 'active',
      teacherId: req.user.userId
    });
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
          code: newClass.code,
          description: newClass.description,
          teacherId: newClass.teacherId,
          semester: newClass.semester,
          year: newClass.year,
          status: newClass.status,
          createdAt: newClass.createdAt,
          updatedAt: newClass.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Create class error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Class code already exists.' });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

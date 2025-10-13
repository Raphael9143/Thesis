const Student = require('../models/Student');
const ClassStudent = require('../models/ClassStudent');
const Class = require('../models/Class');
const User = require('../models/User');


const StudentController = {
	// Lấy danh sách các lớp đã enrolled của sinh viên hiện tại
	getEnrolledClasses: async (req, res) => {
		try {
			const studentId = req.user.userId;
			// Kiểm tra student tồn tại
			const student = await Student.findByPk(studentId);
			if (!student) {
				return res.status(404).json({ success: false, message: 'Student not found!' });
			}
			// Lấy danh sách class đã enrolled
			const classStudents = await ClassStudent.findAll({
				where: { student_id: studentId },
				include: [{ model: Class }]
			});
			const classes = classStudents.map(cs => cs.Class);
			res.json({ success: true, data: { classes } });
		} catch (error) {
			console.error('Get enrolled classes error:', error);
			res.status(500).json({ success: false, message: 'Server error' });
		}
	},

	// Lấy thông tin profile sinh viên hiện tại
	getProfile: async (req, res) => {
		try {
			const userId = req.user.userId;
			// Lấy thông tin user và kiểm tra role
			const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
			if (!user || user.role !== 'STUDENT') {
				return res.status(404).json({ success: false, message: 'Student not found!' });
			}

			// Lấy profile sinh viên
			const student = await Student.findByPk(userId);
			if (!student) {
				return res.status(404).json({ success: false, message: 'Student profile not found!' });
			}

			// Lấy danh sách lớp đã/enrolled (chỉ lấy id để gọn nhẹ)
			const classLinks = await ClassStudent.findAll({
				where: { student_id: userId },
				attributes: ['class_id']
			});
			const enrolled_classes = classLinks.map(link => (link.class_id ?? link.classId));

			res.json({
				success: true,
				data: {
					...user.toJSON(),
					...student.toJSON(),
					enrolled_classes
				}
			});
		} catch (error) {
			console.error('Get student profile error:', error);
			res.status(500).json({ success: false, message: 'Server error' });
		}
	},

	// Sửa thông tin profile sinh viên hiện tại
	updateProfile: async (req, res) => {
		try {
			const studentId = req.user.userId;
			const { student_code, major, year } = req.body;
			// Không cho phép cập nhật completed_assignments từ API
			if (Object.prototype.hasOwnProperty.call(req.body, 'completed_assignments')) {
				return res.status(400).json({ success: false, message: 'Field completed_assignments is read-only and cannot be updated.' });
			}
			const student = await Student.findByPk(studentId);
			if (!student) {
				return res.status(404).json({ success: false, message: 'Student not found!' });
			}
			// Cập nhật các trường cho phép
			if (student_code !== undefined) student.student_code = student_code;
			if (major !== undefined) student.major = major;
			if (year !== undefined) student.year = year;
			await student.save();
			res.json({ success: true, message: 'Student profile updated!', data: student });
		} catch (error) {
			console.error('Update student profile error:', error);
			res.status(500).json({ success: false, message: 'Server error' });
		}
	}
};

module.exports = StudentController;

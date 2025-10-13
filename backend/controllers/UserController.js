const User = require('../models/User');

const UserController = {
	// Xóa tài khoản người dùng
	deleteUser: async (req, res) => {
		try {
			const userId = req.params.id;
			// Chỉ admin hoặc chính chủ mới được xóa
			if (req.user.role !== 'ADMIN' && req.user.userId != userId) {
				return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa tài khoản này.' });
			}
			const user = await User.findByPk(userId);
			if (!user) {
				return res.status(404).json({ success: false, message: 'User not found.' });
			}
			await user.destroy();
			res.json({ success: true, message: 'User deleted.' });
		} catch (error) {
			console.error('Delete user error:', error);
			res.status(500).json({ success: false, message: 'Internal Server Error' });
		}
	}
};

module.exports = UserController;

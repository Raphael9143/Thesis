const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET

const authMiddleware = (req, res, next) => {
	try {
		// Lấy token từ header Authorization
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			return res.status(401).json({
				success: false,
				message: 'Token không tồn tại'
			});
		}

		// Token format: "Bearer <token>"
		const token = authHeader.split(' ')[1];

		if (!token) {
			return res.status(401).json({
				success: false,
				message: 'Token không hợp lệ'
			});
		}

		// Verify token
		const decoded = jwt.verify(token, JWT_SECRET);

		// Thêm thông tin user vào request
		req.user = decoded;

		next();
	} catch (error) {
		console.error('Auth middleware error:', error);

		if (error.name === 'TokenExpiredError') {
			return res.status(401).json({
				success: false,
				message: 'Token đã hết hạn'
			});
		}

		if (error.name === 'JsonWebTokenError') {
			return res.status(401).json({
				success: false,
				message: 'Token không hợp lệ'
			});
		}

		return res.status(500).json({
			success: false,
			message: 'Lỗi xác thực'
		});
	}
};

module.exports = authMiddleware;

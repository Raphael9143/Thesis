const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET

const authMiddleware = (req, res, next) => {
	try {
		// Get token from Authorization header
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			return res.status(401).json({
				success: false,
				message: 'Token not provided'
			});
		}

		// Token format: "Bearer <token>"
		const token = authHeader.split(' ')[1];

		if (!token) {
			return res.status(401).json({
				success: false,
				message: 'Invalid token'
			});
		}

		// Verify token
		const decoded = jwt.verify(token, JWT_SECRET);

		// Attach user info to request
		req.user = decoded;

		next();
	} catch (error) {
		console.error('Auth middleware error:', error);

			if (error.name === 'TokenExpiredError') {
				return res.status(401).json({
					success: false,
					message: 'Token has expired'
				});
			}

			if (error.name === 'JsonWebTokenError') {
				return res.status(401).json({
					success: false,
					message: 'Invalid token'
				});
			}

			return res.status(500).json({
				success: false,
				message: 'Authentication error'
			});
	}
};

module.exports = authMiddleware;

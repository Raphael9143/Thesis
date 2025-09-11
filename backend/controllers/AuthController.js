const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Secret key cho JWT (trong thực tế nên để trong .env file)
const JWT_SECRET = process.env.JWT_SECRET;

const AuthController = {
    // Đăng ký

    register: async (req, res) => {
        try {

            const { email, password, role, name, dob, gender } = req.body;

            // Validation
            if (!email || !password || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin (email, password, name)'
                });
            }

            // Kiểm tra email đã tồn tại
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already in-used!'
                });
            }

            // Mã hóa password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);


            // Chỉ cho phép đăng ký role là 'student' hoặc 'teacher'
            let regRole = 'student';
            if (role && ['student', 'teacher'].includes(role)) {
                regRole = role;
            }


            const newUser = await User.create({
                email,
                password: hashedPassword,
                role: regRole,
                name,
                dob,
                gender
            });

            // Tạo JWT token
            const token = jwt.sign(
                {
                    userId: newUser.id,
                    email: newUser.email,
                    role: newUser.role
                },
                JWT_SECRET,
                { expiresIn: '72h' }
            );

            res.status(201).json({
                success: true,
                message: 'Successfully Registered!',
                data: {
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        role: newUser.role,
                        createdAt: newUser.createdAt
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Register error:', error);

            // Xử lý lỗi validation của Sequelize
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Data is not validation',
                    errors: error.errors.map(err => err.message)
                });
            }

            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already in-used!'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal Server Error'
            });
        }
    },

    // Đăng nhập
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please fill in email and password!'
                });
            }

            // Tìm user theo email
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email or password isn\'t correct!'
                });
            }

            // Kiểm tra password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Email or password isn\'t correct!'
                });
            }


            // Tạo JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Successfully Login',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error'
            });
        }
    },

    // Lấy thông tin user hiện tại
    getProfile: async (req, res) => {
        try {
            const user = await User.findByPk(req.user.userId, {
                attributes: { exclude: ['password'] } // Không trả về password
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found!'
                });
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt
                    }
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
};

module.exports = AuthController;

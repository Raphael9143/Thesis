const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Secret key cho JWT (trong thực tế nên để trong .env file)
const JWT_SECRET = process.env.JWT_SECRET;

const AuthController = {
    // Đăng ký

    register: async (req, res) => {
        try {


            const { email, password, role, full_name, gender, dob } = req.body;

            // Validation
            if (!email || !password || !full_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin (email, password, full_name)'
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



            // Chỉ cho phép đăng ký role là 'STUDENT' hoặc 'TEACHER'
            let regRole = 'STUDENT';
            if (role && ['STUDENT', 'TEACHER'].includes(role.toUpperCase())) {
                regRole = role.toUpperCase();
            }

            // Chuẩn hóa gender
            let regGender = null;
            if (gender && ['MALE', 'FEMALE', 'OTHER'].includes(gender.toUpperCase())) {
                regGender = gender.toUpperCase();
            }


            const newUser = await User.create({
                email,
                password: hashedPassword,
                role: regRole,
                full_name,
                gender: regGender,
                dob
            });

            // Nếu là student thì tạo luôn bản ghi students
            if (regRole === 'STUDENT') {
                const Student = require('../models/Student');
                // Sinh student_code tự động dạng OCL0001, OCL0002...
                const lastStudent = await Student.findOne({
                    order: [['student_id', 'DESC']]
                });
                let nextNumber = 1;
                if (lastStudent && lastStudent.student_code && /^OCL\d{4}$/.test(lastStudent.student_code)) {
                    nextNumber = parseInt(lastStudent.student_code.slice(3)) + 1;
                }
                const student_code = `OCL${String(nextNumber).padStart(4, '0')}`;
                await Student.create({
                    student_id: newUser.id,
                    student_code
                });
            }

            // Nếu là teacher thì tạo luôn bản ghi teachers
            if (regRole === 'TEACHER') {
                const Teacher = require('../models/Teacher');
                await Teacher.create({
                    teacher_id: newUser.id,
                    teacher_code: '', // Có thể sinh mã tự động hoặc cập nhật sau
                });
            }

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
                        full_name: newUser.full_name,
                        email: newUser.email,
                        role: newUser.role,
                        avatar_url: newUser.avatar_url,
                        gender: newUser.gender,
                        dob: newUser.dob,
                        phone_number: newUser.phone_number,
                        address: newUser.address,
                        status: newUser.status,
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
    },

    // Cập nhật thông tin cá nhân
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { full_name, dob, gender, avatar_url, phone_number, address } = req.body;

            // Chỉ cho phép cập nhật các trường này
            const updateData = {};
            if (full_name !== undefined) updateData.full_name = full_name;
            if (dob !== undefined) updateData.dob = dob;
            if (gender !== undefined && ['MALE','FEMALE','OTHER'].includes(gender.toUpperCase())) updateData.gender = gender.toUpperCase();
            if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
            if (phone_number !== undefined) updateData.phone_number = phone_number;
            if (address !== undefined) updateData.address = address;

            const [updated] = await User.update(updateData, { where: { id: userId } });
            if (!updated) {
                return res.status(404).json({ success: false, message: 'User not found!' });
            }
            const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
            res.json({ success: true, message: 'Profile updated successfully', data: { user } });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = AuthController;

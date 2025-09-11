const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Định nghĩa User model

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [6, 255],
            notEmpty: true
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'teacher', 'student'),
        allowNull: false,
            name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            dob: {
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            gender: {
                type: DataTypes.ENUM('male', 'female', 'other'),
                allowNull: true
            },
    }
}, {
    tableName: 'users',
    timestamps: true, // Tự động tạo createdAt và updatedAt
    indexes: [
        {
            unique: true,
            fields: ['email']
        }
    ]
});

module.exports = User;

// Associations (foreign key)
const Class = require('./Class');
const ClassStudent = require('./ClassStudent');

// Một user có thể là giáo viên của nhiều lớp
User.hasMany(Class, { foreignKey: 'teacher_id', as: 'teachingClasses', onDelete: 'CASCADE' });
// Một user có thể là học sinh của nhiều lớp (qua ClassStudent)
User.hasMany(ClassStudent, { foreignKey: 'student_id', as: 'studentClasses', onDelete: 'CASCADE' });

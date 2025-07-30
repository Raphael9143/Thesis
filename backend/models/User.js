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

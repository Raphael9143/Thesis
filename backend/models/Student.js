const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
    student_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    student_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    major: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    completed_assignments: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    }
}, {
    tableName: 'students',
    timestamps: true
});

// Associations
const ClassStudent = require('./ClassStudent');
Student.hasMany(ClassStudent, { foreignKey: 'student_id', as: 'classEnrollments', onDelete: 'CASCADE' });



module.exports = Student;
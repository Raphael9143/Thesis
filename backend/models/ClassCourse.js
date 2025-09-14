const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClassCourse = sequelize.define('ClassCourse', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    class_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    start_week: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    end_week: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'ACTIVE'
    }
}, {
    tableName: 'class_courses',
    timestamps: false
});

module.exports = ClassCourse;

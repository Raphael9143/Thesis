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

// Associations
const Class = require('./Class');
const Course = require('./Course');

// Một lớp có nhiều môn học qua class_courses
Class.belongsToMany(Course, { through: 'class_courses', foreignKey: 'class_id', otherKey: 'course_id', as: 'courses' });
Course.belongsToMany(Class, { through: 'class_courses', foreignKey: 'course_id', otherKey: 'class_id', as: 'classes' });

// Một class_courses thuộc về một class và một course
ClassCourse.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
ClassCourse.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

module.exports = ClassCourse;

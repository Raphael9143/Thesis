const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AssignmentCourse = sequelize.define('AssignmentCourse', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	assignment_id: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	course_id: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	due_date: {
		type: DataTypes.DATE,
		allowNull: true
	},
	start_date: {
		type: DataTypes.DATE,
		allowNull: true
	},
	week: {
		type: DataTypes.INTEGER,
		allowNull: true
	}
}, {
	tableName: 'assignment_courses',
	timestamps: false
});

// Associations
const Assignment = require('./Assignment');
const Course = require('./Course');
Assignment.belongsToMany(Course, { through: AssignmentCourse, foreignKey: 'assignment_id', otherKey: 'course_id', as: 'courses' });
Course.belongsToMany(Assignment, { through: AssignmentCourse, foreignKey: 'course_id', otherKey: 'assignment_id', as: 'assignments' });

AssignmentCourse.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' });
AssignmentCourse.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });



module.exports = AssignmentCourse;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Assignment = sequelize.define('Assignment', {
	assignment_id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	title: {
		type: DataTypes.STRING(255),
		allowNull: false
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: true
	},
	type: {
		type: DataTypes.ENUM('LECTURE', 'EXERCISE', 'EXAM'),
		allowNull: false
	},
	constraints: {
		type: DataTypes.JSON,
		allowNull: true
	},
	created_by: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	difficulty: {
		type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD'),
		allowNull: false
	},
	file: {
		type: DataTypes.STRING(255),
		allowNull: true
	},
	created_at: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW
	},
	updated_at: {
		type: DataTypes.DATE,
		allowNull: true
	}
}, {
	tableName: 'assignments',
	timestamps: false
});

// Associations
const Course = require('./Course');
const User = require('./User');
Assignment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Assignment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = Assignment;

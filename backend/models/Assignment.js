const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Assignment = sequelize.define('Assignment', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	course_id: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	title: {
		type: DataTypes.STRING(255),
		allowNull: false
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: true
	},
	created_by: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	attachment: {
		type: DataTypes.STRING(255),
		allowNull: true
	},
	status: {
 		type: DataTypes.ENUM('draft','published','archived'),
 		allowNull: false,
 		defaultValue: 'draft'
 	},
	type: {
		type: DataTypes.ENUM('SINGLE','GROUP'),
		allowNull: false,
		defaultValue: 'SINGLE'
	},
	start_date: {
		type: DataTypes.DATE,
		allowNull: false
	},
	end_date: {
		type: DataTypes.DATE,
		allowNull: false
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

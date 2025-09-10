const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');


const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  teacherId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'teacher_id'
  },
  semester: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'in_progress', 'closed', 'archived', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'updated_at'
  }
}, {
  tableName: 'classes',
  timestamps: true,
  underscored: true
});

module.exports = Class;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClassStudent = sequelize.define('ClassStudent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'class_students',
  timestamps: false
});

module.exports = ClassStudent;

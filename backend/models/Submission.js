const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  class_assignment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  submission_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ocl_constraints: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  check_result: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('submitted', 'graded', 'late', 'resubmitted'),
    allowNull: false,
    defaultValue: 'submitted'
  },
  is_final: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  tableName: 'submissions',
  timestamps: false
});



module.exports = Submission;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UseOperation = sequelize.define('UseOperation', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  useClassId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'use_class_id'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  signature: {
    type: DataTypes.STRING(500),
    allowNull: true
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
  tableName: 'use_operations',
  timestamps: true,
  underscored: true
});

module.exports = UseOperation;

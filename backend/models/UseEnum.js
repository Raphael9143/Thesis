const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UseEnum = sequelize.define('UseEnum', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  useModelId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'use_model_id'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  values: {
    type: DataTypes.TEXT,
    allowNull: true
  }, // comma-separated values
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
  tableName: 'use_enums',
  timestamps: true,
  underscored: true
});

module.exports = UseEnum;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UseAssociationPart = sequelize.define('UseAssociationPart', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  useAssociationId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'use_association_id'
  },
  className: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'class_name'
  },
  multiplicity: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(200),
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
  tableName: 'use_association_parts',
  timestamps: true,
  underscored: true
});

module.exports = UseAssociationPart;

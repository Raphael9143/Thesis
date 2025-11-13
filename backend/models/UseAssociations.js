// Define associations for USE model tables
const UseModel = require("./UseModel");
const UseEnum = require("./UseEnum");
const UseClass = require("./UseClass");
const UseAttribute = require("./UseAttribute");
const UseOperation = require("./UseOperation");
const UseAssociation = require("./UseAssociation");
const UseAssociationPart = require("./UseAssociationPart");
const UseConstraint = require("./UseConstraint");
const User = require("./User");

UseModel.hasMany(UseEnum, {
  foreignKey: "use_model_id",
  as: "enums",
  onDelete: "CASCADE",
});
UseEnum.belongsTo(UseModel, {
  foreignKey: "use_model_id",
  as: "model",
});

UseModel.hasMany(UseClass, {
  foreignKey: "use_model_id",
  as: "classes",
  onDelete: "CASCADE",
});
UseClass.belongsTo(UseModel, {
  foreignKey: "use_model_id",
  as: "model",
});

UseClass.hasMany(UseAttribute, {
  foreignKey: "use_class_id",
  as: "attributes",
  onDelete: "CASCADE",
});
UseAttribute.belongsTo(UseClass, {
  foreignKey: "use_class_id",
  as: "class",
});

UseClass.hasMany(UseOperation, {
  foreignKey: "use_class_id",
  as: "operations",
  onDelete: "CASCADE",
});
UseOperation.belongsTo(UseClass, {
  foreignKey: "use_class_id",
  as: "class",
});

UseModel.hasMany(UseAssociation, {
  foreignKey: "use_model_id",
  as: "associations",
  onDelete: "CASCADE",
});
UseAssociation.belongsTo(UseModel, {
  foreignKey: "use_model_id",
  as: "model",
});

UseAssociation.hasMany(UseAssociationPart, {
  foreignKey: "use_association_id",
  as: "parts",
  onDelete: "CASCADE",
});
UseAssociationPart.belongsTo(UseAssociation, {
  foreignKey: "use_association_id",
  as: "association",
});

UseModel.hasMany(UseConstraint, {
  foreignKey: "use_model_id",
  as: "constraints",
  onDelete: "CASCADE",
});
UseConstraint.belongsTo(UseModel, {
  foreignKey: "use_model_id",
  as: "model",
});

// Ownership: a UseModel optionally belongs to a User (owner)
UseModel.belongsTo(User, {
  foreignKey: "owner_id",
  as: "owner",
});
User.hasMany(UseModel, {
  foreignKey: "owner_id",
  as: "useModels",
});

module.exports = {
  UseModel,
  UseEnum,
  UseClass,
  UseAttribute,
  UseOperation,
  UseAssociation,
  UseAssociationPart,
  UseConstraint,
};

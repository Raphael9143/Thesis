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
const ResearchProject = require("./ResearchProject");
const ResearchProjectMember = require("./ResearchProjectMember");
const ResearchContribution = require("./ResearchContribution");

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

// Research project associations
ResearchProject.belongsTo(User, {
  foreignKey: "owner_id",
  as: "owner",
});
User.hasMany(ResearchProject, {
  foreignKey: "owner_id",
  as: "researchProjects",
});

// Project main model (optional)
ResearchProject.belongsTo(UseModel, {
  foreignKey: "main_use_model_id",
  as: "mainModel",
});
UseModel.hasMany(ResearchProject, {
  foreignKey: "main_use_model_id",
  as: "projectsUsingThisModel",
});

// Project members
ResearchProject.hasMany(ResearchProjectMember, {
  foreignKey: "research_project_id",
  as: "members",
  onDelete: "CASCADE",
});
ResearchProjectMember.belongsTo(ResearchProject, {
  foreignKey: "research_project_id",
  as: "project",
});
ResearchProjectMember.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});
User.hasMany(ResearchProjectMember, {
  foreignKey: "user_id",
  as: "projectMemberships",
});

// Contributions
ResearchProject.hasMany(ResearchContribution, {
  foreignKey: "research_project_id",
  as: "contributions",
  onDelete: "CASCADE",
});
ResearchContribution.belongsTo(ResearchProject, {
  foreignKey: "research_project_id",
  as: "project",
});
ResearchContribution.belongsTo(UseModel, {
  foreignKey: "use_model_id",
  as: "useModel",
});
UseModel.hasMany(ResearchContribution, {
  foreignKey: "use_model_id",
  as: "contributions",
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

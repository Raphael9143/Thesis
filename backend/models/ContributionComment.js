const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ContributionComment = sequelize.define(
  "ContributionComment",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    contribution_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "contribution_id",
      comment: "Reference to contribution being commented on",
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "user_id",
      comment: "User who posted the comment",
    },
    comment_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "comment_text",
      comment: "Comment content",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_at",
    },
  },
  {
    tableName: "contribution_comments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ContributionComment;

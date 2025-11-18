const AssignmentGroup = require("../models/AssignmentGroup");
const ExamGroup = require("../models/ExamGroup");
const GroupMember = require("../models/GroupMember");
const Assignment = require("../models/Assignment");
const Exam = require("../models/Exam");
const ResearchProject = require("../models/ResearchProject");
const User = require("../models/User");
const ClassStudent = require("../models/ClassStudent");
const ClassCourse = require("../models/ClassCourse");
const { Op } = require("sequelize");

const GroupController = {
  // Create assignment group (student creates group for GROUP assignment)
  createAssignmentGroup: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can create assignment groups.",
        });
      }

      const { assignment_id, group_name, max_members } = req.body;
      const studentId = req.user.userId;

      // Validate assignment exists and is GROUP type
      const assignment = await Assignment.findByPk(assignment_id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found.",
        });
      }

      if (assignment.type !== "GROUP") {
        return res.status(400).json({
          success: false,
          message: "This assignment is not a group assignment.",
        });
      }

      // Check if student is enrolled in a class that has this assignment
      const enrolments = await ClassStudent.findAll({
        where: { student_id: studentId },
        attributes: ["class_id"],
      });
      const enrolledClassIds = enrolments.map((e) => e.class_id);
      if (!enrolledClassIds || enrolledClassIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in any class.",
        });
      }

      const classCourses = await ClassCourse.findAll({
        where: {
          course_id: assignment.course_id,
          class_id: { [Op.in]: enrolledClassIds },
        },
      });

      if (classCourses.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in a class for this assignment.",
        });
      }

      // Check if student already in a group for this assignment
      const existingMembership = await GroupMember.findOne({
        where: { student_id: studentId },
        include: [
          {
            model: AssignmentGroup,
            as: "assignmentGroup",
            where: { assignment_id: assignment_id },
            required: true,
          },
        ],
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: "You are already in a group for this assignment.",
        });
      }

      // Create PRIVATE research project for this group
      const projectTitle = `${assignment.title} - ${group_name}`;
      const researchProject = await ResearchProject.create({
        title: projectTitle,
        description: `Research project for assignment group: ${group_name}`,
        status: "ACTIVE",
        visibility: "PRIVATE",
        owner_id: studentId,
        created_at: new Date(),
      });

      // Create assignment group
      const group = await AssignmentGroup.create({
        assignment_id,
        group_name,
        owner_id: studentId,
        research_project_id: researchProject.id,
        status: "ACTIVE",
        max_members: max_members || 5,
        created_at: new Date(),
      });

      // Add owner as first member
      await GroupMember.create({
        assignment_group_id: group.id,
        student_id: studentId,
        role: "OWNER",
        joined_at: new Date(),
      });

      // Add owner to research project as OWNER
      const ResearchProjectMember = require("../models/ResearchProjectMember");
      await ResearchProjectMember.create({
        research_project_id: researchProject.id,
        user_id: studentId,
        role: "OWNER",
        joined_at: new Date(),
      });

      return res.status(201).json({
        success: true,
        data: {
          group,
          research_project: researchProject,
        },
      });
    } catch (error) {
      console.error("Create assignment group error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Create exam group
  createExamGroup: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can create exam groups.",
        });
      }

      const { exam_id, group_name, max_members } = req.body;
      const studentId = req.user.userId;

      const exam = await Exam.findByPk(exam_id);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found.",
        });
      }

      if (exam.type !== "GROUP") {
        return res.status(400).json({
          success: false,
          message: "This exam is not a group exam.",
        });
      }

      // Check enrollment
      const enrolments = await ClassStudent.findAll({
        where: { student_id: studentId },
        attributes: ["class_id"],
      });
      const enrolledClassIds = enrolments.map((e) => e.class_id);
      if (!enrolledClassIds || enrolledClassIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in any class.",
        });
      }

      const classCourses = await ClassCourse.findAll({
        where: {
          course_id: exam.course_id,
          class_id: { [Op.in]: enrolledClassIds },
        },
      });

      if (classCourses.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in a class for this exam.",
        });
      }

      // Check existing membership
      const existingMembership = await GroupMember.findOne({
        where: { student_id: studentId },
        include: [
          {
            model: ExamGroup,
            as: "examGroup",
            where: { exam_id: exam_id },
            required: true,
          },
        ],
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: "You are already in a group for this exam.",
        });
      }

      // Create PRIVATE research project
      const projectTitle = `${exam.title} - ${group_name}`;
      const researchProject = await ResearchProject.create({
        title: projectTitle,
        description: `Research project for exam group: ${group_name}`,
        status: "ACTIVE",
        visibility: "PRIVATE",
        owner_id: studentId,
        created_at: new Date(),
      });

      // Create exam group
      const group = await ExamGroup.create({
        exam_id,
        group_name,
        owner_id: studentId,
        research_project_id: researchProject.id,
        status: "ACTIVE",
        max_members: max_members || 5,
        created_at: new Date(),
      });

      // Add owner as first member
      await GroupMember.create({
        exam_group_id: group.id,
        student_id: studentId,
        role: "OWNER",
        joined_at: new Date(),
      });

      // Add owner to research project
      const ResearchProjectMember = require("../models/ResearchProjectMember");
      await ResearchProjectMember.create({
        research_project_id: researchProject.id,
        user_id: studentId,
        role: "OWNER",
        joined_at: new Date(),
      });

      return res.status(201).json({
        success: true,
        data: {
          group,
          research_project: researchProject,
        },
      });
    } catch (error) {
      console.error("Create exam group error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Add member to assignment group
  addMemberToAssignmentGroup: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can add members to groups.",
        });
      }

      const groupId = parseInt(req.params.id, 10);
      const { student_id } = req.body;
      const requesterId = req.user.userId;

      if (!student_id) {
        return res.status(400).json({
          success: false,
          message: "student_id is required.",
        });
      }

      // Get group
      const group = await AssignmentGroup.findByPk(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      // Only owner can add members
      if (group.owner_id !== requesterId) {
        return res.status(403).json({
          success: false,
          message: "Only group owner can add members.",
        });
      }

      if (group.status !== "ACTIVE") {
        return res.status(400).json({
          success: false,
          message: "Cannot add members to inactive group.",
        });
      }

      // Check if student already in this group
      const existingMember = await GroupMember.findOne({
        where: {
          assignment_group_id: groupId,
          student_id: student_id,
        },
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "Student is already in this group.",
        });
      }

      // Check if student already in another group for same assignment
      const otherGroupMembership = await GroupMember.findOne({
        where: { student_id: student_id },
        include: [
          {
            model: AssignmentGroup,
            as: "assignmentGroup",
            where: { assignment_id: group.assignment_id },
            required: true,
          },
        ],
      });

      if (otherGroupMembership) {
        return res.status(400).json({
          success: false,
          message: "Student is already in another group for this assignment.",
        });
      }

      // Check max members
      const currentMemberCount = await GroupMember.count({
        where: { assignment_group_id: groupId },
      });

      if (currentMemberCount >= group.max_members) {
        return res.status(400).json({
          success: false,
          message: "Group has reached maximum members.",
        });
      }

      // Add member to group
      const member = await GroupMember.create({
        assignment_group_id: groupId,
        student_id: student_id,
        role: "MEMBER",
        joined_at: new Date(),
      });

      // Add member to research project as CONTRIBUTOR
      const ResearchProjectMember = require("../models/ResearchProjectMember");
      await ResearchProjectMember.create({
        research_project_id: group.research_project_id,
        user_id: student_id,
        role: "CONTRIBUTOR",
        joined_at: new Date(),
      });

      return res.json({
        success: true,
        data: member,
      });
    } catch (error) {
      console.error("Add member to assignment group error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Add member to exam group
  addMemberToExamGroup: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can add members to groups.",
        });
      }

      const groupId = parseInt(req.params.id, 10);
      const { student_id } = req.body;
      const requesterId = req.user.userId;

      if (!student_id) {
        return res.status(400).json({
          success: false,
          message: "student_id is required.",
        });
      }

      const group = await ExamGroup.findByPk(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      if (group.owner_id !== requesterId) {
        return res.status(403).json({
          success: false,
          message: "Only group owner can add members.",
        });
      }

      if (group.status !== "ACTIVE") {
        return res.status(400).json({
          success: false,
          message: "Cannot add members to inactive group.",
        });
      }

      const existingMember = await GroupMember.findOne({
        where: {
          exam_group_id: groupId,
          student_id: student_id,
        },
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "Student is already in this group.",
        });
      }

      const otherGroupMembership = await GroupMember.findOne({
        where: { student_id: student_id },
        include: [
          {
            model: ExamGroup,
            as: "examGroup",
            where: { exam_id: group.exam_id },
            required: true,
          },
        ],
      });

      if (otherGroupMembership) {
        return res.status(400).json({
          success: false,
          message: "Student is already in another group for this exam.",
        });
      }

      const currentMemberCount = await GroupMember.count({
        where: { exam_group_id: groupId },
      });

      if (currentMemberCount >= group.max_members) {
        return res.status(400).json({
          success: false,
          message: "Group has reached maximum members.",
        });
      }

      const member = await GroupMember.create({
        exam_group_id: groupId,
        student_id: student_id,
        role: "MEMBER",
        joined_at: new Date(),
      });

      const ResearchProjectMember = require("../models/ResearchProjectMember");
      await ResearchProjectMember.create({
        research_project_id: group.research_project_id,
        user_id: student_id,
        role: "CONTRIBUTOR",
        joined_at: new Date(),
      });

      return res.json({
        success: true,
        data: member,
      });
    } catch (error) {
      console.error("Add member to exam group error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Remove member from assignment group
  removeMemberFromAssignmentGroup: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can remove members.",
        });
      }

      const groupId = parseInt(req.params.id, 10);
      const { student_id } = req.body;
      const requesterId = req.user.userId;

      const group = await AssignmentGroup.findByPk(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      // Owner can remove others, or member can remove themselves
      if (group.owner_id !== requesterId && student_id !== requesterId) {
        return res.status(403).json({
          success: false,
          message: "You can only remove yourself or be the owner.",
        });
      }

      // Cannot remove owner
      if (student_id === group.owner_id) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove group owner.",
        });
      }

      const member = await GroupMember.findOne({
        where: {
          assignment_group_id: groupId,
          student_id: student_id,
        },
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Member not found in this group.",
        });
      }

      // Remove from research project
      const ResearchProjectMember = require("../models/ResearchProjectMember");
      await ResearchProjectMember.destroy({
        where: {
          research_project_id: group.research_project_id,
          user_id: student_id,
        },
      });

      // Remove from group
      await member.destroy();

      return res.json({
        success: true,
        message: "Member removed successfully.",
      });
    } catch (error) {
      console.error("Remove member from assignment group error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Remove member from exam group
  removeMemberFromExamGroup: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can remove members.",
        });
      }

      const groupId = parseInt(req.params.id, 10);
      const { student_id } = req.body;
      const requesterId = req.user.userId;

      const group = await ExamGroup.findByPk(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      if (group.owner_id !== requesterId && student_id !== requesterId) {
        return res.status(403).json({
          success: false,
          message: "You can only remove yourself or be the owner.",
        });
      }

      if (student_id === group.owner_id) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove group owner.",
        });
      }

      const member = await GroupMember.findOne({
        where: {
          exam_group_id: groupId,
          student_id: student_id,
        },
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Member not found in this group.",
        });
      }

      const ResearchProjectMember = require("../models/ResearchProjectMember");
      await ResearchProjectMember.destroy({
        where: {
          research_project_id: group.research_project_id,
          user_id: student_id,
        },
      });

      await member.destroy();

      return res.json({
        success: true,
        message: "Member removed successfully.",
      });
    } catch (error) {
      console.error("Remove member from exam group error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Get assignment group details with members
  getAssignmentGroup: async (req, res) => {
    try {
      const groupId = parseInt(req.params.id, 10);

      const group = await AssignmentGroup.findByPk(groupId, {
        include: [
          {
            model: Assignment,
            as: "assignment",
            attributes: ["id", "title", "type"],
          },
          {
            model: User,
            as: "owner",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: ResearchProject,
            as: "researchProject",
            attributes: ["id", "title", "visibility", "status"],
          },
        ],
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      // Get members
      const members = await GroupMember.findAll({
        where: { assignment_group_id: groupId },
        include: [
          {
            model: User,
            as: "student",
            attributes: ["id", "full_name", "email"],
          },
        ],
      });

      return res.json({
        success: true,
        data: {
          ...group.toJSON(),
          members: members,
        },
      });
    } catch (error) {
      console.error("Get assignment group error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Get exam group details with members
  getExamGroup: async (req, res) => {
    try {
      const groupId = parseInt(req.params.id, 10);

      const group = await ExamGroup.findByPk(groupId, {
        include: [
          {
            model: Exam,
            as: "exam",
            attributes: ["id", "title", "type"],
          },
          {
            model: User,
            as: "owner",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: ResearchProject,
            as: "researchProject",
            attributes: ["id", "title", "visibility", "status"],
          },
        ],
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      const members = await GroupMember.findAll({
        where: { exam_group_id: groupId },
        include: [
          {
            model: User,
            as: "student",
            attributes: ["id", "full_name", "email"],
          },
        ],
      });

      return res.json({
        success: true,
        data: {
          ...group.toJSON(),
          members: members,
        },
      });
    } catch (error) {
      console.error("Get exam group error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // List all groups for an assignment (for teachers)
  listAssignmentGroups: async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId, 10);
      const role = req.user && req.user.role;
      const userId = req.user && req.user.userId;

      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found.",
        });
      }

      // Teacher verification
      if (role === "TEACHER") {
        const classCourses = await ClassCourse.findAll({
          where: { course_id: assignment.course_id },
          attributes: ["class_id"],
        });
        const classIds = classCourses.map((cc) => cc.class_id);
        if (classIds.length === 0) {
          return res.json({ success: true, data: [] });
        }
        const Class = require("../models/Class");
        const teacherClass = await Class.findOne({
          where: { id: classIds, teacher_id: userId },
        });
        if (!teacherClass && role !== "ADMIN") {
          return res.status(403).json({
            success: false,
            message: "Forbidden",
          });
        }
      }

      const groups = await AssignmentGroup.findAll({
        where: { assignment_id: assignmentId },
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: ResearchProject,
            as: "researchProject",
            attributes: ["id", "title", "visibility", "status"],
          },
        ],
      });

      // Get member count for each group
      const enrichedGroups = await Promise.all(
        groups.map(async (group) => {
          const memberCount = await GroupMember.count({
            where: { assignment_group_id: group.id },
          });
          return {
            ...group.toJSON(),
            member_count: memberCount,
          };
        })
      );

      return res.json({
        success: true,
        data: enrichedGroups,
      });
    } catch (error) {
      console.error("List assignment groups error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // List all groups for an exam (for teachers)
  listExamGroups: async (req, res) => {
    try {
      const examId = parseInt(req.params.examId, 10);
      const role = req.user && req.user.role;
      const userId = req.user && req.user.userId;

      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found.",
        });
      }

      // Teacher verification
      if (role === "TEACHER") {
        const classCourses = await ClassCourse.findAll({
          where: { course_id: exam.course_id },
          attributes: ["class_id"],
        });
        const classIds = classCourses.map((cc) => cc.class_id);
        if (classIds.length === 0) {
          return res.json({ success: true, data: [] });
        }
        const Class = require("../models/Class");
        const teacherClass = await Class.findOne({
          where: { id: classIds, teacher_id: userId },
        });
        if (!teacherClass && role !== "ADMIN") {
          return res.status(403).json({
            success: false,
            message: "Forbidden",
          });
        }
      }

      const groups = await ExamGroup.findAll({
        where: { exam_id: examId },
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: ResearchProject,
            as: "researchProject",
            attributes: ["id", "title", "visibility", "status"],
          },
        ],
      });

      const enrichedGroups = await Promise.all(
        groups.map(async (group) => {
          const memberCount = await GroupMember.count({
            where: { exam_group_id: group.id },
          });
          return {
            ...group.toJSON(),
            member_count: memberCount,
          };
        })
      );

      return res.json({
        success: true,
        data: enrichedGroups,
      });
    } catch (error) {
      console.error("List exam groups error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Get student's group for assignment
  getMyAssignmentGroup: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can view their group.",
        });
      }

      const assignmentId = parseInt(req.params.assignmentId, 10);
      const studentId = req.user.userId;

      const membership = await GroupMember.findOne({
        where: { student_id: studentId },
        include: [
          {
            model: AssignmentGroup,
            as: "assignmentGroup",
            where: { assignment_id: assignmentId },
            required: true,
            include: [
              {
                model: User,
                as: "owner",
                attributes: ["id", "full_name", "email"],
              },
              {
                model: ResearchProject,
                as: "researchProject",
                attributes: ["id", "title", "visibility", "status"],
              },
            ],
          },
        ],
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: "You are not in any group for this assignment.",
        });
      }

      // Get all members
      const members = await GroupMember.findAll({
        where: { assignment_group_id: membership.assignmentGroup.id },
        include: [
          {
            model: User,
            as: "student",
            attributes: ["id", "full_name", "email"],
          },
        ],
      });

      return res.json({
        success: true,
        data: {
          ...membership.assignmentGroup.toJSON(),
          members: members,
        },
      });
    } catch (error) {
      console.error("Get my assignment group error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // Get student's group for exam
  getMyExamGroup: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can view their group.",
        });
      }

      const examId = parseInt(req.params.examId, 10);
      const studentId = req.user.userId;

      const membership = await GroupMember.findOne({
        where: { student_id: studentId },
        include: [
          {
            model: ExamGroup,
            as: "examGroup",
            where: { exam_id: examId },
            required: true,
            include: [
              {
                model: User,
                as: "owner",
                attributes: ["id", "full_name", "email"],
              },
              {
                model: ResearchProject,
                as: "researchProject",
                attributes: ["id", "title", "visibility", "status"],
              },
            ],
          },
        ],
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: "You are not in any group for this exam.",
        });
      }

      const members = await GroupMember.findAll({
        where: { exam_group_id: membership.examGroup.id },
        include: [
          {
            model: User,
            as: "student",
            attributes: ["id", "full_name", "email"],
          },
        ],
      });

      return res.json({
        success: true,
        data: {
          ...membership.examGroup.toJSON(),
          members: members,
        },
      });
    } catch (error) {
      console.error("Get my exam group error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = GroupController;

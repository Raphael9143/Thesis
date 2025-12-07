// Consolidated AdminController
const { Op } = require("sequelize");
const User = require("../models/User");
const Course = require("../models/Course");
const Class = require("../models/Class");
const Assignment = require("../models/Assignment");
const Exam = require("../models/Exam");
const Submission = require("../models/Submission");
const bcrypt = require("bcryptjs");

// profile models
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Researcher = require("../models/Researcher");
// (no project/member requires needed here currently)

const AdminController = {
  // Simple site stats
  stats: async (req, res) => {
    try {
      const usersCount = await User.count();
      const students = await User.count({ where: { role: "STUDENT" } });
      const teachers = await User.count({ where: { role: "TEACHER" } });
      const admins = await User.count({ where: { role: "ADMIN" } });
      const courses = await Course.count();
      const classes = await Class.count();
      const assignments = await Assignment.count();
      const exams = await Exam.count();
      const submissions = await Submission.count();

      return res.json({
        success: true,
        data: {
          users: usersCount,
          byRole: { students, teachers, admins },
          courses,
          classes,
          assignments,
          exams,
          submissions,
        },
      });
    } catch (err) {
      console.error("Admin stats error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // GET /api/admin/users with filters and pagination
  listUsers: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
      const offset = (page - 1) * limit;
      const { role, status, email, q } = req.query;
      const where = {};
      if (role) where.role = role.toUpperCase();
      if (status) where.status = status.toUpperCase();
      if (email) where.email = email;
      if (q) {
        where[Op.or] = [
          { full_name: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ["password"] },
        limit,
        offset,
        order: [["created_at", "DESC"]],
      });
      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      console.error("List users error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // GET /api/admin/users/:id (detailed)
  getUser: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id)
        return res
          .status(400)
          .json({ success: false, message: "Invalid user id" });
      const user = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
        include: [
          { model: Student, as: "studentProfile" },
          { model: Teacher, as: "teacherProfile" },
          { model: Researcher, as: "researcherProfile" },
        ],
      });
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      return res.json({ success: true, data: user });
    } catch (err) {
      console.error("Get user error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // POST /api/admin/users - create user
  createUser: async (req, res) => {
    try {
      const { full_name, email, password, role = "STUDENT" } = req.body;
      if (!full_name || !email || !password)
        return res
          .status(400)
          .json({
            success: false,
            message: "full_name, email and password are required",
          });
      const exist = await User.findOne({ where: { email } });
      if (exist)
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({
        full_name,
        email,
        password: hashed,
        role,
      });
      return res.status(201).json({ success: true, data: user });
    } catch (err) {
      console.error("Create user error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // PATCH /api/admin/users/:id/disable
  disableUser: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id)
        return res
          .status(400)
          .json({ success: false, message: "Invalid user id" });
      const user = await User.findByPk(id);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      user.status = "BANNED";
      await user.save();
      return res.json({
        success: true,
        message: "User disabled",
        data: { id: user.id, status: user.status },
      });
    } catch (err) {
      console.error("Disable user error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // PATCH /api/admin/users/:id/enable
  enableUser: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id)
        return res
          .status(400)
          .json({ success: false, message: "Invalid user id" });
      const user = await User.findByPk(id);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      user.status = "ACTIVE";
      await user.save();
      return res.json({
        success: true,
        message: "User enabled",
        data: { id: user.id, status: user.status },
      });
    } catch (err) {
      console.error("Enable user error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // DELETE /api/admin/users/:id - soft-delete
  deleteUser: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id)
        return res
          .status(400)
          .json({ success: false, message: "Invalid user id" });
      const user = await User.findByPk(id);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      const timestamp = Date.now();
      const originalEmail = user.email || "";
      user.status = "BANNED";
      user.email = `deleted+${timestamp}+${originalEmail}`;
      user.phone_number = null;
      user.avatar_url = null;
      await user.save();
      return res.json({
        success: true,
        message: "User soft-deleted",
        data: { id: user.id },
      });
    } catch (err) {
      console.error("Delete user error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = AdminController;

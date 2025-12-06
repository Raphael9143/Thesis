const User = require("../models/User");
const Course = require("../models/Course");
const Class = require("../models/Class");
const Assignment = require("../models/Assignment");
const Exam = require("../models/Exam");
const Submission = require("../models/Submission");
const bcrypt = require("bcryptjs");

const AdminController = {
  // GET /api/admin/stats
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

  // GET /api/admin/users
  listUsers: async (req, res) => {
    try {
      const { role, page = 1, limit = 20 } = req.query;
      const where = {};
      if (role) where.role = role;
      const pageNum = Number(page) || 1;
      const perPage = Number(limit) || 20;
      const offset = (pageNum - 1) * perPage;

      const [users, total] = await Promise.all([
        User.findAll({ where, limit: perPage, offset }),
        User.count({ where }),
      ]);

      const totalPages = Math.ceil(total / perPage);
      return res.json({
        success: true,
        data: users,
        meta: { total, page: pageNum, limit: perPage, totalPages },
      });
    } catch (err) {
      console.error("List users error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // GET /api/admin/users/:id
  getUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
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

  // POST /api/admin/users
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



  // DELETE /api/admin/users/:id
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      await user.destroy();
      return res.json({ success: true, message: "User deleted" });
    } catch (err) {
      console.error("Delete user error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = AdminController;

const User = require("../models/User");

const UserController = {
  // Delete user account
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      // Only admin or the account owner can delete
      if (req.user.role !== "ADMIN" && req.user.userId != userId) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to delete this account.",
        });
      }
      const user = await User.findByPk(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      await user.destroy();
      res.json({ success: true, message: "User deleted." });
    } catch (error) {
      console.error("Delete user error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Get list of emails for all students
  getStudentEmails: async (req, res) => {
    try {
      // Only admin or teacher should call this endpoint?
      // Currently allowed for any authenticated user
      const students = await User.findAll({
        where: { role: "STUDENT" },
        attributes: ["email"],
      });
      const emails = students.map((s) => s.email);
      res.json({ success: true, data: emails });
    } catch (error) {
      console.error("Get student emails error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Get userId by email (query param ?email=...)
  getUserIdByEmail: async (req, res) => {
    try {
      const { email } = req.query;
      if (!email)
        return res
          .status(400)
          .json({ success: false, message: "Missing email query parameter" });
      const user = await User.findOne({
        where: { email },
        attributes: ["id", "email"],
      });
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      res.json({ success: true, data: { id: user.id, email: user.email } });
    } catch (error) {
      console.error("Get userId by email error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = UserController;

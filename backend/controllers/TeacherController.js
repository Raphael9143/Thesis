const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const User = require("../models/User");

const TeacherController = {
  // Get current teacher profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user.userId;
      // Get user
      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });
      if (!user || user.role !== "TEACHER") {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found!" });
      }
      // Get teacher profile
      const teacher = await Teacher.findByPk(userId);
      if (!teacher) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher profile not found!" });
      }
      // Get classes taught by the teacher
      const courses = await Class.findAll({
        where: { teacher_id: userId },
        attributes: ["id"],
      });
      res.json({
        success: true,
        data: {
          ...user.toJSON(),
          ...teacher.toJSON(),
          courses_taught: courses.map((c) => c.id),
        },
      });
    } catch (error) {
      console.error("Get teacher profile error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
  // Update current teacher profile
  updateProfile: async (req, res) => {
    try {
      const teacherId = req.user.userId;
      const { teacher_code, department, description, reference_links } = req.body;
      const teacher = await Teacher.findByPk(teacherId);
      if (!teacher) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found!" });
      }
      // Update allowed fields
      if (teacher_code !== undefined) teacher.teacher_code = teacher_code;
      if (department !== undefined) teacher.department = department;
      if (description !== undefined) teacher.description = description;
      if (reference_links !== undefined) {
        // Validate reference_links is array of https URLs
        if (Array.isArray(reference_links)) {
          const invalidLinks = reference_links.filter(
            (link) => typeof link !== "string" || !link.startsWith("https://")
          );
          if (invalidLinks.length > 0) {
            return res.status(400).json({
              success: false,
              message: "All reference links must be HTTPS URLs",
            });
          }
          teacher.reference_links = reference_links;
        } else {
          return res.status(400).json({
            success: false,
            message: "reference_links must be an array",
          });
        }
      }
      await teacher.save();
      res.json({
        success: true,
        message: "Teacher profile updated!",
        data: teacher,
      });
    } catch (error) {
      console.error("Update teacher profile error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Get list of classes the teacher manages
  getManagedClasses: async (req, res) => {
    try {
      const userId = req.user.userId;
      // Check role
      const user = await User.findByPk(userId);
      if (!user || user.role !== "TEACHER") {
        return res.status(403).json({
          success: false,
          message: "Only teachers can view their managed classes.",
        });
      }
      // Get class list
      const classes = await Class.findAll({
        where: { teacher_id: userId },
        attributes: [
          "id",
          "name",
          "code",
          "description",
          "year",
          "status",
          "max_students",
          "current_students",
          "created_at",
          "updated_at",
        ],
      });
      res.json({
        success: true,
        data: classes,
      });
    } catch (error) {
      console.error("Get managed classes error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
  // Get courses the teacher has taught (from homeroom classes)
  getTaughtCourses: async (req, res) => {
    try {
      const userId = req.user.userId;
      // Check role
      const user = await User.findByPk(userId);
      if (!user || user.role !== "TEACHER") {
        return res.status(403).json({
          success: false,
          message: "Only teachers can view their taught courses.",
        });
      }

      // Get homeroom classes (past and present)
      const classes = await Class.findAll({
        where: { teacher_id: userId },
        attributes: ["id"],
      });
      const classIds = classes.map((c) => c.id);

      if (classIds.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Get class_courses records and include Course
      const ClassCourse = require("../models/ClassCourse");
      const Course = require("../models/Course");
      const links = await ClassCourse.findAll({
        where: { class_id: classIds },
        include: [{ model: Course, as: "course" }],
      });

      // Filter unique courses by course_id
      const uniqueMap = new Map();
      for (const link of links) {
        const course = link.course;
        if (course && !uniqueMap.has(course.course_id)) {
          uniqueMap.set(course.course_id, course);
        }
      }
      const courses = Array.from(uniqueMap.values());

      res.json({ success: true, data: courses });
    } catch (error) {
      console.error("Get taught courses error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};

module.exports = TeacherController;

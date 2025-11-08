const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const User = require("../models/User");

const TeacherController = {
  // Lấy profile giảng viên hiện tại
  getProfile: async (req, res) => {
    try {
      const userId = req.user.userId;
      // Lấy user
      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });
      if (!user || user.role !== "TEACHER") {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found!" });
      }
      // Lấy teacher profile
      const teacher = await Teacher.findByPk(userId);
      if (!teacher) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher profile not found!" });
      }
      // Lấy các lớp đã/đang dạy
      const courses = await Class.findAll({
        where: { teacherId: userId },
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
  // Sửa thông tin profile giảng viên hiện tại
  updateProfile: async (req, res) => {
    try {
      const teacherId = req.user.userId;
      const { teacher_code, department, expertise, research_papers } = req.body;
      const teacher = await Teacher.findByPk(teacherId);
      if (!teacher) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found!" });
      }
      // Cập nhật các trường cho phép
      if (teacher_code !== undefined) teacher.teacher_code = teacher_code;
      if (department !== undefined) teacher.department = department;
      if (expertise !== undefined) teacher.expertise = expertise;
      if (research_papers !== undefined)
        teacher.research_papers = research_papers;
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

  // Lấy danh sách các lớp mà giáo viên quản lý
  getManagedClasses: async (req, res) => {
    try {
      const userId = req.user.userId;
      // Kiểm tra role
      const user = await User.findByPk(userId);
      if (!user || user.role !== "TEACHER") {
        return res
          .status(403)
          .json({
            success: false,
            message: "Only teachers can view their managed classes.",
          });
      }
      // Lấy danh sách lớp
      const classes = await Class.findAll({
        where: { teacherId: userId },
        attributes: [
          "id",
          "name",
          "code",
          "description",
          "year",
          "status",
          "max_students",
          "current_students",
          "createdAt",
          "updatedAt",
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
  // Lấy danh sách môn học giáo viên đã dạy (từ các lớp giáo viên làm chủ nhiệm)
  getTaughtCourses: async (req, res) => {
    try {
      const userId = req.user.userId;
      // Kiểm tra role
      const user = await User.findByPk(userId);
      if (!user || user.role !== "TEACHER") {
        return res
          .status(403)
          .json({
            success: false,
            message: "Only teachers can view their taught courses.",
          });
      }

      // Lấy danh sách các lớp do giáo viên làm chủ nhiệm (đã và đang)
      const classes = await Class.findAll({
        where: { teacherId: userId },
        attributes: ["id"],
      });
      const classIds = classes.map((c) => c.id);

      if (classIds.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Lấy các bản ghi class_courses và include Course
      const ClassCourse = require("../models/ClassCourse");
      const Course = require("../models/Course");
      const links = await ClassCourse.findAll({
        where: { class_id: classIds },
        include: [{ model: Course, as: "course" }],
      });

      // Lọc unique courses theo course_id
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

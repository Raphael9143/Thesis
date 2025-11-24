const Course = require("../models/Course");
const User = require("../models/User");
const ClassCourse = require("../models/ClassCourse");
const Class = require("../models/Class");

const CourseController = {
  // Get list of all courses
  getAllCourses: async (req, res) => {
    try {
      const courses = await Course.findAll();
      res.json({ success: true, data: courses });
    } catch (error) {
      console.error("Get all courses error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
  // Create a new course
  createCourse: async (req, res) => {
    try {
      const {
        course_name,
        course_code,
        description,
        semester,
        class_id,
        status,
      } = req.body;
      if (!course_name || !course_code || !class_id) {
        return res.status(400).json({
          success: false,
          message: "course_name, course_code and class_id are required.",
        });
      }
      // Only allow TEACHER to create courses
      const user = await User.findByPk(req.user.userId);
      if (!user || user.role !== "TEACHER") {
        return res.status(403).json({
          success: false,
          message: "Only teachers can create courses.",
        });
      }
      // Check class exists
      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res.status(404).json({ success: false, message: "Class does not exist." });
      }
      // Verify the class's homeroom teacher matches the requester
      if (foundClass.teacher_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: "You are not the homeroom teacher for this class.",
        });
      }
      const created_by = req.user.userId;
      // Validate status cho Course
      let courseStatus = status || "ACTIVE";
      if (!["ACTIVE", "DRAFT", "INACTIVE"].includes(courseStatus)) {
        return res.status(400).json({
          success: false,
          message: "Only status ACTIVE or INACTIVE are allowed.",
        });
      }
      const newCourse = await Course.create({
        course_name,
        course_code,
        description,
        semester,
        status: courseStatus,
        created_by,
        created_at: new Date(),
      });
      // Create mapping in class_courses (id, class_id, course_id)
      const classCourse = await ClassCourse.create({
        class_id,
        course_id: newCourse.course_id,
      });
      res.status(201).json({
        success: true,
        data: { ...newCourse.toJSON(), class_course: classCourse },
      });
    } catch (error) {
      console.error("Create course error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
  // Get list of courses by class
  getCoursesByClass: async (req, res) => {
    try {
      const classId = req.params.classId;
      // Check class exists
      const foundClass = await Class.findByPk(classId);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }
      // Retrieve courses via N-N relationship
      const courses = await foundClass.getCourses();
      res.json({ success: true, data: courses });
    } catch (error) {
      console.error("Get courses by class error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }, // Cập nhật thông tin lớp môn học (class_courses)
  updateClassCourse: async (req, res) => {
    try {
      const { id } = req.params; // id của class_course
      const { status, name, description } = req.body;
      const userId = req.user.userId;
      const userRole = req.user.role;
      // Find class_course
      const classCourse = await ClassCourse.findByPk(id);
      if (!classCourse) {
        return res
          .status(404)
          .json({ success: false, message: "ClassCourse not found." });
      }
      // Get class info to check permissions
      const foundClass = await Class.findByPk(classCourse.class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }
      // Only homeroom teacher or admin can update
      if (userRole !== "ADMIN" && foundClass.teacher_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to update this class course.",
        });
      }
      // Cập nhật vào Course
      const course = await Course.findByPk(classCourse.course_id);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });
      }
      let updated = false;
      if (status !== undefined) {
        if (!["ACTIVE", "DRAFT", "INACTIVE"].includes(status)) {
          return res.status(400).json({
            success: false,
            message: "Only status ACTIVE or INACTIVE are allowed.",
          });
        }
        course.status = status;
        updated = true;
      }
      if (name !== undefined) {
        course.course_name = name;
        updated = true;
      }
      if (description !== undefined) {
        course.description = description;
        updated = true;
      }
      if (updated) await course.save();
      res.json({ success: true, message: "Update successful", data: { course } });
    } catch (error) {
      console.error("Update class_course error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }, // Cập nhật status của course
  updateCourseStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res
          .status(400)
          .json({ success: false, message: "Status is required." });
      }
      if (!["ACTIVE", "DRAFT", "INACTIVE"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Only ACTIVE, DRAFT, INACTIVE are accepted.",
        });
      }
      const course = await Course.findByPk(id);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });
      }
      // Chỉ cho phép ADMIN hoặc người tạo course cập nhật status
      const user = req.user;
      if (user.role !== "ADMIN" && course.created_by !== user.userId) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to perform this action",
        });
      }
      course.status = status;
      await course.save();
      res.json({
        success: true,
        message: "Course status updated!",
        data: course,
      });
    } catch (error) {
      console.error("Update course status error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
  // Xóa môn học
  deleteCourse: async (req, res) => {
    try {
      const courseId = req.params.id;
      const user = req.user;
      const course = await Course.findByPk(courseId);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });
      }
      // Chỉ admin hoặc người tạo course mới được xóa
      if (user.role !== "ADMIN" && course.created_by !== user.userId) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to delete this course.",
        });
      }
      await course.destroy();
      res.json({ success: true, message: "Course deleted." });
    } catch (error) {
      console.error("Delete course error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Lấy thông tin môn học theo id
  getCourseById: async (req, res) => {
    try {
      const id = req.params.id;
      const course = await Course.findByPk(id);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });
      }
      res.json({ success: true, data: course });
    } catch (error) {
      console.error("Get course by id error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Lấy thông tin môn học theo code
  getCourseByCode: async (req, res) => {
    try {
      const code = req.params.code;
      const course = await Course.findOne({ where: { course_code: code } });
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });
      }
      res.json({ success: true, data: course });
    } catch (error) {
      console.error("Get course by code error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};

module.exports = CourseController;

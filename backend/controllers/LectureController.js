const Lecture = require("../models/Lecture");
const Course = require("../models/Course");
const Class = require("../models/Class");
const ClassCourse = require("../models/ClassCourse");
const ClassStudent = require("../models/ClassStudent");
const User = require("../models/User");

const LectureController = {
  createLecture: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "TEACHER") {
        return res.status(403).json({
          success: false,
          message: "Only teachers can create lectures.",
        });
      }
      const teacherId = req.user.userId;
      const { course_id, title, publish_date, status } = req.body;
      if (!course_id || !title) {
        return res.status(400).json({
          success: false,
          message: "course_id and title are required.",
        });
      }

      // Verify course exists
      const course = await Course.findByPk(course_id);
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });

      // Require the teacher to be homeroom teacher for at least one class linked to this course
      const links = await ClassCourse.findAll({ where: { course_id } });
      const classIds = links.map((l) => l.class_id);
      if (classIds.length === 0)
        return res.status(400).json({
          success: false,
          message: "No classes linked to this course.",
        });
      const owned = await Class.findOne({ where: { id: classIds, teacherId } });
      if (!owned)
        return res.status(403).json({
          success: false,
          message:
            "You are not the homeroom teacher for any class of this course.",
        });

      // Single attachment handling: prefer uploaded file, else use body. Store as string path.
      let attachment = null;
      if (req.file) {
        attachment = `/uploads/lectures/${req.file.filename}`;
      } else if (req.body.attachment) {
        // client may provide existing path
        attachment = req.body.attachment;
      }

      const lecture = await Lecture.create({
        course_id,
        teacher_id: teacherId,
        title,
        attachment: attachment || null,
        publish_date: publish_date || null,
        status: status || "draft",
      });

      res
        .status(201)
        .json({ success: true, message: "Lecture created!", data: lecture });
    } catch (error) {
      console.error("Create lecture error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get lecture by id
  getLectureById: async (req, res) => {
    try {
      const id = req.params.id;
      const lecture = await Lecture.findByPk(id, {
        include: [{ model: Course, as: "course" }],
      });
      if (!lecture)
        return res
          .status(404)
          .json({ success: false, message: "Lecture not found." });
      res.json({ success: true, data: lecture });
    } catch (error) {
      console.error("Get lecture error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Update lecture fields (title, publish_date, status, attachments)
  updateLecture: async (req, res) => {
    try {
      if (!req.user)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const id = req.params.id;
      const lecture = await Lecture.findByPk(id);
      if (!lecture)
        return res
          .status(404)
          .json({ success: false, message: "Lecture not found." });

      const user = req.user;
      if (!(user.role === "admin" || lecture.teacher_id === user.userId)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const { title, publish_date, status } = req.body;
      const allowed = ["draft", "published", "archived"];
      if (status && !allowed.includes(status))
        return res
          .status(400)
          .json({ success: false, message: "Invalid status" });

      // Single attachment update: replace or keep existing
      if (req.file) {
        lecture.attachment = `/uploads/lectures/${req.file.filename}`;
      } else if (req.body.attachment !== undefined) {
        // explicit set (could be null/empty)
        lecture.attachment = req.body.attachment || null;
      }

      if (title) lecture.title = title;
      if (publish_date) lecture.publish_date = publish_date;
      if (status) lecture.status = status;

      await lecture.save();
      res.json({ success: true, message: "Lecture updated", data: lecture });
    } catch (error) {
      console.error("Update lecture error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Update lecture status (only lecture's teacher or admin)
  updateLectureStatus: async (req, res) => {
    try {
      if (!req.user)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const id = req.params.id;
      const { status } = req.body;
      const allowed = ["draft", "published", "archived"];
      if (!status || !allowed.includes(status))
        return res
          .status(400)
          .json({ success: false, message: "Invalid status" });

      const lecture = await Lecture.findByPk(id);
      if (!lecture)
        return res
          .status(404)
          .json({ success: false, message: "Lecture not found." });

      // Only admin or the teacher who created the lecture can change status
      const user = req.user;
      if (!(user.role === "admin" || lecture.teacher_id === user.userId)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      lecture.status = status;
      await lecture.save();

      res.json({
        success: true,
        message: "Lecture status updated",
        data: lecture,
      });
    } catch (error) {
      console.error("Update lecture status error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Delete lecture by id (only lecture's teacher or admin)
  deleteLecture: async (req, res) => {
    try {
      if (!req.user)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const id = req.params.id;
      const lecture = await Lecture.findByPk(id);
      if (!lecture)
        return res
          .status(404)
          .json({ success: false, message: "Lecture not found." });

      const user = req.user;
      if (!(user.role === "admin" || lecture.teacher_id === user.userId)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      await lecture.destroy();
      res.json({ success: true, message: "Lecture deleted" });
    } catch (error) {
      console.error("Delete lecture error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  getLecturesByCourseId: async (req, res) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      if (isNaN(courseId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid course id" });

      const course = await Course.findByPk(courseId);
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });

      const user = req.user;
      // Admin allowed
      if (user && user.role === "admin") {
        // proceed
      } else if (user && user.role === "TEACHER") {
        // allowed if teacher created the course or teaches at least one class linked to it
        if (course.created_by === user.userId) {
          // allowed
        } else {
          const links = await ClassCourse.findAll({
            where: { course_id: courseId },
          });
          const classIds = links.map((l) => l.class_id);
          const owned = await Class.findOne({
            where: { id: classIds, teacherId: user.userId },
          });
          if (!owned)
            return res
              .status(403)
              .json({ success: false, message: "Forbidden" });
        }
      } else if (user && user.role === "STUDENT") {
        // allowed if student enrolled in any class linked to this course
        const links = await ClassCourse.findAll({
          where: { course_id: courseId },
        });
        const classIds = links.map((l) => l.class_id);
        if (classIds.length === 0)
          return res.status(403).json({ success: false, message: "Forbidden" });
        const member = await ClassStudent.findOne({
          where: { classId: classIds, studentId: user.userId },
        });
        if (!member)
          return res.status(403).json({ success: false, message: "Forbidden" });
      } else {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const lectures = await Lecture.findAll({
        where: { course_id: courseId },
        include: [
          {
            model: User,
            as: "teacher",
            attributes: ["id", "full_name", "email"],
          },
        ],
        order: [["publish_date", "DESC"]],
      });

      res.json({ success: true, data: lectures });
    } catch (error) {
      console.error("Get lectures by course id error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = LectureController;

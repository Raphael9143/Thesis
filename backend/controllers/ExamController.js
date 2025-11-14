const Exam = require("../models/Exam");
const Course = require("../models/Course");
const ClassCourse = require("../models/ClassCourse");
const Class = require("../models/Class");
const ClassStudent = require("../models/ClassStudent");

const ExamController = {
  // Create an exam (only teachers allowed)
  createExam: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "TEACHER") {
        return res
          .status(403)
          .json({ success: false, message: "Only teachers can create exams." });
      }
      const {
        course_id,
        title,
        description,
        start_date,
        end_date,
        type,
        submission_limit,
        status,
      } = req.body;
      if (!course_id || !title)
        return res.status(400).json({
          success: false,
          message: "course_id and title are required.",
        });

      // start_date and end_date are required
      if (!start_date || !end_date)
        return res.status(400).json({
          success: false,
          message: "start_date and end_date are required.",
        });
      const s = new Date(start_date);
      const e = new Date(end_date);
      if (isNaN(s.getTime()) || isNaN(e.getTime()))
        return res
          .status(400)
          .json({ success: false, message: "Invalid start_date or end_date." });
      if (s >= e)
        return res.status(400).json({
          success: false,
          message: "start_date must be before end_date.",
        });

      const course = await Course.findByPk(course_id);
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });

      // validate type if provided
      const allowedTypes = ["SINGLE", "GROUP"];
      if (type && !allowedTypes.includes(type))
        return res.status(400).json({
          success: false,
          message: "Invalid type. Allowed: SINGLE or GROUP",
        });

  // handle uploaded single attachment
      let attachment = null;
      if (req.file) attachment = "/uploads/exams/" + req.file.filename;

      // validate submission_limit if provided
      let sl = 1;
      if (submission_limit !== undefined) {
        const n = Number(submission_limit);
        if (!Number.isInteger(n) || n < 1)
          return res.status(400).json({
            success: false,
            message: "submission_limit must be an integer >= 1",
          });
        sl = n;
      }

      // validate status if provided
      let st = "draft";
      if (status !== undefined) {
        const allowedStatus = ["draft", "published", "archived"];
        if (!allowedStatus.includes(status))
          return res.status(400).json({
            success: false,
            message: "Invalid status. Allowed: draft, published, archived",
          });
        st = status;
      }

      const exam = await Exam.create({
        course_id,
        title,
        description: description || null,
        start_date: start_date || null,
        end_date: end_date || null,
        type: type || "SINGLE",
        attachment: attachment || null,
        submission_limit: sl,
        status: st,
      });

      res
        .status(201)
        .json({ success: true, message: "Exam created!", data: exam });
    } catch (error) {
      console.error("Create exam error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  getExamById: async (req, res) => {
    try {
      const id = req.params.id;
      const exam = await Exam.findByPk(id, {
        include: [{ model: Course, as: "course" }],
      });
      if (!exam)
        return res
          .status(404)
          .json({ success: false, message: "Exam not found." });
      res.json({ success: true, data: exam });
    } catch (error) {
      console.error("Get exam error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get all exams for a given course id. Access allowed to admin,
  // teachers who created or teach the course,
  // or students enrolled in any class that is linked to the course.
  getExamsByCourseId: async (req, res) => {
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
      // Admin can view
      if (user && user.role === "admin") {
        // allowed
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
            where: { id: classIds, teacher_id: user.userId },
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
          where: { class_id: classIds, student_id: user.userId },
        });
        if (!member)
          return res.status(403).json({ success: false, message: "Forbidden" });
      } else {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const exams = await Exam.findAll({
        where: { course_id: courseId },
        include: [{ model: Course, as: "course" }],
        order: [["start_date", "DESC"]],
      });
      // compute submissions_count (distinct students) and class size
      let classSize = null;
      try {
        const ClassCourse = require("../models/ClassCourse");
        const Class = require("../models/Class");
        const cc = await ClassCourse.findOne({
          where: { course_id: courseId },
          attributes: ["class_id"],
        });
        if (cc) {
          const cls = await Class.findByPk(cc.class_id);
          if (cls) classSize = cls.current_students;
        }
      } catch (err) {
        console.warn(
          "Could not determine class size for course exams:",
          err.message || err
        );
      }

      const Submission = require("../models/Submission");
      const data = [];
      for (const ex of exams) {
        const obj = ex.toJSON();
        let submittedCount = 0;
        try {
          submittedCount = await Submission.count({
            where: { exam_id: obj.id },
            distinct: true,
            col: "student_id",
          });
        } catch (err) {
          console.warn(
            "Could not count submissions for exam",
            obj.id,
            err.message || err
          );
        }
        obj.submissions_count = `${submittedCount}${
          classSize !== null ? "/" + classSize : ""
        }`;
        data.push(obj);
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Get exams by course id error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Update an exam (full update). Allowed: ADMIN or creator or homeroom teacher
  updateExam: async (req, res) => {
    try {
      if (!req.user)
        return res
          .status(403)
          .json({ success: false, message: "Authentication required." });
      const { id } = req.params;
      const exam = await Exam.findByPk(id);
      if (!exam)
        return res
          .status(404)
          .json({ success: false, message: "Exam not found." });

      // check permissions
      const classCourse = await ClassCourse.findOne({
        where: { course_id: exam.course_id },
      });
      let classObj = null;
      if (classCourse) classObj = await Class.findByPk(classCourse.class_id);

      if (req.user.role === "ADMIN") {
        // allowed
      } else if (req.user.role === "TEACHER") {
        const isCreator = exam.created_by === req.user.userId;
        const isClassTeacher =
          classObj && classObj.teacher_id === req.user.userId;
        if (!isCreator && !isClassTeacher)
          return res.status(403).json({
            success: false,
            message: "You do not have permission to update this exam.",
          });
      } else {
        return res.status(403).json({
          success: false,
          message: "Only teachers or admins can update exams.",
        });
      }

      // handle uploaded file
      if (req.file) exam.attachment = "/uploads/exams/" + req.file.filename;

      // If updating times, validate both exist and ordering
      if (
        req.body.start_date !== undefined ||
        req.body.end_date !== undefined
      ) {
        const newStart =
          req.body.start_date !== undefined
            ? new Date(req.body.start_date)
            : new Date(exam.start_date || exam.get("start_date"));
        const newEnd =
          req.body.end_date !== undefined
            ? new Date(req.body.end_date)
            : new Date(exam.end_date || exam.get("end_date"));
        if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime()))
          return res.status(400).json({
            success: false,
            message: "Invalid start_date or end_date.",
          });
        if (newStart >= newEnd)
          return res.status(400).json({
            success: false,
            message: "start_date must be before end_date.",
          });
        exam.start_date = newStart;
        exam.end_date = newEnd;
      }
      const fields = ["title", "description"];
      fields.forEach((f) => {
        if (req.body[f] !== undefined) exam[f] = req.body[f];
      });

      // allow updating type
      if (req.body.type !== undefined) {
        const allowedT = ["SINGLE", "GROUP"];
        if (!allowedT.includes(req.body.type))
          return res.status(400).json({
            success: false,
            message: "Invalid type. Allowed: SINGLE or GROUP",
          });
        exam.type = req.body.type;
      }

      // allow updating status
      if (req.body.status !== undefined) {
        const allowedStatus = ["draft", "published", "archived"];
        if (!allowedStatus.includes(req.body.status))
          return res.status(400).json({
            success: false,
            message: "Invalid status. Allowed: draft, published, archived",
          });
        exam.status = req.body.status;
      }

      // allow updating submission_limit
      if (req.body.submission_limit !== undefined) {
        const n = Number(req.body.submission_limit);
        if (!Number.isInteger(n) || n < 1)
          return res.status(400).json({
            success: false,
            message: "submission_limit must be an integer >= 1",
          });
        exam.submission_limit = n;
      }

      // ensure invariant
      if (!exam.start_date || !exam.end_date)
        return res.status(400).json({
          success: false,
          message: "start_date and end_date must be set.",
        });

      await exam.save();
      res.json({ success: true, data: exam });
    } catch (error) {
      console.error("Update exam error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Patch exam (partial update) - similar to update but allows partial fields
  patchExam: async (req, res) => {
    try {
      if (!req.user)
        return res
          .status(403)
          .json({ success: false, message: "Authentication required." });
      const { id } = req.params;
      const exam = await Exam.findByPk(id);
      if (!exam)
        return res
          .status(404)
          .json({ success: false, message: "Exam not found." });

      // permissions same as update
      const classCourse = await ClassCourse.findOne({
        where: { course_id: exam.course_id },
      });
      let classObj = null;
      if (classCourse) classObj = await Class.findByPk(classCourse.class_id);

      if (req.user.role === "ADMIN") {
        // allowed
      } else if (req.user.role === "TEACHER") {
        const isCreator = exam.created_by === req.user.userId;
        const isClassTeacher =
          classObj && classObj.teacher_id === req.user.userId;
        if (!isCreator && !isClassTeacher)
          return res.status(403).json({
            success: false,
            message: "You do not have permission to patch this exam.",
          });
      } else {
        return res.status(403).json({
          success: false,
          message: "Only teachers or admins can patch exams.",
        });
      }

      // allow status or times or title/description updates
      // For patch: if either time field is provided, require both (either in body or existing)
      if (
        req.body.start_date !== undefined ||
        req.body.end_date !== undefined
      ) {
        const newStart =
          req.body.start_date !== undefined
            ? new Date(req.body.start_date)
            : new Date(exam.start_date || exam.get("start_date"));
        const newEnd =
          req.body.end_date !== undefined
            ? new Date(req.body.end_date)
            : new Date(exam.end_date || exam.get("end_date"));
        if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime()))
          return res.status(400).json({
            success: false,
            message: "Invalid start_date or end_date.",
          });
        if (newStart >= newEnd)
          return res.status(400).json({
            success: false,
            message: "start_date must be before end_date.",
          });
        exam.start_date = newStart;
        exam.end_date = newEnd;
      }
      const updatable = ["title", "description"];
      updatable.forEach((f) => {
        if (req.body[f] !== undefined) exam[f] = req.body[f];
      });
      if (req.file) exam.attachment = "/uploads/exams/" + req.file.filename;

      // allow updating type on patch
      if (req.body.type !== undefined) {
        const allowedT = ["SINGLE", "GROUP"];
        if (!allowedT.includes(req.body.type))
          return res.status(400).json({
            success: false,
            message: "Invalid type. Allowed: SINGLE or GROUP",
          });
        exam.type = req.body.type;
      }

      // patch: allow updating submission_limit
      if (req.body.submission_limit !== undefined) {
        const n = Number(req.body.submission_limit);
        if (!Number.isInteger(n) || n < 1)
          return res.status(400).json({
            success: false,
            message: "submission_limit must be an integer >= 1",
          });
        exam.submission_limit = n;
      }

      // patch: allow updating status
      if (req.body.status !== undefined) {
        const allowedStatus = ["draft", "published", "archived"];
        if (!allowedStatus.includes(req.body.status))
          return res.status(400).json({
            success: false,
            message: "Invalid status. Allowed: draft, published, archived",
          });
        exam.status = req.body.status;
      }

      if (!exam.start_date || !exam.end_date)
        return res.status(400).json({
          success: false,
          message: "start_date and end_date must be set.",
        });

      await exam.save();
      res.json({ success: true, data: exam });
    } catch (error) {
      console.error("Patch exam error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Patch exam status only
  patchExamStatus: async (req, res) => {
    try {
      if (!req.user)
        return res
          .status(403)
          .json({ success: false, message: "Authentication required." });
      const { id } = req.params;
      const { status } = req.body;
      if (!status)
        return res
          .status(400)
          .json({ success: false, message: "Missing status in request body." });

      const allowedStatus = ["draft", "published", "archived"];
      if (!allowedStatus.includes(status))
        return res.status(400).json({
          success: false,
          message: "Invalid status. Allowed: draft, published, archived",
        });

      const exam = await Exam.findByPk(id);
      if (!exam)
        return res
          .status(404)
          .json({ success: false, message: "Exam not found." });

      // Permission: ADMIN or creator or homeroom teacher of the class linked to course
      const classCourse = await ClassCourse.findOne({
        where: { course_id: exam.course_id },
      });
      let classObj = null;
      if (classCourse) classObj = await Class.findByPk(classCourse.class_id);

      if (req.user.role === "ADMIN") {
        // allowed
      } else if (req.user.role === "TEACHER") {
        const isCreator = exam.created_by === req.user.userId;
        const isClassTeacher = classObj && classObj.teacher_id === req.user.userId;
        if (!isCreator && !isClassTeacher)
          return res.status(403).json({ success: false, message: "Forbidden" });
      } else {
        return res
          .status(403)
          .json({
            success: false,
            message: "Only teachers or admins can change exam status.",
          });
      }

      exam.status = status;
      await exam.save();
      res.json({ success: true, data: exam });
    } catch (error) {
      console.error("Patch exam status error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Delete exam (admin only)
  deleteExam: async (req, res) => {
    try {
      if (!req.user)
        return res
          .status(403)
          .json({ success: false, message: "Authentication required." });
      const { id } = req.params;
      const exam = await Exam.findByPk(id);
      if (!exam)
        return res
          .status(404)
          .json({ success: false, message: "Exam not found." });

      // Find class for the course to check homeroom teacher
      const classCourse = await ClassCourse.findOne({
        where: { course_id: exam.course_id },
      });
      let classObj = null;
      if (classCourse) classObj = await Class.findByPk(classCourse.class_id);

      if (req.user.role === "ADMIN") {
        // allowed
      } else if (req.user.role === "TEACHER") {
        const isCreator = exam.created_by === req.user.userId;
        const isClassTeacher =
          classObj && classObj.teacher_id === req.user.userId;
        if (!isCreator && !isClassTeacher)
          return res.status(403).json({
            success: false,
            message: "You do not have permission to delete this exam.",
          });
      } else {
        return res.status(403).json({
          success: false,
          message: "Only teachers or admins can delete exams.",
        });
      }

      await exam.destroy();
      res.json({ success: true, message: "Exam deleted." });
    } catch (error) {
      console.error("Delete exam error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = ExamController;

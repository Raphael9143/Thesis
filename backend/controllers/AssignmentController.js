const Assignment = require("../models/Assignment");
const AssignmentCourse = require("../models/AssignmentCourse");
const Course = require("../models/Course");
const ClassCourse = require("../models/ClassCourse");
const Class = require("../models/Class");
const User = require("../models/User");
const ClassStudent = require("../models/ClassStudent");
const fs = require("fs");
const UseModel = require("../models/UseModel");

const AssignmentController = {
  // Create assignment (teachers only). Single file under field 'attachment' is optional.
  createAssignment: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "TEACHER") {
        return res.status(403).json({
          success: false,
          message: "Only teachers can create assignments.",
        });
      }

      const {
        course_id,
        title,
        description,
        start_date,
        end_date,
        status,
        type,
        submission_limit,
      } = req.body;
      if (!course_id || !title) {
        return res.status(400).json({
          success: false,
          message: "course_id and title are required.",
        });
      }

      // start_date and end_date are required
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: "start_date and end_date are required.",
        });
      }

      // validate dates
      const sDate = new Date(start_date);
      const eDate = new Date(end_date);
      if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid start_date or end_date." });
      }
      if (sDate >= eDate) {
        return res.status(400).json({
          success: false,
          message: "start_date must be before end_date.",
        });
      }

      const course = await Course.findByPk(course_id);
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });

      // File upload is optional
      let attachment = null;
      if (req.file) attachment = "/uploads/assignments/" + req.file.filename;

      // Optional teacher-provided answer (.use file).
      // Middleware may provide the uploaded files in `req.files` (conditionalUpload.any)
      let answerAttachment = null;
      let answerUseModelId = null;
      const providedFiles = req.files || (req.file ? [req.file] : []);
      if (providedFiles && providedFiles.length) {
        let answerFile = providedFiles.find((f) => f.fieldname === "answer");
        if (!answerFile)
          answerFile = providedFiles.find((f) =>
            (f.originalname || "").toLowerCase().endsWith(".use")
          );
        if (answerFile) {
          answerAttachment = "/uploads/assignments/" + answerFile.filename;
          try {
            const raw = fs.readFileSync(answerFile.path, "utf8");
            const um = await UseModel.create({
              name: (title || "") + " answer",
              file_path: answerAttachment,
              owner_id: req.user.userId,
              raw_text: raw,
              created_at: new Date(),
            });
            answerUseModelId = um.id;
          } catch (e) {
            console.warn("Could not persist answer use model:", e.message || e);
          }
        }
      }

      const allowedStatuses = ["draft", "published", "archived"];
      if (status && !allowedStatuses.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status" });
      }

      const allowedTypes = ["SINGLE", "GROUP"];
      if (type && !allowedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid type. Allowed: SINGLE or GROUP",
        });
      }

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

      const assignment = await Assignment.create({
        course_id,
        title,
        description: description || null,
        created_by: req.user.userId,
        attachment: attachment,
        answer_attachment: answerAttachment || null,
        answer_use_model_id: answerUseModelId || null,
        status: status || "draft",
        type: type || "SINGLE",
        start_date: start_date || null,
        end_date: end_date || null,
        submission_limit: sl,
        created_at: new Date(),
      });

      // Create assignment_course mapping for backward compatibility
      await AssignmentCourse.create({
        assignment_id: assignment.id,
        course_id,
      });

      res.status(201).json({
        success: true,
        message: "Assignment created",
        data: assignment,
      });
    } catch (error) {
      console.error("Create assignment error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // List all assignments
  getAllAssignments: async (req, res) => {
    try {
      const assignments = await Assignment.findAll({
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["course_id", "course_name", "course_code"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "full_name", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      const data = assignments.map((a) => a.toJSON());
      // If student, strip answer fields from assignments
      if (req.user && req.user.role === "STUDENT") {
        for (const d of data) {
          delete d.answer_attachment;
          delete d.answer_use_model_id;
          delete d.answerUseModel;
        }
      }
      res.json({ success: true, data });
    } catch (error) {
      console.error("Get all assignments error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get assignments by class id
  getAssignmentsByClass: async (req, res) => {
    try {
      const { classId } = req.params;
      if (!classId) {
        return res
          .status(400)
          .json({ success: false, message: "Missing classId." });
      }
      const classCourses = await ClassCourse.findAll({
        where: { class_id: classId },
      });
      const courseIds = classCourses.map((cc) => cc.course_id);
      if (courseIds.length === 0) return res.json({ success: true, data: [] });

      const assignments = await Assignment.findAll({
        where: { course_id: courseIds },
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["course_id", "course_name", "course_code"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "full_name", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      const data = assignments.map((a) => a.toJSON());
      if (req.user && req.user.role === "STUDENT") {
        for (const d of data) {
          delete d.answer_attachment;
          delete d.answer_use_model_id;
          delete d.answerUseModel;
        }
      }
      res.json({ success: true, data });
    } catch (error) {
      console.error("Get assignments by class error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Update assignment (teacher of class containing course)
  updateAssignment: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "TEACHER")
        return res.status(403).json({
          success: false,
          message: "Only teachers can update assignments.",
        });
      const { id } = req.params;
      const assignment = await Assignment.findByPk(id);
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });

      const classCourse = await ClassCourse.findOne({
        where: { course_id: assignment.course_id },
      });
      let classObj = null;
      if (classCourse) classObj = await Class.findByPk(classCourse.class_id);
      // Permission: admin is allow
      if (req.user.role === "ADMIN") {
        // allowed
      } else if (req.user.role === "TEACHER") {
      const isCreator = assignment.created_by === req.user.userId;
      const isClassTeacher =
        classObj && classObj.teacher_id === req.user.userId;
      if (!isCreator && !isClassTeacher)
          return res.status(403).json({
            success: false,
            message: "You do not have permission to update this assignment.",
          });
      } else {
        return res.status(403).json({
          success: false,
          message: "Only teachers or admins can update assignments.",
        });
      }

      // handle file
      if (req.file)
        assignment.attachment = "/uploads/assignments/" + req.file.filename;

      // If teacher uploaded/updated an answer file, persist it and link to assignment
      const providedFiles = req.files || (req.file ? [req.file] : []);
      if (providedFiles && providedFiles.length) {
        let answerFile = providedFiles.find((f) => f.fieldname === "answer");
        if (!answerFile)
          answerFile = providedFiles.find((f) =>
            (f.originalname || "").toLowerCase().endsWith(".use")
          );
        if (answerFile) {
          const answerAttachment = "/uploads/assignments/" + answerFile.filename;
          try {
            const raw = fs.readFileSync(answerFile.path, "utf8");
            const um = await UseModel.create({
              name: (assignment.title || "") + " answer",
              file_path: answerAttachment,
              owner_id: req.user.userId,
              raw_text: raw,
              created_at: new Date(),
            });
            assignment.answer_attachment = answerAttachment;
            assignment.answer_use_model_id = um.id;
          } catch (e) {
            console.warn("Could not persist answer use model:", e.message || e);
          }
        }
      }

      // Handle updates to start/end dates: if either is provided, ensure both exist and are valid
      if (
        req.body.start_date !== undefined ||
        req.body.end_date !== undefined
      ) {
        const newStart =
          req.body.start_date !== undefined
            ? new Date(req.body.start_date)
            : new Date(assignment.start_date);
        const newEnd =
          req.body.end_date !== undefined
            ? new Date(req.body.end_date)
            : new Date(assignment.end_date);
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
        assignment.start_date = newStart;
        assignment.end_date = newEnd;
      }
      const fields = ["title", "description"];
      fields.forEach((f) => {
        if (req.body[f] !== undefined) assignment[f] = req.body[f];
      });
      // allow updating submission_limit
      if (req.body.submission_limit !== undefined) {
        const n = Number(req.body.submission_limit);
        if (!Number.isInteger(n) || n < 1)
          return res.status(400).json({
            success: false,
            message: "submission_limit must be an integer >= 1",
          });
        assignment.submission_limit = n;
      }
      if (req.body.status !== undefined) {
        const allowed = ["draft", "published", "archived"];
        if (!allowed.includes(req.body.status))
          return res
            .status(400)
            .json({ success: false, message: "Invalid status" });
        assignment.status = req.body.status;
      }

      // allow updating type
      if (req.body.type !== undefined) {
        const allowedT = ["SINGLE", "GROUP"];
        if (!allowedT.includes(req.body.type))
          return res.status(400).json({
            success: false,
            message: "Invalid type. Allowed: SINGLE or GROUP",
          });
        assignment.type = req.body.type;
      }

      // ensure assignment has start_date and end_date (required invariant)
      if (!assignment.start_date || !assignment.end_date)
        return res.status(400).json({
          success: false,
          message: "start_date and end_date must be set.",
        });
      await assignment.save();

      // update assignment_course if present
      if (req.body.due_date !== undefined || req.body.week !== undefined) {
        const ac = await AssignmentCourse.findOne({
          where: { assignment_id: assignment.id },
        });
        if (ac) {
          if (req.body.due_date !== undefined) ac.due_date = req.body.due_date;
          if (req.body.week !== undefined) ac.week = req.body.week;
          await ac.save();
        }
      }

      res.json({ success: true, data: assignment });
    } catch (error) {
      console.error("Update assignment error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Patch or replace the teacher answer for an assignment (teacher or admin)
  patchAnswer: async (req, res) => {
    try {
      if (!req.user)
        return res
          .status(403)
          .json({ success: false, message: "Authentication required." });
      const { id } = req.params;
      const assignment = await Assignment.findByPk(id);
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });

      // permission: ADMIN or creator or homeroom teacher
      const classCourse = await ClassCourse.findOne({
        where: { course_id: assignment.course_id },
      });
      let classObj = null;
      if (classCourse) classObj = await Class.findByPk(classCourse.class_id);

      if (req.user.role === "ADMIN") {
        // allowed
      } else if (req.user.role === "TEACHER") {
        const isCreator = assignment.created_by === req.user.userId;
        const isClassTeacher = classObj && classObj.teacher_id === req.user.userId;
        if (!isCreator && !isClassTeacher)
          return res.status(403).json({ success: false, message: "Forbidden" });
      } else {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      // If body has delete/remove flag, remove answer linkage
      const remove = req.body && (
        req.body.remove === "1" || req.body.delete === "1" || req.body.remove === true
      );
      if (remove) {
        assignment.answer_attachment = null;
        assignment.answer_use_model_id = null;
        await assignment.save();
        return res.json({ success: true, message: "Answer removed", data: assignment });
      }

      // Otherwise expect an uploaded file in field 'answer'
      const providedFiles = req.files || (req.file ? [req.file] : []);
      if (!providedFiles || providedFiles.length === 0)
        return res.status(400).json({ success: false, message: "No answer file provided." });
      let answerFile = providedFiles.find((f) => f.fieldname === "answer");
      if (!answerFile)
        answerFile = providedFiles.find((f) =>
          (f.originalname || "").toLowerCase().endsWith(".use")
        );
      if (!answerFile)
        return res.status(400).json({ success: false, message: "No .use answer file found." });

      const answerAttachment = "/uploads/assignments/" + answerFile.filename;
      try {
        const raw = fs.readFileSync(answerFile.path, "utf8");
        if (assignment.answer_use_model_id) {
          // update existing UseModel
          const existing = await UseModel.findByPk(assignment.answer_use_model_id);
          if (existing) {
            existing.raw_text = raw;
            existing.file_path = answerAttachment;
            existing.updated_at = new Date();
            await existing.save();
          } else {
            const um = await UseModel.create({
              name: (assignment.title || "") + " answer",
              file_path: answerAttachment,
              owner_id: req.user.userId,
              raw_text: raw,
              created_at: new Date(),
            });
            assignment.answer_use_model_id = um.id;
          }
        } else {
          const um = await UseModel.create({
            name: (assignment.title || "") + " answer",
            file_path: answerAttachment,
            owner_id: req.user.userId,
            raw_text: raw,
            created_at: new Date(),
          });
          assignment.answer_use_model_id = um.id;
        }
        assignment.answer_attachment = answerAttachment;
        await assignment.save();
        return res.json({ success: true, message: "Answer updated", data: assignment });
      } catch (e) {
        console.error("Persisting answer failed:", e);
        return res.status(500).json({ success: false, message: "Could not persist answer" });
      }
    } catch (error) {
      console.error("Patch answer error:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },

  // Remove assignment-course mapping (teacher only)
  removeAssignmentFromCourse: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "TEACHER")
        return res.status(403).json({
          success: false,
          message: "Only teachers can remove assignments from a course.",
        });
      const { assignmentId } = req.params;
      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });
      const ac = await AssignmentCourse.findOne({
        where: { assignment_id: assignment.id },
      });
      if (!ac)
        return res.status(404).json({
          success: false,
          message: "Assignment-course mapping not found.",
        });

      const classCourse = await ClassCourse.findOne({
        where: { course_id: ac.course_id },
      });
      if (!classCourse)
        return res
          .status(404)
          .json({ success: false, message: "No class found for this course." });
      const classObj = await Class.findByPk(classCourse.class_id);
      if (!classObj || classObj.teacher_id !== req.user.userId)
        return res.status(403).json({
          success: false,
          message: "You do not have permission to remove this assignment.",
        });

      await ac.destroy();
      res.json({
        success: true,
        message: "Assignment removed from course.",
        data: assignment,
      });
    } catch (error) {
      console.error("Remove assignment from course error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Add assignment to course
  addAssignmentToClass: async (req, res) => {
    try {
      const { assignment_id, course_id, due_date, week } = req.body;
      const assignment = await Assignment.findByPk(assignment_id);
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });
      const course = await Course.findByPk(course_id);
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found." });
      const exist = await AssignmentCourse.findOne({
        where: { assignment_id, course_id },
      });
      if (exist)
        return res.status(400).json({
          success: false,
          message: "Assignment already in this course.",
        });
      await AssignmentCourse.create({
        assignment_id,
        course_id,
        due_date,
        week,
      });
      res.json({ success: true, data: assignment });
    } catch (error) {
      console.error("Add assignment to class error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Delete assignment (admin only)
  deleteAssignment: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "ADMIN")
        return res.status(403).json({
          success: false,
          message: "Only admin can delete assignments.",
        });
      const { id } = req.params;
      const assignment = await Assignment.findByPk(id);
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });
      await AssignmentCourse.destroy({ where: { assignment_id: id } });
      await assignment.destroy();
      res.json({ success: true, message: "Assignment deleted from database." });
    } catch (error) {
      console.error("Delete assignment error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get assignment by id (admin, related teacher, or enrolled student)
  getAssignmentById: async (req, res) => {
    try {
      if (!req.user)
        return res
          .status(403)
          .json({ success: false, message: "Authentication required." });
      const { id } = req.params;
      const assignment = await Assignment.findByPk(id, {
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["course_id", "course_name", "course_code"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "full_name", "email"],
          },
        ],
      });
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });

      const user = req.user;
      if (user.role === "ADMIN") {
        // allowed
      } else if (user.role === "TEACHER") {
        const classCourse = await ClassCourse.findOne({
          where: { course_id: assignment.course_id },
        });
        let classObj = null;
        if (classCourse) classObj = await Class.findByPk(classCourse.class_id);
        const isCreator = assignment.created_by === user.userId;
        const isClassTeacher = classObj && classObj.teacher_id === user.userId;
        if (!isCreator && !isClassTeacher)
          return res
            .status(403)
            .json({ success: false, message: "Forbidden" });
      } else if (user.role === "STUDENT") {
        const links = await ClassCourse.findAll({
          where: { course_id: assignment.course_id },
        });
        const classIds = links.map((l) => l.class_id);
        if (classIds.length === 0)
          return res
            .status(403)
            .json({ success: false, message: "Forbidden" });
        const member = await ClassStudent.findOne({
          where: { class_id: classIds, student_id: user.userId },
        });
        if (!member)
          return res
            .status(403)
            .json({ success: false, message: "Forbidden" });
      } else {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const obj = assignment.toJSON();
      // Hide answer fields from students
      if (req.user && req.user.role === "STUDENT") {
        delete obj.answer_attachment;
        delete obj.answer_use_model_id;
        delete obj.answerUseModel;
      }
      res.json({ success: true, data: obj });
    } catch (error) {
      console.error("Get assignment by id error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get assignments by course id (admin, related teacher, or student enrolled)
  getAssignmentsByCourseId: async (req, res) => {
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
      if (user && user.role === "ADMIN") {
        // allowed
      } else if (user && user.role === "TEACHER") {
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

      // fetch assignments directly by course_id
      const assignments = await Assignment.findAll({
        where: { course_id: courseId },
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["course_id", "course_name", "course_code"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "full_name", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Determine class size for this course (use first linked class)
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
          "Could not determine class size for course assignments:",
          err.message || err
        );
      }

      const Submission = require("../models/Submission");
      const data = [];
      for (const a of assignments) {
        const obj = a.toJSON();
        // count distinct students who submitted for this assignment
        let submittedCount = 0;
        try {
          submittedCount = await Submission.count({
            where: { assignment_id: obj.id },
            distinct: true,
            col: "student_id",
          });
        } catch (err) {
          console.warn(
            "Could not count submissions for assignment",
            obj.id,
            err.message || err
          );
        }
        obj.submissions_count = `${submittedCount}${
          classSize !== null ? "/" + classSize : ""
        }`;
        data.push(obj);
      }

      if (req.user && req.user.role === "STUDENT") {
        for (const d of data) {
          delete d.answer_attachment;
          delete d.answer_use_model_id;
          delete d.answerUseModel;
        }
      }
      res.json({ success: true, data });
    } catch (error) {
      console.error("Get assignments by course error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Patch assignment status by id
  updateAssignmentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status)
        return res
          .status(400)
          .json({ success: false, message: "Missing status in request body." });
      const allowed = ["draft", "published", "archived"];
      if (!allowed.includes(status))
        return res
          .status(400)
          .json({ success: false, message: "Invalid status value." });

      const assignment = await Assignment.findByPk(id);
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });

      // Permission: admin OR creator OR homeroom teacher of class containing the course
      const classCourse = await ClassCourse.findOne({
        where: { course_id: assignment.course_id },
      });
      let classObj = null;
      if (classCourse) classObj = await Class.findByPk(classCourse.class_id);

      if (!req.user)
        return res
          .status(403)
          .json({ success: false, message: "Authentication required." });
      if (req.user.role === "ADMIN") {
        // allowed
      } else if (req.user.role === "TEACHER") {
        const isCreator = assignment.created_by === req.user.userId;
        const isClassTeacher =
          classObj && classObj.teacher_id === req.user.userId;
        if (!isCreator && !isClassTeacher)
          return res.status(403).json({
            success: false,
            message:
              "You do not have permission to change status of this assignment.",
          });
      } else {
        return res.status(403).json({
          success: false,
          message: "Only teachers or admins can change assignment status.",
        });
      }

      assignment.status = status;
      assignment.updated_at = new Date();
      await assignment.save();

      res.json({ success: true, data: assignment });
    } catch (error) {
      console.error("Update assignment status error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = AssignmentController;

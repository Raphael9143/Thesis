const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const AssignmentCourse = require("../models/AssignmentCourse");
const ClassStudent = require("../models/ClassStudent");

const SubmissionController = {
  // Student submits an assignment or an exam
  submitAssignment: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can submit assignments.",
        });
      }

  const { assignment_id, exam_id } = req.body;

      // Require either assignment_id or exam_id (but not both)
      if (!assignment_id && !exam_id) {
        return res.status(400).json({
          success: false,
          message: "assignment_id or exam_id is required.",
        });
      }
      if (assignment_id && exam_id) {
        return res.status(400).json({
          success: false,
          message: "Provide only one of assignment_id or exam_id.",
        });
      }

      // Determine student's enrolled classes for eligibility checks (no class_id in payload)
      const { Op } = require("sequelize");
      const enrolments = await ClassStudent.findAll({
        where: { student_id: req.user.userId },
        attributes: ["classId"],
      });
      const enrolledClassIds = enrolments.map((e) => e.classId ?? e.class_id);

      let maxAttempts = 1;
      let targetType = null; // 'assignment' | 'exam'
      let targetId = null;

      if (assignment_id) {
        const assignment = await Assignment.findByPk(assignment_id);
        if (!assignment)
          return res
            .status(404)
            .json({ success: false, message: "Assignment not found." });

        // verify assignment belongs to its course via AssignmentCourse
        const assignmentCourse = await AssignmentCourse.findOne({
          where: {
            assignment_id: assignment_id,
            course_id: assignment.course_id,
          },
        });
        if (!assignmentCourse)
          return res.status(403).json({
            success: false,
            message: "This assignment is not linked to a course.",
          });

        // Ensure the student is enrolled in at least one class linked to this course
        const ClassCourseModel = require("../models/ClassCourse");
        if (!enrolledClassIds || enrolledClassIds.length === 0) {
          return res.status(403).json({
            success: false,
            message: "You are not enrolled in any class.",
          });
        }
        const courseClass = await ClassCourseModel.findOne({
          where: {
            course_id: assignment.course_id,
            class_id: { [Op.in]: enrolledClassIds },
          },
        });
        if (!courseClass) {
          return res.status(403).json({
            success: false,
            message:
              "You are not enrolled in a class associated with this course.",
          });
        }
        maxAttempts = Number(assignment.submission_limit || 1) || 1;
        targetType = "assignment";
        targetId = assignment_id;
      } else {
        // exam_id path
        const exam = await require("../models/Exam").findByPk(exam_id);
        if (!exam)
          return res
            .status(404)
            .json({ success: false, message: "Exam not found." });

        // Ensure the student is enrolled in at least one class linked to this course
        const ClassCourseModel = require("../models/ClassCourse");
        if (!enrolledClassIds || enrolledClassIds.length === 0) {
          return res.status(403).json({
            success: false,
            message: "You are not enrolled in any class.",
          });
        }
        const courseClass = await ClassCourseModel.findOne({
          where: {
            course_id: exam.course_id,
            class_id: { [Op.in]: enrolledClassIds },
          },
        });
        if (!courseClass) {
          return res.status(403).json({
            success: false,
            message:
              "You are not enrolled in a class associated with this course.",
          });
        }
        maxAttempts = Number(exam.submission_limit || 1) || 1;
        targetType = "exam";
        targetId = exam_id;
      }

      // Attachment (single file) is required and must be a .use file
      const uploadedFile = req.file || (req.files && req.files[0]);
      if (!uploadedFile)
        return res
          .status(400)
          .json({ success: false, message: "Attachment file is required." });
      const filename = uploadedFile.filename || "";
      if (!filename.toLowerCase().endsWith(".use"))
        return res
          .status(400)
          .json({ success: false, message: "Attachment must be a .use file." });
      const attachment = "/uploads/submissions/" + filename;

      // Determine attempt number
      const whereCount = { student_id: req.user.userId };
      if (targetType === "assignment") whereCount.assignment_id = targetId;
      if (targetType === "exam") whereCount.exam_id = targetId;
      const existingAttempts = await Submission.count({ where: whereCount });

      if (existingAttempts >= maxAttempts) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              `Maximum attempts reached (${maxAttempts}). ` +
              `No more submissions allowed for this ${targetType}.`,
          });
      }

      const attempt_number = existingAttempts + 1;

      // Create submission record
      const submission = await Submission.create({
        assignment_id: assignment_id || null,
        exam_id: exam_id || null,
        student_id: req.user.userId,
        submission_time: new Date(),
        attempt_number,
        attachment,
        created_at: new Date(),
      });

      return res.status(201).json({ success: true, data: submission });
    } catch (error) {
      console.error("Submit assignment error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Teacher grades a submission
  gradeSubmission: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "TEACHER") {
        return res.status(403).json({
          success: false,
          message: "Only teachers can grade submissions.",
        });
      }

      const submissionId = parseInt(req.params.id, 10);
      if (Number.isNaN(submissionId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid submission id" });

      const submission = await Submission.findByPk(submissionId);
      if (!submission)
        return res
          .status(404)
          .json({ success: false, message: "Submission not found" });

      const { score, feedback } = req.body;
      if (score === undefined)
        return res
          .status(400)
          .json({ success: false, message: "Score is required" });
      const numericScore = Number(score);
      if (Number.isNaN(numericScore))
        return res
          .status(400)
          .json({ success: false, message: "Score must be a number" });

      submission.score = numericScore;
      if (feedback !== undefined) submission.feedback = feedback;
      submission.updated_at = new Date();
      await submission.save();

      return res.json({ success: true, data: submission });
    } catch (error) {
      console.error("Grade submission error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get submission by id (ADMIN, TEACHER or the student who submitted)
  getSubmissionById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id))
        return res
          .status(400)
          .json({ success: false, message: "Invalid submission id" });

      const Student = require("../models/Student");
      const User = require("../models/User");
      const submission = await Submission.findByPk(id, {
        include: [
          {
            model: Student,
            as: "student",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "full_name", "email"],
              },
            ],
          },
        ],
      });

      if (!submission)
        return res
          .status(404)
          .json({ success: false, message: "Submission not found" });

      const role = req.user && req.user.role;
      const userId = req.user && req.user.userId;
      if (
        !(
          role === "ADMIN" ||
          role === "TEACHER" ||
          submission.student_id === userId
        )
      ) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const data = {
        id: submission.id,
        assignment_id: submission.assignment_id || null,
        exam_id: submission.exam_id || null,
        student_id: submission.student_id,
        student_name:
          submission.student && submission.student.user
            ? submission.student.user.full_name
            : null,
        submission_time: submission.submission_time,
        attempt_number: submission.attempt_number,
        attachment: submission.attachment,
        score: submission.score,
        feedback: submission.feedback,
        created_at: submission.created_at,
        updated_at: submission.updated_at,
      };

      return res.json({ success: true, data });
    } catch (error) {
      console.error("Get submission error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get all submissions for an assignment (ADMIN or teacher of the course)
  getSubmissionsByAssignment: async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id, 10);
      if (Number.isNaN(assignmentId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid assignment id" });

      const Assignment = require("../models/Assignment");
      const ClassCourse = require("../models/ClassCourse");
      const Class = require("../models/Class");
      const Student = require("../models/Student");

      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found" });

      const role = req.user && req.user.role;
      const userId = req.user && req.user.userId;
      if (role !== "ADMIN") {
        // verify requester is teacher of at least one class that uses this course
        const classCourses = await ClassCourse.findAll({
          where: { course_id: assignment.course_id },
          attributes: ["class_id"],
        });
        const classIds = classCourses.map((cc) => cc.class_id ?? cc.classId);
        if (classIds.length === 0) return res.json({ success: true, data: [] });
        const teacherClass = await Class.findOne({
          where: { id: classIds, teacher_id: userId },
        });
        if (!teacherClass)
          return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const User = require("../models/User");
      const submissions = await Submission.findAll({
        where: { assignment_id: assignmentId },
        include: [
          {
            model: Student,
            as: "student",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "full_name", "email"],
              },
            ],
          },
        ],
        order: [["created_at", "ASC"]],
      });

      // Determine class size for the course (pick a representative class)
      let classSize = null;
      try {
        const ClassCourse = require("../models/ClassCourse");
        const classCourses = await ClassCourse.findAll({
          where: { course_id: assignment.course_id },
          attributes: ["class_id"],
        });
        const classId =
          classCourses && classCourses.length > 0
            ? (classCourses[0].class_id ?? classCourses[0].classId)
            : null;
        if (classId) {
          const cls = await Class.findByPk(classId);
          if (cls) classSize = cls.current_students;
        }
      } catch (err) {
        console.warn("Could not determine class size:", err.message || err);
      }

      // Enrich submissions with per-student submission counts
      const enriched = [];
      for (const s of submissions) {
        const studentSubmissions = await Submission.count({
          where: { assignment_id: assignmentId, student_id: s.student_id },
        });
        enriched.push({
          ...s.toJSON(),
          submissions_count: `${studentSubmissions}${
            classSize !== null ? "/" + classSize : ""
          }`,
        });
      }

      return res.json({ success: true, data: enriched });
    } catch (error) {
      console.error("Get submissions by assignment error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get all submissions for an exam (ADMIN or teacher of the course)
  getSubmissionsByExam: async (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      if (Number.isNaN(examId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid exam id" });

      const Exam = require("../models/Exam");
      const ClassCourse = require("../models/ClassCourse");
      const Class = require("../models/Class");
      const Student = require("../models/Student");

      const exam = await Exam.findByPk(examId);
      if (!exam)
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });

      const role = req.user && req.user.role;
      const userId = req.user && req.user.userId;
      if (role !== "ADMIN") {
        const classCourses = await ClassCourse.findAll({
          where: { course_id: exam.course_id },
          attributes: ["class_id"],
        });
        const classIds = classCourses.map((cc) => cc.class_id ?? cc.classId);
        if (classIds.length === 0) return res.json({ success: true, data: [] });
        const teacherClass = await Class.findOne({
          where: { id: classIds, teacherId: userId },
        });
        if (!teacherClass)
          return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const User = require("../models/User");
      const submissions = await Submission.findAll({
        where: { exam_id: examId },
        include: [
          {
            model: Student,
            as: "student",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "full_name", "email"],
              },
            ],
          },
        ],
        order: [["created_at", "ASC"]],
      });

      // Determine class size for the course (pick a representative class)
      let classSize = null;
      try {
        const ClassCourse = require("../models/ClassCourse");
        const classCourses = await ClassCourse.findAll({
          where: { course_id: exam.course_id },
          attributes: ["class_id"],
        });
        const classId =
          classCourses && classCourses.length > 0
            ? (classCourses[0].class_id ?? classCourses[0].classId)
            : null;
        if (classId) {
          const cls = await Class.findByPk(classId);
          if (cls) classSize = cls.current_students;
        }
      } catch (err) {
        console.warn("Could not determine class size:", err.message || err);
      }

      const enriched = [];
      for (const s of submissions) {
        const studentSubmissions = await Submission.count({
          where: { exam_id: examId, student_id: s.student_id },
        });
        enriched.push({
          ...s.toJSON(),
          submissions_count: `${studentSubmissions}${
            classSize !== null ? "/" + classSize : ""
          }`,
        });
      }

      return res.json({ success: true, data: enriched });
    } catch (error) {
      console.error("Get submissions by exam error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get remaining attempts for authenticated student by assignment id
  getRemainingAttemptsByAssignment: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can view remaining attempts.",
        });
      }

      const assignmentId = parseInt(req.params.id, 10);
      if (Number.isNaN(assignmentId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid assignment id" });

      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found" });

      // Confirm the student is enrolled in at least one class linked to the assignment's course
      const { Op } = require("sequelize");
      const ClassCourse = require("../models/ClassCourse");
      const enrolments = await ClassStudent.findAll({
        where: { studentId: req.user.userId },
        attributes: ["classId"],
      });
      const enrolledClassIds = enrolments.map((e) => e.classId ?? e.class_id);
      if (!enrolledClassIds || enrolledClassIds.length === 0)
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in any class.",
        });
      const courseClass = await ClassCourse.findOne({
        where: {
          course_id: assignment.course_id,
          class_id: { [Op.in]: enrolledClassIds },
        },
      });
      if (!courseClass)
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in a class for this course.",
        });

      const maxAttempts = Number(assignment.submission_limit || 1) || 1;
      const usedAttempts = await Submission.count({
        where: {
          student_id: req.user.userId,
          assignment_id: assignmentId,
        },
      });
      const remaining = Math.max(0, maxAttempts - usedAttempts);

      return res.json({
        success: true,
        data: {
          assignment_id: assignmentId,
          submission_limit: maxAttempts,
          used_attempts: usedAttempts,
          remaining_attempts: remaining,
        },
      });
    } catch (error) {
      console.error("Get remaining attempts error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get remaining attempts for authenticated student by exam id
  getRemainingAttemptsByExam: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can view remaining attempts.",
        });
      }

      const examId = parseInt(req.params.id, 10);
      if (Number.isNaN(examId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid exam id" });

      const Exam = require("../models/Exam");
      const exam = await Exam.findByPk(examId);
      if (!exam)
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });

      // Confirm the student is enrolled in a class linked to the exam's course
      const { Op } = require("sequelize");
      const ClassCourse = require("../models/ClassCourse");
      const enrolments = await ClassStudent.findAll({
        where: { studentId: req.user.userId },
        attributes: ["classId"],
      });
      const enrolledClassIds = enrolments.map((e) => e.classId ?? e.class_id);
      if (!enrolledClassIds || enrolledClassIds.length === 0)
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in any class.",
        });
      const courseClass = await ClassCourse.findOne({
        where: {
          course_id: exam.course_id,
          class_id: { [Op.in]: enrolledClassIds },
        },
      });
      if (!courseClass)
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in a class for this course.",
        });

      const maxAttempts = Number(exam.submission_limit || 1) || 1;
      const usedAttempts = await Submission.count({
        where: {
          student_id: req.user.userId,
          exam_id: examId,
        },
      });
      const remaining = Math.max(0, maxAttempts - usedAttempts);

      return res.json({
        success: true,
        data: {
          exam_id: examId,
          submission_limit: maxAttempts,
          used_attempts: usedAttempts,
          remaining_attempts: remaining,
        },
      });
    } catch (error) {
      console.error("Get remaining attempts (exam) error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get submission history for a student by assignment id
  getSubmissionHistoryByAssignment: async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id, 10);
      if (Number.isNaN(assignmentId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid assignment id" });

      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found" });

      const role = req.user && req.user.role;
      const userId = req.user && req.user.userId;
      let targetStudentId = null;

      if (role === "STUDENT") {
        targetStudentId = userId;
      } else if (role === "TEACHER" || role === "ADMIN") {
        const sId = parseInt(req.query.student_id, 10);
        if (Number.isNaN(sId))
          return res.status(400).json({
            success: false,
            message: "student_id is required as integer",
          });
        targetStudentId = sId;

        if (role === "TEACHER") {
          const ClassCourse = require("../models/ClassCourse");
          const Class = require("../models/Class");
          const classCourses = await ClassCourse.findAll({
            where: { course_id: assignment.course_id },
            attributes: ["class_id"],
          });
          const classIds = classCourses.map((cc) => cc.class_id ?? cc.classId);
          if (classIds.length === 0)
            return res.json({ success: true, data: [] });
          const teacherClass = await Class.findOne({
            where: { id: classIds, teacherId: userId },
          });
          if (!teacherClass)
            return res
              .status(403)
              .json({ success: false, message: "Forbidden" });
        }
      } else {
        return res
          .status(403)
          .json({ success: false, message: "Forbidden" });
      }

      const submissions = await Submission.findAll({
        where: { assignment_id: assignmentId, student_id: targetStudentId },
        order: [["created_at", "ASC"]],
      });

      return res.json({ success: true, data: submissions });
    } catch (error) {
      console.error("Get submission history error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get submission history for a student by exam id
  getSubmissionHistoryByExam: async (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      if (Number.isNaN(examId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid exam id" });

      const Exam = require("../models/Exam");
      const exam = await Exam.findByPk(examId);
      if (!exam)
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });

      const role = req.user && req.user.role;
      const userId = req.user && req.user.userId;
      let targetStudentId = null;

      if (role === "STUDENT") {
        targetStudentId = userId;
      } else if (role === "TEACHER" || role === "ADMIN") {
        const sId = parseInt(req.query.student_id, 10);
        if (Number.isNaN(sId))
          return res.status(400).json({
            success: false,
            message: "student_id is required as integer",
          });
        targetStudentId = sId;

        if (role === "TEACHER") {
          const ClassCourse = require("../models/ClassCourse");
          const Class = require("../models/Class");
          const classCourses = await ClassCourse.findAll({
            where: { course_id: exam.course_id },
            attributes: ["class_id"],
          });
          const classIds = classCourses.map((cc) => cc.class_id ?? cc.classId);
          if (classIds.length === 0)
            return res.json({ success: true, data: [] });
          const teacherClass = await Class.findOne({
            where: { id: classIds, teacherId: userId },
          });
          if (!teacherClass)
            return res
              .status(403)
              .json({ success: false, message: "Forbidden" });
        }
      } else {
        return res
          .status(403)
          .json({ success: false, message: "Forbidden" });
      }

      const submissions = await Submission.findAll({
        where: { exam_id: examId, student_id: targetStudentId },
        order: [["created_at", "ASC"]],
      });

      return res.json({ success: true, data: submissions });
    } catch (error) {
      console.error("Get submission history (exam) error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get latest score for a student by assignment id (take the last submission)
  getLatestScoreByAssignment: async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id, 10);
      if (Number.isNaN(assignmentId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid assignment id" });

      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment)
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found" });

      const role = req.user && req.user.role;
      const userId = req.user && req.user.userId;
      let targetStudentId = null;

      if (role === "STUDENT") {
        targetStudentId = userId;
      } else if (role === "TEACHER" || role === "ADMIN") {
        const sId = parseInt(req.query.student_id, 10);
        if (Number.isNaN(sId))
          return res.status(400).json({
            success: false,
            message: "student_id is required as integer",
          });
        targetStudentId = sId;

        if (role === "TEACHER") {
          const ClassCourse = require("../models/ClassCourse");
          const Class = require("../models/Class");
          const classCourses = await ClassCourse.findAll({
            where: { course_id: assignment.course_id },
            attributes: ["class_id"],
          });
          const classIds = classCourses.map((cc) => cc.class_id ?? cc.classId);
          if (classIds.length === 0)
            return res.json({ success: true, data: null });
          const teacherClass = await Class.findOne({
            where: { id: classIds, teacherId: userId },
          });
          if (!teacherClass)
            return res
              .status(403)
              .json({ success: false, message: "Forbidden" });
        }
      } else {
        return res
          .status(403)
          .json({ success: false, message: "Forbidden" });
      }

      const latest = await Submission.findOne({
        where: { assignment_id: assignmentId, student_id: targetStudentId },
        order: [
          ["attempt_number", "DESC"],
          ["created_at", "DESC"],
          ["id", "DESC"],
        ],
      });

      if (!latest)
        return res.json({
          success: true,
          data: {
            assignment_id: assignmentId,
            student_id: targetStudentId,
            has_submission: false,
          },
        });

      return res.json({
        success: true,
        data: {
          assignment_id: assignmentId,
          student_id: targetStudentId,
          submission_id: latest.id,
          attempt_number: latest.attempt_number,
          submission_time: latest.submission_time,
          score: latest.score,
          feedback: latest.feedback,
          has_submission: true,
        },
      });
    } catch (error) {
      console.error("Get latest score by assignment error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get latest score for a student by exam id (take the last submission)
  getLatestScoreByExam: async (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      if (Number.isNaN(examId))
        return res
          .status(400)
          .json({ success: false, message: "Invalid exam id" });

      const Exam = require("../models/Exam");
      const exam = await Exam.findByPk(examId);
      if (!exam)
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });

      const role = req.user && req.user.role;
      const userId = req.user && req.user.userId;
      let targetStudentId = null;

      if (role === "STUDENT") {
        targetStudentId = userId;
      } else if (role === "TEACHER" || role === "ADMIN") {
        const sId = parseInt(req.query.student_id, 10);
        if (Number.isNaN(sId))
          return res.status(400).json({
            success: false,
            message: "student_id is required as integer",
          });
        targetStudentId = sId;

        if (role === "TEACHER") {
          const ClassCourse = require("../models/ClassCourse");
          const Class = require("../models/Class");
          const classCourses = await ClassCourse.findAll({
            where: { course_id: exam.course_id },
            attributes: ["class_id"],
          });
          const classIds = classCourses.map((cc) => cc.class_id ?? cc.classId);
          if (classIds.length === 0)
            return res.json({ success: true, data: null });
          const teacherClass = await Class.findOne({
            where: { id: classIds, teacherId: userId },
          });
          if (!teacherClass)
            return res
              .status(403)
              .json({ success: false, message: "Forbidden" });
        }
      } else {
        return res
          .status(403)
          .json({ success: false, message: "Forbidden" });
      }

      const latest = await Submission.findOne({
        where: { exam_id: examId, student_id: targetStudentId },
        order: [
          ["attempt_number", "DESC"],
          ["created_at", "DESC"],
          ["id", "DESC"],
        ],
      });

      if (!latest)
        return res.json({
          success: true,
          data: {
            exam_id: examId,
            student_id: targetStudentId,
            has_submission: false,
          },
        });

      return res.json({
        success: true,
        data: {
          exam_id: examId,
          student_id: targetStudentId,
          submission_id: latest.id,
          attempt_number: latest.attempt_number,
          submission_time: latest.submission_time,
          score: latest.score,
          feedback: latest.feedback,
          has_submission: true,
        },
      });
    } catch (error) {
      console.error("Get latest score by exam error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = SubmissionController;

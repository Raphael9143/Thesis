const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const AssignmentCourse = require("../models/AssignmentCourse");
const Class = require("../models/Class");
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

      const { assignment_id, exam_id, class_id } = req.body;

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

      // Validate class exists
      if (!class_id)
        return res
          .status(400)
          .json({ success: false, message: "class_id is required." });
      const classObj = await Class.findByPk(class_id);
      if (!classObj)
        return res
          .status(404)
          .json({ success: false, message: "Class does not exist." });

      // Check student is member of the class
      const isMember = await ClassStudent.findOne({
        where: { classId: class_id, studentId: req.user.userId },
      });
      if (!isMember)
        return res.status(403).json({
          success: false,
          message: "You are not a member of this class.",
        });

      if (assignment_id) {
        const assignment = await Assignment.findByPk(assignment_id);
        if (!assignment)
          return res
            .status(404)
            .json({ success: false, message: "Assignment not found." });

        // verify assignment belongs to its course/class mapping (AssignmentCourse)
        const assignmentCourse = await AssignmentCourse.findOne({
          where: {
            assignment_id: assignment_id,
            course_id: assignment.course_id,
          },
        });
        if (!assignmentCourse)
          return res.status(403).json({
            success: false,
            message: "This assignment does not belong to this class.",
          });
      } else {
        // exam_id path
        const exam = await require("../models/Exam").findByPk(exam_id);
        if (!exam)
          return res
            .status(404)
            .json({ success: false, message: "Exam not found." });

        // verify course-class mapping via ClassCourse
        const ClassCourseModel = require("../models/ClassCourse");
        const link = await ClassCourseModel.findOne({
          where: { course_id: exam.course_id, class_id: class_id },
        });
        if (!link)
          return res.status(403).json({
            success: false,
            message: "This exam does not belong to this class.",
          });
      }

      // Attachment (single file) is required and must be a .use file
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "Attachment file is required." });
      const filename = req.file.filename || "";
      if (!filename.toLowerCase().endsWith(".use"))
        return res
          .status(400)
          .json({ success: false, message: "Attachment must be a .use file." });
      const attachment = "/uploads/submission/" + filename;

      // Determine attempt number
      const whereCount = { student_id: req.user.userId };
      if (assignment_id) whereCount.assignment_id = assignment_id;
      if (exam_id) whereCount.exam_id = exam_id;
      const attempt_number =
        (await Submission.count({ where: whereCount })) + 1;

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
          where: { id: classIds, teacherId: userId },
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
};

module.exports = SubmissionController;

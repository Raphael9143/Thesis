const StudentController = {
  // Lấy danh sách các lớp đã enrolled của sinh viên hiện tại
  getEnrolledClasses: async (req, res) => {
    try {
      const Student = require("../models/Student");
      const ClassStudent = require("../models/ClassStudent");
      const Class = require("../models/Class");
      const studentId = req.user.userId;
      // Kiểm tra student tồn tại
      const student = await Student.findByPk(studentId);
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found!" });
      }
      // Lấy danh sách class đã enrolled
      const classStudents = await ClassStudent.findAll({
        where: { student_id: studentId },
        include: [{ model: Class }],
      });
      // Sequelize may attach the included model using the model name (e.g. `Class`) or a lowercased
      // property; normalize by checking known property names.
      const classes = classStudents
        .map((cs) => cs.Class || cs.class || null)
        .filter((c) => c !== null);
      res.json({ success: true, data: { classes } });
    } catch (error) {
      console.error("Get enrolled classes error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Lấy thông tin profile sinh viên hiện tại
  getProfile: async (req, res) => {
    try {
      const User = require("../models/User");
      const Student = require("../models/Student");
      const ClassStudent = require("../models/ClassStudent");
      const userId = req.user.userId;
      // Lấy thông tin user và kiểm tra role
      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });
      if (!user || user.role !== "STUDENT") {
        return res
          .status(404)
          .json({ success: false, message: "Student not found!" });
      }

      // Lấy profile sinh viên
      const student = await Student.findByPk(userId);
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student profile not found!" });
      }

      // Lấy danh sách lớp đã/enrolled (chỉ lấy id để gọn nhẹ)
      const classLinks = await ClassStudent.findAll({
        where: { student_id: userId },
        attributes: ["class_id"],
      });
      const enrolled_classes = classLinks.map((link) => link.class_id);

      res.json({
        success: true,
        data: {
          ...user.toJSON(),
          ...student.toJSON(),
          enrolled_classes,
        },
      });
    } catch (error) {
      console.error("Get student profile error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Sửa thông tin profile sinh viên hiện tại
  updateProfile: async (req, res) => {
    try {
      const Student = require("../models/Student");
      const studentId = req.user.userId;
      const { student_code, major, year, description, reference_links } = req.body;
      
      const student = await Student.findByPk(studentId);
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found!" });
      }
      // Cập nhật các trường cho phép
      if (student_code !== undefined) student.student_code = student_code;
      if (major !== undefined) student.major = major;
      if (year !== undefined) student.year = year;
      if (description !== undefined) student.description = description;
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
          student.reference_links = reference_links;
        } else {
          return res.status(400).json({
            success: false,
            message: "reference_links must be an array",
          });
        }
      }
      await student.save();
      res.json({
        success: true,
        message: "Student profile updated!",
        data: student,
      });
    } catch (error) {
      console.error("Update student profile error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
  getAssignmentsWithSubmissions: async (req, res) => {
    try {
      // Determine target student id: param id (admin/teacher or self) or current user
      let targetStudentId =
        req.params && req.params.id ? parseInt(req.params.id, 10) : null;
      const requesterRole = req.user && req.user.role;
      const requesterId = req.user && req.user.userId;
      if (!targetStudentId) targetStudentId = requesterId;
      if (req.params && req.params.id) {
        // Only admin, teacher or the student themself can fetch another student's info
        if (
          !(
            requesterRole === "ADMIN" ||
            requesterRole === "TEACHER" ||
            requesterId === targetStudentId
          )
        ) {
          return res.status(403).json({ success: false, message: "Forbidden" });
        }
      }
      // Lấy danh sách lớp của sinh viên
      const ClassStudent = require("../models/ClassStudent");
      const classLinks = await ClassStudent.findAll({
        where: { student_id: targetStudentId },
        attributes: ["class_id"],
      });
      const classIds = classLinks.map((l) => l.class_id);
      if (classIds.length === 0) return res.json({ success: true, data: [] });

      // Lấy courses của các lớp
      const ClassCourse = require("../models/ClassCourse");
      const classCourses = await ClassCourse.findAll({
        where: { class_id: classIds },
        attributes: ["course_id"],
      });
      let courseIds = [
        ...new Set(classCourses.map((cc) => cc.course_id)),
      ];

      // Optional course filter from query string: ?course=1
      const courseFilter =
        req.query && req.query.course ? parseInt(req.query.course, 10) : null;
      if (courseFilter !== null && Number.isFinite(courseFilter)) {
        // If the student is not related to that course through any of their classes, return empty
        if (!courseIds.includes(courseFilter))
          return res.json({ success: true, data: [] });
        courseIds = [courseFilter];
      }
      if (courseIds.length === 0) return res.json({ success: true, data: [] });

      const AssignmentCourse = require("../models/AssignmentCourse");
      const Assignment = require("../models/Assignment");
      const Exam = require("../models/Exam");
      const Submission = require("../models/Submission");

      // Lấy danh sách assignment (qua assignment_courses)
      const assignmentCourses = await AssignmentCourse.findAll({
        where: { course_id: courseIds },
        include: [
          {
            model: Assignment,
            as: "assignment",
            attributes: ["id", "title", "submission_limit"],
          },
        ],
      });

      // Lấy exams trực tiếp theo course_id
      const exams = await Exam.findAll({
        where: { course_id: courseIds },
        attributes: [
          "id",
          "title",
          "start_date",
          "end_date",
          "course_id",
          "submission_limit",
        ],
      });

      const results = [];

      // Process assignments
      for (const ac of assignmentCourses) {
        const a = ac.assignment;
        if (!a) continue;
        const assignmentId = a.id;
        const submissionsCount = await Submission.count({
          where: { assignment_id: assignmentId, student_id: targetStudentId },
        });
        // fetch latest submission for this student/assignment to get score (if any)
        const latestSub = await Submission.findOne({
          where: { assignment_id: assignmentId, student_id: targetStudentId },
          order: [["created_at", "DESC"]],
        });
        results.push({
          id: assignmentId,
          title: a.title,
          kind: "assignment",
          submissions_count: submissionsCount,
          attempt_limit: a.submission_limit,
          score: latestSub ? latestSub.score : null,
          attachment: latestSub ? latestSub.attachment : null,
          course_id: ac.course_id,
          due_date: ac.due_date,
        });
      }

      // Process exams
      for (const ex of exams) {
        const examId = ex.id;
        const submissionsCount = await Submission.count({
          where: { exam_id: examId, student_id: targetStudentId },
        });
        // fetch latest submission for this student/exam to get score (if any)
        const latestSub = await Submission.findOne({
          where: { exam_id: examId, student_id: targetStudentId },
          order: [["created_at", "DESC"]],
        });
        results.push({
          id: examId,
          title: ex.title,
          kind: "exam",
          submissions_count: submissionsCount,
          attempt_limit: ex.submission_limit,
          score: latestSub ? latestSub.score : null,
          attachment: latestSub ? latestSub.attachment : null,
          course_id: ex.course_id,
          due_date: ex.start_date,
        });
      }

      res.json({ success: true, data: results });
    } catch (error) {
      console.error("Get assignments with submissions error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};

module.exports = StudentController;

const Class = require("../models/Class");
const ClassStudent = require("../models/ClassStudent");
const User = require("../models/User");

const ClassController = {
  // Get all classes (admin only)
  getAllClasses: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admin can view all classes.",
        });
      }
      const classes = await Class.findAll({
        include: [
          {
            model: User,
            as: "teacher",
            attributes: ["id", "full_name", "email"],
          },
          ],
          order: [["created_at", "DESC"]],
      });
      res.json({ success: true, data: classes });
    } catch (error) {
      console.error("Get all classes error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Get student count for a class
  getStudentCountOfClass: async (req, res) => {
    try {
      const class_id = req.params.id;
      // Check class exists
      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }
      
      // Count number of students
      const count = await ClassStudent.count({ where: { class_id } });
      res.json({ success: true, class_id, student_count: count });
    } catch (error) {
      console.error("Get student count of class error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Get students of class (paginated)
  // Query params: page (integer, default 1). Page size fixed to 20.
  getStudentsOfClass: async (req, res) => {
    try {
      const class_id = req.params.id;

      // Check class exists
      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Pagination: page query param, default 1. Fixed page size 20 as requested.
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const pageSize = 20;
      const offset = (page - 1) * pageSize;

      // Retrieve paginated list of students
      const Student = require("../models/Student");
      const { count, rows } = await ClassStudent.findAndCountAll({
        where: { class_id },
        include: [
          {
            model: User,
            as: "student",
            attributes: [
                  "id",
                  "full_name",
                  "email",
                  "role",
                  "created_at",
                  "updated_at",
                ],
          },
          {
            model: Student,
            as: "studentProfile",
            attributes: ["student_code"],
          },
        ],
        limit: pageSize,
        offset,
        order: [["joined_at", "ASC"]],
      });

      const totalPages = Math.max(1, Math.ceil(count / pageSize));

      res.json({
        success: true,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages,
        },
        data: rows.map((cs) => ({
          id: cs.student.id,
          student_name: cs.student.full_name,
          student_code: cs.studentProfile
            ? cs.studentProfile.student_code
            : null,
          email: cs.student.email,
          role: cs.student.role,
          joined_at: cs.joined_at,
          class_student_id: cs.id,
        })),
      });
    } catch (error) {
      console.error("Get students of class error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Delete class (admin only)
  deleteClass: async (req, res) => {
    try {
      const class_id = req.params.id;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Only admin can delete class. Teachers can only set status to cancelled or closed.",
        });
      }

      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      await foundClass.destroy();

      res.json({ success: true, message: "Class deleted." });
    } catch (error) {
      console.error("Delete class error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Remove multiple students from a class
  removeStudentFromClass: async (req, res) => {
    try {
      const class_id = req.params.id;
      const user_id = req.user.userId;
      const userRole = req.user.role;
      const { student_ids } = req.body;

      if (!Array.isArray(student_ids) || student_ids.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "student_ids (array) is required." });
      }

      // Find class
      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Only admin or homeroom teacher can remove students
      if (userRole !== "admin" && foundClass.teacher_id !== user_id) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to remove students from this class.",
        });
      }

      // Remove students from class
      const deleted = await ClassStudent.destroy({
        where: {
          class_id,
          student_id: student_ids,
        },
      });

      if (deleted === 0) {
        return res.status(404).json({
          success: false,
          message: "No students were removed (not found in class).",
        });
      }

      res.json({
        success: true,
        message: "Students removed from class.",
        count: deleted,
      });
    } catch (error) {
      console.error("Remove student from class error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Update class status
  updateClassStatus: async (req, res) => {
    try {
      const class_id = req.params.id;
      const user_id = req.user.userId;
      const userRole = req.user.role;
      const { status } = req.body;

      // Valid status list
      const validStatus = [
        "draft",
        "active",
        "in_progress",
        "closed",
        "archived",
        "cancelled",
      ];
      if (!status || !validStatus.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or missing status." });
      }

      // Find class
      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Only admin or homeroom teacher can update the class
      if (userRole !== "admin" && foundClass.teacher_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this class.",
        });
      }

      foundClass.status = status;
      await foundClass.save();

      res.json({
        success: true,
        message: "Class status updated",
        data: {
          class: {
            id: foundClass.id,
            status: foundClass.status,
            updated_at: foundClass.updated_at,
          },
        },
      });
    } catch (error) {
      console.error("Update class status error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Add students to class
  addStudentToClass: async (req, res) => {
    try {
      const class_id = req.params.id;
      const user_id = req.user.userId;
      const userRole = req.user.role;

      if (!req.body || typeof req.body !== "object") {
        return res
          .status(400)
          .json({ success: false, message: "Missing request body." });
      }
      const { studentEmails } = req.body;
      if (!Array.isArray(studentEmails) || studentEmails.length === 0) {
        return res.status(400).json({
          success: false,
          message: "studentEmails (array) is required.",
        });
      }

      // Find class
      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Only admin or homeroom teacher can add students
      if (userRole !== "admin" && foundClass.teacher_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to add students to this class.",
        });
      }

      // Find all users by email with role STUDENT and student profile
      const Student = require("../models/Student");
      const students = await User.findAll({
        where: { email: studentEmails, role: "STUDENT" },
        include: [{ model: Student, as: "studentProfile", required: true }],
      });
      const foundEmails = students.map((s) => s.email);
      const notFound = studentEmails.filter((e) => !foundEmails.includes(e));
      if (notFound.length > 0) {
        return res.status(400).json({
          success: false,
          message: `The following emails are invalid or not students: ${notFound.join(
            ", "
          )}`,
        });
      }

      // Check whether students already exist in the class
      const existed = await ClassStudent.findAll({
        where: {
          class_id,
          student_id: students.map((s) => s.id),
        },
      });
      const existedIds = existed.map((e) => e.student_id);
      let newStudents = students.filter((s) => !existedIds.includes(s.id));
      if (newStudents.length === 0) {
        return res.status(400).json({
          success: false,
          message: "All these students are already in the class.",
        });
      }

      // Check max_students limit
      if (foundClass.max_students !== null && foundClass.max_students > 0) {
        const currentCount = await ClassStudent.count({ where: { class_id } });
        const availableSlots = foundClass.max_students - currentCount;
        if (availableSlots <= 0) {
          return res
            .status(400)
            .json({ success: false, message: "Class has reached maximum number of students." });
        }
        if (newStudents.length > availableSlots) {
          newStudents = newStudents.slice(0, availableSlots);
        }
      }

      // Insert into class_students table
      const now = new Date();
      const classStudents = newStudents.map((s) => ({
        class_id,
        student_id: s.id,
        role: "student",
        joined_at: now,
      }));
      const created = await ClassStudent.bulkCreate(classStudents);

      // After adding students, update current_students
      const updatedCount = await ClassStudent.count({ where: { class_id } });
      foundClass.current_students = updatedCount;
      await foundClass.save();

      res.status(201).json({
        success: true,
        message: "Students added to class",
        data: {
          added: created.map((cs) => ({
            id: cs.id,
            class_id: cs.class_id,
            student_id: cs.student_id,
            role: cs.role,
            joined_at: cs.joined_at,
          })),
        },
      });
    } catch (error) {
      console.error("Add student to class error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Student join class by class code
  joinClassByCode: async (req, res) => {
    try {
      const { code } = req.body;
      const user = req.user;

      if (!code || typeof code !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "Class code is required." });
      }

      // Only students can join via code
      const role = (user.role || "").toUpperCase();
      if (role !== "STUDENT") {
        return res.status(403).json({
          success: false,
          message: "Only students can join a class by code.",
        });
      }

      // Find class by code
      const foundClass = await Class.findOne({ where: { code } });
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Check class status (only allow joining when active)
      if (foundClass.status && foundClass.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Class is not open for joining.",
        });
      }

      // Check if already a member
      const existing = await ClassStudent.findOne({
        where: { class_id: foundClass.id, student_id: user.userId },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "You are already a member of this class.",
        });
      }

      // Check max students
      if (foundClass.max_students !== null && foundClass.max_students > 0) {
        const currentCount = await ClassStudent.count({ where: { class_id: foundClass.id } });
        if (currentCount >= foundClass.max_students) {
          return res.status(400).json({
            success: false,
            message: "Class has reached maximum number of students.",
          });
        }
      }

      // Create class student entry
      const now = new Date();
      const created = await ClassStudent.create({
        class_id: foundClass.id,
        student_id: user.userId,
        role: "student",
        joined_at: now,
      });

      // Update current_students count
      const updatedCount = await ClassStudent.count({ where: { class_id: foundClass.id } });
      foundClass.current_students = updatedCount;
      await foundClass.save();

      res.json({
        success: true,
        message: "Joined class successfully.",
        data: {
          class_id: foundClass.id,
          class_name: foundClass.name,
          class_code: foundClass.code,
          joined_at: created.joined_at,
        },
      });
    } catch (error) {
      console.error("Join class by code error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
  // Update class information
  updateClass: async (req, res) => {
    try {
      const classId = req.params.id;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Find class
      const foundClass = await Class.findByPk(classId);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Only admin or homeroom teacher can update
      if (userRole !== "admin" && foundClass.teacher_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this class.",
        });
      }

      const { name, code, description, year, status } = req.body;
      // Only update allowed fields
      if (name !== undefined) foundClass.name = name;
      if (code !== undefined) foundClass.code = code;
      if (description !== undefined) foundClass.description = description;
      if (year !== undefined) foundClass.year = year;
      if (status !== undefined) foundClass.status = status;

      await foundClass.save();

      res.json({
        success: true,
        message: "Class updated!",
        data: {
          class: {
            id: foundClass.id,
            name: foundClass.name,
            code: foundClass.code,
            description: foundClass.description,
            teacher_id: foundClass.teacher_id,
            // semester removed from Class schema
            year: foundClass.year,
            status: foundClass.status,
            created_at: foundClass.created_at,
            updated_at: foundClass.updated_at,
          },
        },
      });
    } catch (error) {
      console.error("Update class error:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res
          .status(400)
          .json({ success: false, message: "Class code already exists." });
      }
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Create class (teacher only)
  createClass: async (req, res) => {
    try {
      if (req.user.role !== "TEACHER") {
        return res.status(403).json({
          success: false,
          message: "Only teachers can create classes.",
        });
      }
      const {
        name,
        code,
        description,
        year,
        status,
        studentEmails,
        max_students,
      } = req.body;
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: "Class name and code are required.",
        });
      }
      // Tạo lớp học
      const newClass = await Class.create({
        name,
        code,
        description,
        year,
        status: status || "active",
        teacher_id: req.user.userId,
        max_students,
      });
      // Add students to class if provided
      if (Array.isArray(studentEmails) && studentEmails.length > 0) {
        // Find users with emails in the list, role STUDENT and with student profile
        const Student = require("../models/Student");
        const students = await User.findAll({
          where: { email: studentEmails, role: "STUDENT" },
          include: [{ model: Student, as: "studentProfile", required: true }],
        });
        if (students.length !== studentEmails.length) {
          const foundEmails = students.map((s) => s.email);
          const notFound = studentEmails.filter(
            (e) => !foundEmails.includes(e)
          );
          return res.status(400).json({
            success: false,
            message: `The following emails are invalid or not students: ${notFound.join(
              ", "
            )}`,
          });
        }
        const classStudents = students.map((s) => ({
          class_id: newClass.id,
          student_id: s.id,
        }));
        await ClassStudent.bulkCreate(classStudents);
      }
      res.status(201).json({
        success: true,
        message: "Class created",
        data: {
          class: {
            id: newClass.id,
            name: newClass.name,
            code: newClass.code,
            description: newClass.description,
            teacher_id: newClass.teacher_id,
            year: newClass.year,
            status: newClass.status,
            created_at: newClass.created_at,
            updated_at: newClass.updated_at,
          },
        },
      });
    } catch (error) {
      console.error("Create class error:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res
          .status(400)
          .json({ success: false, message: "Class code already exists." });
      }
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Get class information by id
  getClassById: async (req, res) => {
    try {
      const classId = req.params.id;
      const user = req.user;
      const foundClass = await Class.findByPk(classId, {
        include: [
          {
            model: User,
            as: "teacher",
            attributes: ["id", "full_name", "email"],
          },
        ],
      });
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }
      // Students should not be able to view classes in draft status
      if ((user.role || '').toUpperCase() === 'STUDENT' && (foundClass.status || '').toLowerCase() === 'draft') {
        return res.status(403).json({ success: false, message: "You don't have permission to view this class." });
      }
      // Only admin, homeroom teacher, or a student member of the class can view
      if (
        user.role === "admin" ||
        (user.role === "TEACHER" && foundClass.teacher_id === user.userId)
      ) {
        return res.json({ success: true, data: foundClass });
      }
      if (user.role === "STUDENT") {
        // Check whether the student is a member of the class
        const isMember = await ClassStudent.findOne({
          where: { class_id: classId, student_id: user.userId },
        });
        if (isMember) {
          return res.json({ success: true, data: foundClass });
        }
      }
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this class.",
      });
    } catch (error) {
      console.error("Get class by id error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = ClassController;

const Class = require("../models/Class");
const ClassStudent = require("../models/ClassStudent");
const User = require("../models/User");

const ClassController = {
  // Lấy tất cả các lớp (chỉ admin)
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
  // Lấy số lượng học sinh của lớp
  getStudentCountOfClass: async (req, res) => {
    try {
      const class_id = req.params.id;
      // Kiểm tra lớp tồn tại
      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }
      // Đếm số lượng học sinh
      const count = await ClassStudent.count({ where: { class_id } });
      res.json({ success: true, class_id, student_count: count });
    } catch (error) {
      console.error("Get student count of class error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // Lấy danh sách sinh viên của lớp (phân trang)
  // Query params: page (integer, default 1). Page size fixed to 20.
  getStudentsOfClass: async (req, res) => {
    try {
      const class_id = req.params.id;

      // Kiểm tra lớp tồn tại
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

      // Lấy danh sách sinh viên phân trang
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
  // Xóa lớp học (chỉ admin)
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
  // Xóa nhiều học sinh khỏi lớp học
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

      // Tìm lớp học
      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Chỉ admin hoặc giáo viên chủ nhiệm mới được xóa học sinh
      if (userRole !== "admin" && foundClass.teacher_id !== user_id) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to remove students from this class.",
        });
      }

      // Xóa các học sinh khỏi lớp
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
  // Sửa trạng thái lớp học
  updateClassStatus: async (req, res) => {
    try {
      const class_id = req.params.id;
      const user_id = req.user.userId;
      const userRole = req.user.role;
      const { status } = req.body;

      // Danh sách status hợp lệ
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

      // Tìm lớp học
      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Chỉ admin hoặc giáo viên chủ nhiệm mới được sửa
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
        message: "Class status updated!",
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
  // Thêm học sinh vào lớp học
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

      // Tìm lớp học
      const foundClass = await Class.findByPk(class_id);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Chỉ admin hoặc giáo viên chủ nhiệm mới được thêm học sinh
      if (userRole !== "admin" && foundClass.teacher_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to add students to this class.",
        });
      }

      // Tìm tất cả học sinh theo email, role STUDENT và đã có bản ghi students
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
          message: `Các email sau không hợp lệ hoặc không phải student: ${notFound.join(
            ", "
          )}`,
        });
      }

      // Kiểm tra học sinh đã có trong lớp chưa
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

      // Kiểm tra giới hạn max_students
      if (foundClass.max_students !== null && foundClass.max_students > 0) {
        const currentCount = await ClassStudent.count({ where: { class_id } });
        const availableSlots = foundClass.max_students - currentCount;
        if (availableSlots <= 0) {
          return res
            .status(400)
            .json({ success: false, message: "Lớp đã đủ số lượng học sinh." });
        }
        if (newStudents.length > availableSlots) {
          newStudents = newStudents.slice(0, availableSlots);
        }
      }

      // Thêm vào bảng class_students
      const now = new Date();
      const classStudents = newStudents.map((s) => ({
        class_id,
        student_id: s.id,
        role: "student",
        joined_at: now,
      }));
      const created = await ClassStudent.bulkCreate(classStudents);

      // Sau khi thêm học sinh, cập nhật current_students
      const updatedCount = await ClassStudent.count({ where: { class_id } });
      foundClass.current_students = updatedCount;
      await foundClass.save();

      res.status(201).json({
        success: true,
        message: "Students added to class!",
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
  // Sửa thông tin lớp học
  updateClass: async (req, res) => {
    try {
      const classId = req.params.id;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Tìm lớp học
      const foundClass = await Class.findByPk(classId);
      if (!foundClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Chỉ admin hoặc giáo viên chủ nhiệm mới được sửa
      if (userRole !== "admin" && foundClass.teacher_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this class.",
        });
      }

      const { name, code, description, year, status } = req.body;
      // Chỉ cập nhật các trường được phép
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
  // Tạo lớp học (chỉ teacher)
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
      // Thêm học sinh vào lớp nếu có
      if (Array.isArray(studentEmails) && studentEmails.length > 0) {
        // Tìm các user có email trong danh sách, role STUDENT và đã có bản ghi students
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
            message: `Các email sau không hợp lệ hoặc không phải student: ${notFound.join(
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
        message: "Class created!",
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
  // Lấy thông tin lớp học theo id
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
      // Chỉ admin, giáo viên chủ nhiệm, hoặc sinh viên thuộc lớp mới được lấy
      if (
        user.role === "admin" ||
        (user.role === "TEACHER" && foundClass.teacher_id === user.userId)
      ) {
        return res.json({ success: true, data: foundClass });
      }
      if (user.role === "STUDENT") {
        // Kiểm tra sinh viên có trong lớp không
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

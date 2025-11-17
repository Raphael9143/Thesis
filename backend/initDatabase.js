const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Teacher = require("./models/Teacher");
const Student = require("./models/Student");
const Researcher = require("./models/Researcher");
const Course = require("./models/Course");
const Class = require("./models/Class");
const ClassCourse = require("./models/ClassCourse");
const ClassStudent = require("./models/ClassStudent");
const Assignment = require("./models/Assignment");
const Lecture = require("./models/Lecture");
const Exam = require("./models/Exam");
const Submission = require("./models/Submission");
const AssignmentCourse = require("./models/AssignmentCourse");
const UseModel = require("./models/UseModel");
const ResearchProject = require("./models/ResearchProject");
const ResearchProjectMember = require("./models/ResearchProjectMember");
const ResearchContribution = require("./models/ResearchContribution");

const initDatabase = async () => {
  await User.create({
    full_name: "Admin",
    email: "admin@example.com",
    password: await bcrypt.hash("admin123", 10),
    role: "ADMIN",
    status: "ACTIVE",
  });

  const teacherUser = await User.create({
    full_name: "Nguyen Van A",
    email: "teacher1@example.com",
    password: await bcrypt.hash("teacher123", 10),
    role: "TEACHER",
    status: "ACTIVE",
  });

  await Teacher.create({
    teacher_id: teacherUser.id,
    teacher_code: "GV001",
    department: "Computer Science",
  });

  const studentUser = await User.create({
    full_name: "Le Thi B",
    email: "student1@example.com",
    password: await bcrypt.hash("student123", 10),
    role: "STUDENT",
    status: "ACTIVE",
  });
  await Student.create({
    student_id: studentUser.id,
    student_code: "SV001",
    major: "Computer Science",
    year: 3,
  });

  const researcherUser = await User.create({
    full_name: "Dr. Tran Van C",
    email: "researcher1@example.com",
    password: await bcrypt.hash("researcher123", 10),
    role: "RESEARCHER",
    status: "ACTIVE",
  });

  await Researcher.create({
    researcher_id: researcherUser.id,
    researcher_code: "RES001",
    department: "Computer Science",
    field_of_study: "Artificial Intelligence",
    research_interests: [
      "Machine Learning",
      "Deep Learning",
      "Computer Vision",
    ],
    publications: [
      "AI in Education: A Survey",
      "Deep Learning for Image Recognition",
    ],
    current_projects: [
      "Smart Learning Platform",
      "AI-powered Assessment System",
    ],
    academic_rank: "SENIOR_RESEARCHER",
    years_of_experience: 8,
  });

  const course = await Course.create({
    course_name: "OCL Fundamentals",
    course_code: "OCL101",
    description: "A course about OCL fundamentals",
    created_by: teacherUser.id,
    semester: "Spring 2025",
    status: "ACTIVE",
  });

  const class1 = await Class.create({
    name: "OCL Basic",
    code: "OCL2025",
    description: "OCL Basic class for 1st year students",
    teacher_id: teacherUser.id,
    year: 2025,
    max_students: 50,
    current_students: 30,
    status: "active",
  });

  await ClassCourse.create({
    class_id: class1.id,
    course_id: course.course_id,
  });

  await ClassStudent.create({
    class_id: class1.id,
    student_id: studentUser.id,
    joined_at: new Date(),
  });

  for (let i = 2; i <= 30; i++) {
    const email = `student${i}@example.com`;
    const u = await User.create({
      full_name: `Le Thi B ${i}`,
      email,
      password: await bcrypt.hash("student123", 10),
      role: "STUDENT",
      status: "ACTIVE",
    });
    await Student.create({
      student_id: u.id,
      student_code: `SV${String(i).padStart(3, "0")}`,
      major: "Computer Science",
      year: 3,
    });
    await ClassStudent.create({
      class_id: class1.id,
      student_id: u.id,
      joined_at: new Date(),
    });
  }

  const assignment = await Assignment.create({
    course_id: course.course_id,
    title: "Exercise 1: Basic OCL",
    description: "Learn the basics of OCL programming.",
    created_by: teacherUser.id,
    attachment: "/uploads/assignments/sample.use",
    type: "SINGLE",
    start_date: new Date("2025-09-20T08:00:00Z"),
    end_date: new Date("2025-10-01T23:59:00Z"),
  });

  await AssignmentCourse.create({
    assignment_id: assignment.id,
    course_id: course.course_id,
    start_date: new Date("2025-09-20T08:00:00Z"),
    due_date: new Date("2025-10-01T23:59:00Z"),
    week: 2,
  });

  await Lecture.create({
    course_id: course.course_id,
    teacher_id: teacherUser.id,
    title: "Lecture 1: Basics of OCL",
    attachment: "/uploads/lectures/SYLL.doc",
    publish_date: new Date("2025-09-21T08:00:00Z"),
    status: "published",
  });

  await Lecture.create({
    course_id: course.course_id,
    teacher_id: teacherUser.id,
    title: "Reference Materials for OCL",
    attachment: "/uploads/lectures/usecaseSpecification_template.pdf",
    publish_date: new Date("2025-09-22T08:00:00Z"),
    status: "published",
  });

  const exam1 = await Exam.create({
    course_id: course.course_id,
    title: "Midterm Exam",
    description: "Midterm exam for USE fundamentals",
    start_date: new Date("2025-10-15T09:00:00Z"),
    end_date: new Date("2025-10-15T11:00:00Z"),
    type: "SINGLE",
    attachment: "/uploads/exams/banking.use",
    status: "published",
  });

  // Additional sample assignments
  const assignment2 = await Assignment.create({
    course_id: course.course_id,
    title: "Exercise 2: Advanced OCL",
    description: "Advanced exercises to deepen OCL knowledge.",
    created_by: teacherUser.id,
    attachment: "/uploads/exams/banking.use",
    type: "SINGLE",
    start_date: new Date("2025-10-05T08:00:00Z"),
    end_date: new Date("2025-10-20T23:59:00Z"),
  });

  await AssignmentCourse.create({
    assignment_id: assignment2.id,
    course_id: course.course_id,
    start_date: new Date("2025-10-05T08:00:00Z"),
    due_date: new Date("2025-10-20T23:59:00Z"),
    week: 4,
  });

  const assignment3 = await Assignment.create({
    course_id: course.course_id,
    title: "Group Project: OCL Use Case",
    description: "A group assignment to model a real-world use case with OCL.",
    created_by: teacherUser.id,
    attachment: "/uploads/exams/banking.use",
    type: "GROUP",
    start_date: new Date("2025-10-25T08:00:00Z"),
    end_date: new Date("2025-11-30T23:59:00Z"),
  });

  await AssignmentCourse.create({
    assignment_id: assignment3.id,
    course_id: course.course_id,
    start_date: new Date("2025-10-25T08:00:00Z"),
    due_date: new Date("2025-11-30T23:59:00Z"),
    week: 8,
  });

  // Final exam sample
  const finalExam = await Exam.create({
    course_id: course.course_id,
    title: "Final Exam",
    description: "Comprehensive final exam covering the whole course.",
    start_date: new Date("2025-12-10T09:00:00Z"),
    end_date: new Date("2025-12-10T12:00:00Z"),
    type: "SINGLE",
    attachment: "/uploads/exams/banking.use",
    status: "published",
  });

  // Sample submission (student submitted to the assignment)
  await Submission.create({
    assignment_id: assignment.id,
    exam_id: null,
    student_id: studentUser.id,
    submission_time: new Date(),
    attempt_number: 1,
    attachment: "/uploads/exams/banking.use",
    created_at: new Date(),
  });

  // Additional sample submissions by other students (mix of assignment and exam)
  const { Op } = require("sequelize");
  const otherStudents = await Student.findAll({
    where: {
      student_id: {
        [Op.ne]: studentUser.id,
      },
    },
    limit: 8,
  });
  for (let i = 0; i < otherStudents.length; i++) {
    const s = otherStudents[i];
    if (i % 4 === 0) {
      // assignment2 submission
      await Submission.create({
        assignment_id: assignment2.id,
        exam_id: null,
        student_id: s.student_id,
        submission_time: new Date(),
        attempt_number: 1,
        attachment: "/uploads/exams/banking.use",
        created_at: new Date(),
      });
    } else if (i % 4 === 1) {
      // assignment3 submission
      await Submission.create({
        assignment_id: assignment3.id,
        exam_id: null,
        student_id: s.student_id,
        submission_time: new Date(),
        attempt_number: 1,
        attachment: "/uploads/exams/banking.use",
        created_at: new Date(),
      });
    } else if (i % 4 === 2) {
      // midterm exam submission
      await Submission.create({
        assignment_id: null,
        exam_id: exam1.id,
        student_id: s.student_id,
        submission_time: new Date(),
        attempt_number: 1,
        attachment: "/uploads/exams/banking.use",
        created_at: new Date(),
      });
    } else {
      // final exam submission
      await Submission.create({
        assignment_id: null,
        exam_id: finalExam.id,
        student_id: s.student_id,
        submission_time: new Date(),
        attempt_number: 1,
        attachment: "/uploads/exams/banking.use",
        created_at: new Date(),
      });
    }
  }

  // Research community sample data
  const owner = await User.create({
    full_name: "Owner User",
    email: "owner@demo.local",
    password: await bcrypt.hash("Password@123", 10),
    role: "RESEARCHER",
    status: "ACTIVE",
  });

  const moderator = await User.create({
    full_name: "Moderator User",
    email: "moderator@demo.local",
    password: await bcrypt.hash("Password@123", 10),
    role: "RESEARCHER",
    status: "ACTIVE",
  });

  const contributor = await User.create({
    full_name: "Contributor User",
    email: "contributor@demo.local",
    password: await bcrypt.hash("Password@123", 10),
    role: "RESEARCHER",
    status: "ACTIVE",
  });

  // Base USE content for main model (Library domain)
  const baseUse = `model Library

class Book
attributes
    title : String
operations
end

class Member
attributes
    memberId : Integer
    name : String
end

association Borrows between
    Member [1..*] role borrower
    Book   [0..*] role book
end

constraints
context Book inv hasTitle: self.title <> ''
context Member inv hasName: self.name <> ''
`;

  // Ensure uploads/research directory exists and write physical .use files
  const fs = require('fs');
  const path = require('path');
  // Use process.cwd() for base since __dirname may not be defined in some bundlers
  // resolve uploads directory relative to project root (assuming execution from backend dir)
  const researchUploadsDir = path.resolve('uploads', 'research');
  if (!fs.existsSync(researchUploadsDir)) fs.mkdirSync(researchUploadsDir, { recursive: true });
  fs.writeFileSync(path.join(researchUploadsDir, 'library_main.use'), baseUse, 'utf8');

  const mainModel = await UseModel.create({
    name: "Library",
    file_path: "/uploads/research/library_main.use",
    raw_text: baseUse,
    owner_id: owner.id,
  });

  // Helper to parse simple USE content to create child rows
  const UseClass = require('./models/UseClass');
  const UseAttribute = require('./models/UseAttribute');
  // const UseOperation = require('./models/UseOperation'); // operations not parsed in sample
  const UseAssociation = require('./models/UseAssociation');
  const UseAssociationPart = require('./models/UseAssociationPart');
  const UseConstraint = require('./models/UseConstraint');

  function parseUse(raw) {
    const result = { classes: [], associations: [], constraints: [] };
    // Classes
    const classBlockRe = /^class\s+([A-Za-z0-9_]+)[\s\S]*?^end$/gmi;
    let cb; while ((cb = classBlockRe.exec(raw)) !== null) {
      const block = cb[0];
      const nameMatch = block.match(/^class\s+([A-Za-z0-9_]+)/i);
      const name = nameMatch ? nameMatch[1] : 'Unknown';
      const cls = { name, attributes: [], operations: [] };
      const attrMatch = block.match(/attributes\s*([\s\S]*?)(?:operations|end)/i);
      if (attrMatch) {
        const lines = attrMatch[1].split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_:<>]+)/);
          if (m) cls.attributes.push({ name: m[1], type: m[2] });
        }
      }
      result.classes.push(cls);
    }
    // Associations
    const assocRe = /association\s+([A-Za-z0-9_]+)\s+between([\s\S]*?)end/gmi;
    let am; while ((am = assocRe.exec(raw)) !== null) {
      const name = am[1]; const body = am[2];
      const lines = body.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      const parts = [];
      for (const line of lines) {
        const pm = line.match(/([A-Za-z0-9_]+)\s*\[([^\]]+)\]\s*role\s*([A-Za-z0-9_]+)/i);
        if (pm) parts.push({ className: pm[1], multiplicity: pm[2], role: pm[3] });
      }
      result.associations.push({ name, parts });
    }
    // Constraints
    const constraintRe = /^context\s+([A-Za-z0-9_]+)\s+inv\s+([A-Za-z0-9_]+)\s*:(.*)$/gmi;
    let cm; while ((cm = constraintRe.exec(raw)) !== null) {
      result.constraints.push({ context: cm[1], name: cm[2], expression: cm[3].trim() });
    }
    return result;
  }

  async function populateModel(useModelRow) {
    const parsed = parseUse(useModelRow.raw_text || '');
    for (const cls of parsed.classes) {
      const clsRow = await UseClass.create({ use_model_id: useModelRow.id, name: cls.name });
      for (const attr of cls.attributes) {
        await UseAttribute.create({ use_class_id: clsRow.id, name: attr.name, type: attr.type });
      }
    }
    for (const assoc of parsed.associations) {
      const aRow = await UseAssociation.create({ use_model_id: useModelRow.id, name: assoc.name });
      for (const part of assoc.parts) {
        await UseAssociationPart.create({
          use_association_id: aRow.id,
          class_name: part.className,
          multiplicity: part.multiplicity,
          role: part.role,
        });
      }
    }
    for (const cons of parsed.constraints) {
      await UseConstraint.create({
        use_model_id: useModelRow.id,
        context: cons.context,
        kind: 'invariant',
        name: cons.name,
        expression: cons.expression,
      });
    }
  }

  await populateModel(mainModel);

  const project = await ResearchProject.create({
    title: "UML/OCL Library Project",
    description: "Community project to model a library domain.",
    status: "ACTIVE",
    owner_id: owner.id,
    visibility: "PUBLIC",
    main_use_model_id: mainModel.id,
  });

  await ResearchProjectMember.create({
    research_project_id: project.id,
    user_id: owner.id,
    role: "OWNER",
  });
  await ResearchProjectMember.create({
    research_project_id: project.id,
    user_id: moderator.id,
    role: "MODERATOR",
  });
  await ResearchProjectMember.create({
    research_project_id: project.id,
    user_id: contributor.id,
    role: "CONTRIBUTOR",
  });

  // Contribution 1: Add Author class (PENDING)
  const contrib1Text =
    "model Library\n\nclass Book\nattributes\n    title : String\nend\n\n" +
    "class Author\nattributes\n    name : String\nend\n\n" +
    "association Wrote between\n    Author [1..*] role writer\n    Book [1..*] role work\nend\n";
  fs.writeFileSync(path.join(researchUploadsDir, 'library_add_author.use'), contrib1Text, 'utf8');
  const contrib1Model = await UseModel.create({
    name: "Library",
    file_path: "/uploads/research/library_add_author.use",
    raw_text: contrib1Text,
    owner_id: contributor.id,
  });
  await populateModel(contrib1Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib1Model.id,
    contributor_id: contributor.id,
    title: "Add Author entity",
    description: "Introduce Author class and Wrote association.",
    status: "PENDING",
  });

  // Contribution 2: Add invariant (NEEDS_EDIT)
  const contrib2Text =
    "model Library\n\nclass Book\nattributes\n    title : String\nend\n\n" +
    "constraints\ncontext Book inv titleNotEmpty: self.title.size() > 0\n";
  fs.writeFileSync(path.join(researchUploadsDir, 'library_invariant.use'), contrib2Text, 'utf8');
  const contrib2Model = await UseModel.create({
    name: "Library",
    file_path: "/uploads/research/library_invariant.use",
    raw_text: contrib2Text,
    owner_id: contributor.id,
  });
  await populateModel(contrib2Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib2Model.id,
    contributor_id: contributor.id,
    title: "Add title invariant",
    description: "Ensure title not empty.",
    status: "NEEDS_EDIT",
    review_notes: "Please refactor to use <> '' for consistency.",
  });

  // Contribution 3: Rejected sample
  const contrib3Text =
    "model Library\n\nclass Book\nattributes\n    title : String\nend\n\n" +
    "-- bad syntax below\ncontext Book inv broken: self.\n";
  fs.writeFileSync(path.join(researchUploadsDir, 'library_broken.use'), contrib3Text, 'utf8');
  const contrib3Model = await UseModel.create({
    name: "Library",
    file_path: "/uploads/research/library_broken.use",
    raw_text: contrib3Text,
    owner_id: contributor.id,
  });
  await populateModel(contrib3Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib3Model.id,
    contributor_id: contributor.id,
    title: "Broken constraint",
    description: "This demonstrates a rejected submission.",
    status: "REJECTED",
    review_notes: "Syntax error in constraint expression.",
    validation_report: "Error: unexpected token at 'self.'",
  });

  console.log("✅ Seeded sample data!");
};

module.exports = initDatabase;

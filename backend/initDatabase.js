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

  // Create multiple courses
  const course = await Course.create({
    course_name: "OCL Fundamentals",
    course_code: "OCL101",
    description:
      "A comprehensive introduction to Object Constraint Language (OCL)." +
      "\nStudents will learn to write precise constraints for UML models." +
      "\nTopics include: OCL syntax, context, invariants, pre/post conditions." +
      "\nPractical exercises with USE tool for model validation.",
    created_by: teacherUser.id,
    semester: "Spring 2025",
    status: "ACTIVE",
  });

  const course2 = await Course.create({
    course_name: "Advanced UML Modeling",
    course_code: "UML201",
    description:
      "Deep dive into Unified Modeling Language for software design." +
      "\nCovers class diagrams, sequence diagrams, state machines." +
      "\nEmphasis on design patterns and architectural modeling." +
      "\nIncludes hands-on projects using enterprise modeling tools.",
    created_by: teacherUser.id,
    semester: "Spring 2025",
    status: "ACTIVE",
  });

  const course3 = await Course.create({
    course_name: "Software Requirements Engineering",
    course_code: "SRE301",
    description:
      "Systematic approach to gathering and documenting software requirements." +
      "\nTechniques for stakeholder analysis and elicitation." +
      "\nRequirements modeling using UML use cases and scenarios." +
      "\nValidation and verification methods for requirement specifications.",
    created_by: teacherUser.id,
    semester: "Fall 2025",
    status: "ACTIVE",
  });

  const course4 = await Course.create({
    course_name: "Formal Methods in Software Engineering",
    course_code: "FMSE401",
    description:
      "Mathematical foundations for software specification and verification." +
      "\nFormal specification languages including Z notation and OCL." +
      "\nModel checking and theorem proving techniques." +
      "\nCase studies of safety-critical systems development.",
    created_by: teacherUser.id,
    semester: "Fall 2025",
    status: "ACTIVE",
  });

  // Create multiple classes
  const class1 = await Class.create({
    name: "OCL Basic",
    code: "OCL2025",
    description:
      "OCL Basic class for 1st year students." +
      "\nFocus on fundamental constraint writing and model validation.",
    teacher_id: teacherUser.id,
    year: 2025,
    max_students: 50,
    current_students: 30,
    status: "active",
  });

  const class2 = await Class.create({
    name: "UML Advanced Section A",
    code: "UML2025A",
    description:
      "Advanced UML modeling for 2nd year students - Section A." +
      "\nProject-based learning with real-world modeling scenarios.",
    teacher_id: teacherUser.id,
    year: 2025,
    max_students: 40,
    current_students: 35,
    status: "active",
  });

  const class3 = await Class.create({
    name: "UML Advanced Section B",
    code: "UML2025B",
    description:
      "Advanced UML modeling for 2nd year students - Section B." +
      "\nCollaborative projects with industry partners.",
    teacher_id: teacherUser.id,
    year: 2025,
    max_students: 40,
    current_students: 32,
    status: "active",
  });

  const class4 = await Class.create({
    name: "Requirements Engineering",
    code: "REQ2025",
    description:
      "Requirements engineering class for 3rd year students" +
      ".\nEmphasis on real-world client interaction and documentation.",
    teacher_id: teacherUser.id,
    year: 2025,
    max_students: 30,
    current_students: 28,
    status: "active",
  });

  const class5 = await Class.create({
    name: "Formal Methods",
    code: "FM2025",
    description:
      "Graduate-level formal methods class." +
      "\nRigorous mathematical approach to software development.",
    teacher_id: teacherUser.id,
    year: 2025,
    max_students: 25,
    current_students: 20,
    status: "active",
  });

  // Link courses to classes
  await ClassCourse.create({
    class_id: class1.id,
    course_id: course.course_id,
  });

  await ClassCourse.create({
    class_id: class2.id,
    course_id: course2.course_id,
  });

  await ClassCourse.create({
    class_id: class3.id,
    course_id: course2.course_id,
  });

  await ClassCourse.create({
    class_id: class4.id,
    course_id: course3.course_id,
  });

  await ClassCourse.create({
    class_id: class5.id,
    course_id: course4.course_id,
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

  // Create assignments for OCL course
  const assignment = await Assignment.create({
    course_id: course.course_id,
    title: "Exercise 1: Basic OCL Constraints",
    description: "Learn OCL basics and write simple invariants. Submit a .use model file.",
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

  // Create exams
  const exam1 = await Exam.create({
    course_id: course.course_id,
    title: "Midterm Exam: OCL Fundamentals",
    description:
      "Midterm covering OCL fundamentals and practical modeling tasks. " +
      "Closed-book exam lasting 120 minutes.",
    start_date: new Date("2025-10-15T09:00:00Z"),
    end_date: new Date("2025-10-15T11:00:00Z"),
    type: "SINGLE",
    attachment: "/uploads/exams/banking.use",
    status: "published",
  });

  // Additional sample assignments
  const assignment2 = await Assignment.create({
    course_id: course.course_id,
    title: "Exercise 2: Collection Operations in OCL",
    description:
      "Practice OCL collection operations and navigation. " +
      "Deliver an enhanced .use file with advanced constraints.",
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
    title: "Group Project: E-Commerce System Modeling",
    description:
      "Collaborative project to model a complete e-commerce system.\\n\\n" +
      "Objectives:\\n" +
      "- Apply UML class diagrams with OCL constraints\\n" +
      "- Model real-world business rules\\n" +
      "- Collaborate using version control\\n" +
      "- Present and defend your design decisions\\n\\n" +
      "Requirements:\\n" +
      "1. Model customers, products, orders, and payments\\n" +
      "2. Implement at least 15 meaningful OCL constraints\\n" +
      "3. Include state machines for order processing\\n" +
      "4. Create comprehensive test scenarios\\n\\n" +
      "Group size: 3-5 students\\n" +
      "Deliverables:\\n" +
      "- Complete .use file with all models and constraints\\n" +
      "- Design documentation (PDF)\\n" +
      "- 15-minute presentation\\n" +
      "- Individual reflection report",
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

  // Assignments for UML course
  const umlAssignment1 = await Assignment.create({
    course_id: course2.course_id,
    title: "Class Diagram Design: Banking System",
    description:
      "Design a comprehensive class diagram for a banking system.\\n\\n" +
      "Requirements:\\n" +
      "- Model accounts, customers, transactions\\n" +
      "- Include inheritance hierarchy\\n" +
      "- Show associations with proper multiplicities\\n" +
      "- Add OCL constraints for business rules\\n\\n" +
      "Grading criteria:\\n" +
      "- Completeness of model (40%)\\n" +
      "- Proper use of UML notation (30%)\\n" +
      "- OCL constraint quality (20%)\\n" +
      "- Documentation and clarity (10%)",
    created_by: teacherUser.id,
    type: "SINGLE",
    start_date: new Date("2025-09-15T08:00:00Z"),
    end_date: new Date("2025-09-30T23:59:00Z"),
  });

  await AssignmentCourse.create({
    assignment_id: umlAssignment1.id,
    course_id: course2.course_id,
    start_date: new Date("2025-09-15T08:00:00Z"),
    due_date: new Date("2025-09-30T23:59:00Z"),
    week: 1,
  });

  const umlAssignment2 = await Assignment.create({
    course_id: course2.course_id,
    title: "Sequence Diagrams: User Authentication Flow",
    description:
      "Create sequence diagrams for authentication scenarios.\\n\\n" +
      "Scenarios to model:\\n" +
      "1. Successful login\\n" +
      "2. Failed login attempt\\n" +
      "3. Password reset flow\\n" +
      "4. Two-factor authentication\\n\\n" +
      "Include:\\n" +
      "- All relevant objects and actors\\n" +
      "- Proper message ordering\\n" +
      "- Alternative and exception flows\\n" +
      "- Timing constraints where applicable",
    created_by: teacherUser.id,
    type: "SINGLE",
    start_date: new Date("2025-10-01T08:00:00Z"),
    end_date: new Date("2025-10-15T23:59:00Z"),
  });

  await AssignmentCourse.create({
    assignment_id: umlAssignment2.id,
    course_id: course2.course_id,
    start_date: new Date("2025-10-01T08:00:00Z"),
    due_date: new Date("2025-10-15T23:59:00Z"),
    week: 3,
  });

  // Requirements Engineering assignments
  const reqAssignment1 = await Assignment.create({
    course_id: course3.course_id,
    title: "Requirements Elicitation: Interview Report",
    description:
      "Conduct stakeholder interviews and document requirements.\\n\\n" +
      "Tasks:\\n" +
      "1. Identify and interview 2-3 stakeholders\\n" +
      "2. Extract functional and non-functional requirements\\n" +
      "3. Create use case diagrams\\n" +
      "4. Write detailed use case specifications\\n\\n" +
      "Report must include:\\n" +
      "- Interview transcripts or detailed notes\\n" +
      "- Requirements analysis\\n" +
      "- Use case model with descriptions\\n" +
      "- Prioritization matrix\\n" +
      "- Validation plan",
    created_by: teacherUser.id,
    type: "SINGLE",
    start_date: new Date("2025-11-01T08:00:00Z"),
    end_date: new Date("2025-11-20T23:59:00Z"),
  });

  await AssignmentCourse.create({
    assignment_id: reqAssignment1.id,
    course_id: course3.course_id,
    start_date: new Date("2025-11-01T08:00:00Z"),
    due_date: new Date("2025-11-20T23:59:00Z"),
    week: 2,
  });

  // Final exam sample
  const finalExam = await Exam.create({
    course_id: course.course_id,
    title: "Final Exam: Comprehensive OCL Assessment",
    description:
      "Cumulative final exam covering entire semester.\\n\\n" +
      "Comprehensive topics:\\n" +
      "- All OCL language features\\n" +
      "- Advanced collection operations\\n" +
      "- Pre/post conditions\\n" +
      "- Complex constraint patterns\\n" +
      "- Integration with UML models\\n\\n" +
      "Exam structure:\\n" +
      "- Part 1: Theory and concepts (30 points)\\n" +
      "- Part 2: Code reading and analysis (30 points)\\n" +
      "- Part 3: Complete system modeling (40 points)\\n\\n" +
      "Duration: 180 minutes\\n" +
      "Worth: 40% of final grade\\n" +
      "Study materials: All lecture slides and assignments",
    start_date: new Date("2025-12-10T09:00:00Z"),
    end_date: new Date("2025-12-10T12:00:00Z"),
    type: "SINGLE",
    attachment: "/uploads/exams/banking.use",
    status: "published",
  });

  // Additional exams for other courses
  await Exam.create({
    course_id: course2.course_id,
    title: "UML Modeling Quiz 1: Class Diagrams",
    description:
      "Quick assessment of class diagram understanding.\\n\\n" +
      "Coverage:\\n" +
      "- Classes, attributes, operations\\n" +
      "- Associations and aggregations\\n" +
      "- Inheritance and interfaces\\n" +
      "- Multiplicities and constraints\\n\\n" +
      "Format: 60-minute online quiz\\n" +
      "Questions: 30 multiple choice\\n" +
      "Attempt limit: 1",
    start_date: new Date("2025-10-20T14:00:00Z"),
    end_date: new Date("2025-10-20T15:00:00Z"),
    type: "SINGLE",
    status: "published",
  });

  await Exam.create({
    course_id: course2.course_id,
    title: "Final Project Presentation: GROUP",
    description:
      "Group presentation of semester design project.\\n\\n" +
      "Requirements:\\n" +
      "- 20-minute presentation per group\\n" +
      "- Demonstrate complete UML model\\n" +
      "- Explain design decisions\\n" +
      "- Answer questions from panel\\n\\n" +
      "Evaluation criteria:\\n" +
      "- Design quality (40%)\\n" +
      "- Presentation clarity (25%)\\n" +
      "- Technical depth (20%)\\n" +
      "- Team coordination (15%)\\n\\n" +
      "Each team member must present\\n" +
      "Attendance mandatory for all",
    start_date: new Date("2025-12-05T09:00:00Z"),
    end_date: new Date("2025-12-05T17:00:00Z"),
    type: "GROUP",
    status: "published",
  });

  await Exam.create({
    course_id: course3.course_id,
    title: "Requirements Engineering Case Study Exam",
    description:
      "Apply RE techniques to a real-world case study.\\n\\n" +
      "You will receive:\\n" +
      "- Business context document\\n" +
      "- Stakeholder profiles\\n" +
      "- Initial requirements (incomplete)\\n\\n" +
      "Tasks:\\n" +
      "1. Identify missing requirements\\n" +
      "2. Resolve conflicts and ambiguities\\n" +
      "3. Create use case model\\n" +
      "4. Write SRS document excerpt\\n" +
      "5. Develop validation checklist\\n\\n" +
      "Duration: 3 hours\\n" +
      "Open book and notes allowed",
    start_date: new Date("2025-12-08T09:00:00Z"),
    end_date: new Date("2025-12-08T12:00:00Z"),
    type: "SINGLE",
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

  // Ensure uploads/research directory exists
  const fs = require("fs");
  const path = require("path");
  // Use process.cwd() for base since __dirname may not be defined in some bundlers
  // resolve uploads directory relative to project root (assuming execution from backend dir)
  const researchUploadsDir = path.resolve("uploads", "research");
  if (!fs.existsSync(researchUploadsDir))
    fs.mkdirSync(researchUploadsDir, { recursive: true });

  // Read the library system USE file
  const baseUse = fs.readFileSync(
    path.join(researchUploadsDir, "library_system.use"),
    "utf8"
  );

  const mainModel = await UseModel.create({
    name: "Library System",
    file_path: "/uploads/research/library_system.use",
    raw_text: baseUse,
    owner_id: owner.id,
  });

  // Helper to parse simple USE content to create child rows
  const UseClass = require("./models/UseClass");
  const UseAttribute = require("./models/UseAttribute");
  // const UseOperation = require('./models/UseOperation'); // operations not parsed in sample
  const UseAssociation = require("./models/UseAssociation");
  const UseAssociationPart = require("./models/UseAssociationPart");
  const UseConstraint = require("./models/UseConstraint");

  function parseUse(raw) {
    const result = { classes: [], associations: [], constraints: [] };
    // Classes
    const classBlockRe = /^class\s+([A-Za-z0-9_]+)[\s\S]*?^end$/gim;
    let cb;
    while ((cb = classBlockRe.exec(raw)) !== null) {
      const block = cb[0];
      const nameMatch = block.match(/^class\s+([A-Za-z0-9_]+)/i);
      const name = nameMatch ? nameMatch[1] : "Unknown";
      const cls = { name, attributes: [], operations: [] };
      const attrMatch = block.match(
        /attributes\s*([\s\S]*?)(?:operations|end)/i
      );
      if (attrMatch) {
        const lines = attrMatch[1]
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        for (const line of lines) {
          const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_:<>]+)/);
          if (m) cls.attributes.push({ name: m[1], type: m[2] });
        }
      }
      result.classes.push(cls);
    }
    // Associations
    const assocRe = /association\s+([A-Za-z0-9_]+)\s+between([\s\S]*?)end/gim;
    let am;
    while ((am = assocRe.exec(raw)) !== null) {
      const name = am[1];
      const body = am[2];
      const lines = body
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const parts = [];
      for (const line of lines) {
        const pm = line.match(
          /([A-Za-z0-9_]+)\s*\[([^\]]+)\]\s*role\s*([A-Za-z0-9_]+)/i
        );
        if (pm)
          parts.push({ className: pm[1], multiplicity: pm[2], role: pm[3] });
      }
      result.associations.push({ name, parts });
    }
    // Constraints
    const constraintRe =
      /^context\s+([A-Za-z0-9_]+)\s+inv\s+([A-Za-z0-9_]+)\s*:(.*)$/gim;
    let cm;
    while ((cm = constraintRe.exec(raw)) !== null) {
      result.constraints.push({
        context: cm[1],
        name: cm[2],
        expression: cm[3].trim(),
      });
    }
    return result;
  }

  async function populateModel(useModelRow) {
    const parsed = parseUse(useModelRow.raw_text || "");
    for (const cls of parsed.classes) {
      const clsRow = await UseClass.create({
        use_model_id: useModelRow.id,
        name: cls.name,
      });
      for (const attr of cls.attributes) {
        await UseAttribute.create({
          use_class_id: clsRow.id,
          name: attr.name,
          type: attr.type,
        });
      }
    }
    for (const assoc of parsed.associations) {
      const aRow = await UseAssociation.create({
        use_model_id: useModelRow.id,
        name: assoc.name,
      });
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
        kind: "invariant",
        name: cons.name,
        expression: cons.expression,
      });
    }
  }

  await populateModel(mainModel);

  // Create multiple research projects (PUBLIC and PRIVATE)
  const project = await ResearchProject.create({
    title: "UML/OCL Library Management System",
    description:
      "Community project to build a UML/OCL model for library management. " +
      "Focus on core entities (Book, Member, Loan) and educational examples.",
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

  // PRIVATE research project 1
  const hospitalUse = fs.readFileSync(
    path.join(researchUploadsDir, "hospital_management.use"),
    "utf8"
  );
  const hospitalModel = await UseModel.create({
    name: "Hospital Management System",
    file_path: "/uploads/research/hospital_management.use",
    raw_text: hospitalUse,
    owner_id: teacherUser.id,
  });
  await populateModel(hospitalModel);

  const project2 = await ResearchProject.create({
    title: "Hospital Management System Design",
    description:
      "Private healthcare modeling project focusing on hospital operations. " +
      "Access restricted; concentrates on records, scheduling and medication management.",
    status: "ACTIVE",
    owner_id: teacherUser.id,
    visibility: "PRIVATE",
    main_use_model_id: hospitalModel.id,
  });

  await ResearchProjectMember.create({
    research_project_id: project2.id,
    user_id: teacherUser.id,
    role: "OWNER",
  });
  await ResearchProjectMember.create({
    research_project_id: project2.id,
    user_id: researcherUser.id,
    role: "CONTRIBUTOR",
  });

  // PUBLIC research project 2
  const ecommerceUse = fs.readFileSync(
    path.join(researchUploadsDir, "ecommerce_platform.use"),
    "utf8"
  );
  const ecommerceModel = await UseModel.create({
    name: "E-Commerce Platform",
    file_path: "/uploads/research/ecommerce_platform.use",
    raw_text: ecommerceUse,
    owner_id: researcherUser.id,
  });
  await populateModel(ecommerceModel);

  const project3 = await ResearchProject.create({
    title: "E-Commerce Platform Pattern Library",
    description:
      "Open-source catalog of e-commerce design patterns and UML/OCL templates. " +
      "Provides reusable examples and welcomes community contributions.",
    status: "ACTIVE",
    owner_id: researcherUser.id,
    visibility: "PUBLIC",
    main_use_model_id: ecommerceModel.id,
  });

  await ResearchProjectMember.create({
    research_project_id: project3.id,
    user_id: researcherUser.id,
    role: "OWNER",
  });
  await ResearchProjectMember.create({
    research_project_id: project3.id,
    user_id: studentUser.id,
    role: "CONTRIBUTOR",
  });

  // PRIVATE research project 2
  const bankingUse = fs.readFileSync(
    path.join(researchUploadsDir, "banking_system.use"),
    "utf8"
  );
  const bankingModel = await UseModel.create({
    name: "Banking System",
    file_path: "/uploads/research/banking_system.use",
    raw_text: bankingUse,
    owner_id: owner.id,
  });
  await populateModel(bankingModel);

  const project4 = await ResearchProject.create({
    title: "Secure Banking System Architecture",
    description:
      "Confidential research on secure banking architecture." +
      " Focuses on authentication and fraud detection. Access restricted under NDA.",
    status: "ACTIVE",
    owner_id: owner.id,
    visibility: "PRIVATE",
    main_use_model_id: bankingModel.id,
  });

  await ResearchProjectMember.create({
    research_project_id: project4.id,
    user_id: owner.id,
    role: "OWNER",
  });
  await ResearchProjectMember.create({
    research_project_id: project4.id,
    user_id: moderator.id,
    role: "MODERATOR",
  });

  // PUBLIC research project 3
  const universityUse = fs.readFileSync(
    path.join(researchUploadsDir, "university_system.use"),
    "utf8"
  );
  const universityModel = await UseModel.create({
    name: "University System",
    file_path: "/uploads/research/university_system.use",
    raw_text: universityUse,
    owner_id: contributor.id,
  });
  await populateModel(universityModel);

  const project5 = await ResearchProject.create({
    title: "University System Modeling Research",
    description:
      "Project to model university processes such as enrollment, courses and scheduling. " +
      "Open collaboration for academic constraint modeling.",
    status: "ACTIVE",
    owner_id: contributor.id,
    visibility: "PUBLIC",
    main_use_model_id: universityModel.id,
  });

  await ResearchProjectMember.create({
    research_project_id: project5.id,
    user_id: contributor.id,
    role: "OWNER",
  });

  // PRIVATE research project 3 - Student group project
  const airlineUse = fs.readFileSync(
    path.join(researchUploadsDir, "airline_reservation.use"),
    "utf8"
  );
  const airlineModel = await UseModel.create({
    name: "Airline Reservation System",
    file_path: "/uploads/research/airline_reservation.use",
    raw_text: airlineUse,
    owner_id: studentUser.id,
  });
  await populateModel(airlineModel);

  const project6 = await ResearchProject.create({
    title: "Group Assignment: Airline Reservation System",
    description:
      "Private group project to model an airline reservation system with booking and seat rules. " +
      "Access restricted to team members and instructor.",
    status: "ACTIVE",
    owner_id: studentUser.id,
    visibility: "PRIVATE",
    main_use_model_id: airlineModel.id,
  });

  await ResearchProjectMember.create({
    research_project_id: project6.id,
    user_id: studentUser.id,
    role: "OWNER",
  });

  // Contribution 1: Introduce Author entity & Wrote association (based on new LibrarySystem)
  const contrib1Text =
    "model LibrarySystem\n\n" +
    "class Author\nattributes\n" +
    "    name : String\n" +
    "    nationality : String\n" +
    "end\n\n" +
    "class Book\nattributes\n" +
    "    isbn : String\n" +
    "    title : String\n" +
    "end\n\n" +
    "association Wrote between\n" +
    "    Author [1..*] role writers\n" +
    "    Book   [1..*] role works\n" +
    "end\n\n" +
    "constraints\n" +
    "context Author inv nameNotEmpty: name.size() > 0\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_add_author.use"),
    contrib1Text,
    "utf8"
  );
  const contrib1Model = await UseModel.create({
    name: "LibrarySystem",
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

  // Contribution 2: Add invariant ensuring publicationYear in valid range
  const contrib2Text =
    "model LibrarySystem\n\n" +
    "class Book\nattributes\n" +
    "    publicationYear : Integer\n" +
    "    title : String\n" +
    "end\n\n" +
    "constraints\n" +
    "context Book inv validPublicationYear: publicationYear >= 1900 and publicationYear <= 2025\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_invariant.use"),
    contrib2Text,
    "utf8"
  );
  const contrib2Model = await UseModel.create({
    name: "LibrarySystem",
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
    status: "PENDING",
  });

  // Contribution 3: Rejected sample (kept for testing) – malformed invariant
  const contrib3Text =
    "model LibrarySystem\n\n" +
    "class Book\nattributes\n" +
    "    title : String\n" +
    "end\n\n" +
    "context Book inv broken: self.\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_broken.use"),
    contrib3Text,
    "utf8"
  );
  const contrib3Model = await UseModel.create({
    name: "LibrarySystem",
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
    status: "PENDING",
  });

  // Additional 7 contributions from various users to test pagination
  // Contribution 4: From teacher (PENDING)
  const contrib4Text =
    "model LibrarySystem\n\n" +
    "class Book\nattributes\n" +
    "    isbn : String\n" +
    "    title : String\n" +
    "    totalCopies : Integer\n" +
    "    availableCopies : Integer\n" +
    "end\n\n" +
    "constraints\n" +
    "context Book inv copiesInRange: availableCopies >= 0 and availableCopies <= totalCopies\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_add_isbn.use"),
    contrib4Text,
    "utf8"
  );
  const contrib4Model = await UseModel.create({
    name: "LibrarySystem",
    file_path: "/uploads/research/library_add_isbn.use",
    raw_text: contrib4Text,
    owner_id: teacherUser.id,
  });
  await populateModel(contrib4Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib4Model.id,
    contributor_id: teacherUser.id,
    title: "Add ISBN attribute",
    description: "Added ISBN to Book class.",
    status: "PENDING",
  });

  // Contribution 5: From student (ACCEPTED)
  const contrib5Text =
    "model LibrarySystem\n\n" +
    "class Member\nattributes\n" +
    "    memberId : String\n" +
    "    name : String\n" +
    "    email : String\n" +
    "    membershipType : String\n" +
    "end\n\n" +
    "constraints\n" +
    "context Member inv membershipAllowed: Set{'STANDARD','PREMIUM','STUDENT'}" +
    "->includes(membershipType)\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_add_email.use"),
    contrib5Text,
    "utf8"
  );
  const contrib5Model = await UseModel.create({
    name: "LibrarySystem",
    file_path: "/uploads/research/library_add_email.use",
    raw_text: contrib5Text,
    owner_id: studentUser.id,
  });
  await populateModel(contrib5Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib5Model.id,
    contributor_id: studentUser.id,
    title: "Add email to Member",
    description: "Member now has email attribute.",
    status: "PENDING",
  });

  // Contribution 6: From moderator (PENDING)
  const contrib6Text =
    "model LibrarySystem\n\n" +
    "class Librarian\nattributes\n" +
    "    employeeId : String\n" +
    "    name : String\n" +
    "    position : String\n" +
    "end\n\n" +
    "constraints\n" +
    "context Librarian inv positionNotEmpty: position.size() > 0\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_add_librarian.use"),
    contrib6Text,
    "utf8"
  );
  const contrib6Model = await UseModel.create({
    name: "LibrarySystem",
    file_path: "/uploads/research/library_add_librarian.use",
    raw_text: contrib6Text,
    owner_id: moderator.id,
  });
  await populateModel(contrib6Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib6Model.id,
    contributor_id: moderator.id,
    title: "Add Librarian entity",
    description: "Introduce Librarian class.",
    status: "PENDING",
  });

  // Contribution 7: From researcher (NEEDS_EDIT)
  const contrib7Text =
    "model LibrarySystem\n\n" +
    "class Book\nattributes\n" +
    "    title : String\n" +
    "    publicationYear : Integer\n" +
    "end\n\n" +
    "constraints\n" +
    "context Book inv publicationYearFuture: publicationYear <= 2030\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_add_year.use"),
    contrib7Text,
    "utf8"
  );
  const contrib7Model = await UseModel.create({
    name: "LibrarySystem",
    file_path: "/uploads/research/library_add_year.use",
    raw_text: contrib7Text,
    owner_id: researcherUser.id,
  });
  await populateModel(contrib7Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib7Model.id,
    contributor_id: researcherUser.id,
    title: "Add publish year",
    description: "Track publication year of books.",
    status: "PENDING",
  });

  // Contribution 8: From another student (PENDING)
  const student2 = await User.findOne({
    where: { email: "student2@example.com" },
  });
  if (student2) {
      const contrib8Text =
        "model LibrarySystem\n\n" +
        "class Book\nattributes\n" +
        "    title : String\n" +
        "    genre : String\n" +
        "    isbn : String\n" +
        "end\n\n" +
        "constraints\n" +
        "context Book inv genreAllowed: Set{'FICTION','NONFICTION','SCIENCE','TECH','OTHER'}" +
        "->includes(genre)\n";
    fs.writeFileSync(
      path.join(researchUploadsDir, "library_add_genre.use"),
      contrib8Text,
      "utf8"
    );
    const contrib8Model = await UseModel.create({
      name: "LibrarySystem",
      file_path: "/uploads/research/library_add_genre.use",
      raw_text: contrib8Text,
      owner_id: student2.id,
    });
    await populateModel(contrib8Model);
    await ResearchContribution.create({
      research_project_id: project.id,
      use_model_id: contrib8Model.id,
      contributor_id: student2.id,
      title: "Add genre to Book",
      description: "Categorize books by genre.",
      status: "PENDING",
    });
  }

  // Contribution 9: From another student (ACCEPTED)
  const student3 = await User.findOne({
    where: { email: "student3@example.com" },
  });
  if (student3) {
      const contrib9Text =
        "model LibrarySystem\n\n" +
        "class Loan\nattributes\n" +
        "    loanId : String\n" +
        "    loanDate : String\n" +
        "    dueDate : String\n" +
        "    returnDate : String\n" +
        "    status : String\n" +
        "end\n\n" +
        "constraints\n" +
        "context Loan inv validStatus: Set{'ACTIVE','RETURNED','OVERDUE'}->includes(status)\n";
    fs.writeFileSync(
      path.join(researchUploadsDir, "library_add_loan.use"),
      contrib9Text,
      "utf8"
    );
    const contrib9Model = await UseModel.create({
      name: "LibrarySystem",
      file_path: "/uploads/research/library_add_loan.use",
      raw_text: contrib9Text,
      owner_id: student3.id,
    });
    await populateModel(contrib9Model);
    await ResearchContribution.create({
      research_project_id: project.id,
      use_model_id: contrib9Model.id,
      contributor_id: student3.id,
      title: "Add Loan entity",
      description: "Track book loans.",
      status: "PENDING",
    });
  }

  // Contribution 10: From owner (ACCEPTED)
  const contrib10Text =
    "model LibrarySystem\n\n" +
    "class Publisher\nattributes\n" +
    "    name : String\n" +
    "    country : String\n" +
    "    foundedYear : Integer\n" +
    "end\n\n" +
    "constraints\n" +
    "context Publisher inv foundedYearRange: foundedYear >= 1800 and foundedYear <= 2025\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_add_publisher.use"),
    contrib10Text,
    "utf8"
  );
  const contrib10Model = await UseModel.create({
    name: "LibrarySystem",
    file_path: "/uploads/research/library_add_publisher.use",
    raw_text: contrib10Text,
    owner_id: owner.id,
  });
  await populateModel(contrib10Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib10Model.id,
    contributor_id: owner.id,
    title: "Add Publisher entity",
    description: "Track book publishers.",
    status: "PENDING",
  });

  // Contribution 11: From student4 (PENDING)
  const student4 = await User.findOne({
    where: { email: "student4@example.com" },
  });
  if (student4) {
      const contrib11Text =
        "model LibrarySystem\n\n" +
        "class Book\nattributes\n" +
        "    title : String\n" +
        "    pageCount : Integer\n" +
        "    isbn : String\n" +
        "end\n\n" +
        "constraints\n" +
        "context Book inv pageCountPositive: pageCount > 0\n";
    fs.writeFileSync(
      path.join(researchUploadsDir, "library_add_pagecount.use"),
      contrib11Text,
      "utf8"
    );
    const contrib11Model = await UseModel.create({
      name: "LibrarySystem",
      file_path: "/uploads/research/library_add_pagecount.use",
      raw_text: contrib11Text,
      owner_id: student4.id,
    });
    await populateModel(contrib11Model);
    await ResearchContribution.create({
      research_project_id: project.id,
      use_model_id: contrib11Model.id,
      contributor_id: student4.id,
      title: "Add page count",
      description: "Track number of pages in books.",
      status: "PENDING",
    });
  }

  // Contribution 12: From student5 (REJECTED)
  const student5 = await User.findOne({
    where: { email: "student5@example.com" },
  });
  if (student5) {
      const contrib12Text =
        "model LibrarySystem\n\n" +
        "class Member\nattributes\n" +
        "    password : String\n" +
        "    name : String\n" +
        "end\n\n" +
        "constraints\n" +
        "context Member inv passwordMinLen: password.size() >= 8\n";
    fs.writeFileSync(
      path.join(researchUploadsDir, "library_add_password.use"),
      contrib12Text,
      "utf8"
    );
    const contrib12Model = await UseModel.create({
      name: "LibrarySystem",
      file_path: "/uploads/research/library_add_password.use",
      raw_text: contrib12Text,
      owner_id: student5.id,
    });
    await populateModel(contrib12Model);
    await ResearchContribution.create({
      research_project_id: project.id,
      use_model_id: contrib12Model.id,
      contributor_id: student5.id,
      title: "Add password field",
      description: "Security credential for members.",
      status: "PENDING",
    });
  }

  // Contribution 13: From teacher (ACCEPTED)
  const contrib13Text =
    "model LibrarySystem\n\n" +
    "class Category\nattributes\n" +
    "    name : String\n" +
    "    description : String\n" +
    "end\n\n" +
    "constraints\n" +
    "context Category inv nameUnique: Category.allInstances()->isUnique(name)\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_add_category.use"),
    contrib13Text,
    "utf8"
  );
  const contrib13Model = await UseModel.create({
    name: "LibrarySystem",
    file_path: "/uploads/research/library_add_category.use",
    raw_text: contrib13Text,
    owner_id: teacherUser.id,
  });
  await populateModel(contrib13Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib13Model.id,
    contributor_id: teacherUser.id,
    title: "Add Category entity",
    description: "Organize books into categories.",
    status: "PENDING",
  });

  // Contribution 14: From moderator (NEEDS_EDIT)
  const contrib14Text =
    "model LibrarySystem\n\n" +
    "class Book\nattributes\n" +
    "    title : String\n" +
    "    availableCopies : Integer\n" +
    "    totalCopies : Integer\n" +
    "end\n\n" +
    "constraints\n" +
    "context Book inv totalPositive: totalCopies > 0\n" +
    "context Book inv availableWithin: availableCopies >= 0 and availableCopies <= totalCopies\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_add_availability.use"),
    contrib14Text,
    "utf8"
  );
  const contrib14Model = await UseModel.create({
    name: "LibrarySystem",
    file_path: "/uploads/research/library_add_availability.use",
    raw_text: contrib14Text,
    owner_id: moderator.id,
  });
  await populateModel(contrib14Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib14Model.id,
    contributor_id: moderator.id,
    title: "Track book availability",
    description: "Boolean flag for book availability.",
    status: "PENDING",
  });

  // Contribution 15: From researcher (PENDING)
  const contrib15Text =
    "model LibrarySystem\n\n" +
    "class Review\nattributes\n" +
    "    rating : Integer\n" +
    "    comment : String\n" +
    "    reviewerName : String\n" +
    "end\n\n" +
    "constraints\n" +
    "context Review inv ratingRange: rating >= 1 and rating <= 5\n";
  fs.writeFileSync(
    path.join(researchUploadsDir, "library_add_review.use"),
    contrib15Text,
    "utf8"
  );
  const contrib15Model = await UseModel.create({
    name: "LibrarySystem",
    file_path: "/uploads/research/library_add_review.use",
    raw_text: contrib15Text,
    owner_id: researcherUser.id,
  });
  await populateModel(contrib15Model);
  await ResearchContribution.create({
    research_project_id: project.id,
    use_model_id: contrib15Model.id,
    contributor_id: researcherUser.id,
    title: "Add Review entity",
    description: "Members can review books.",
    status: "PENDING",
  });

  // Seed comments for some contributions
  const ContributionComment = require("./models/ContributionComment");

  // Comments for contribution 1 (Add Author entity)
  await ContributionComment.create({
    contribution_id: 1,
    user_id: teacherUser.id,
    comment_text: "Good idea! But should we add nationality for Author?",
  });

  await ContributionComment.create({
    contribution_id: 1,
    user_id: studentUser.id,
    comment_text: "I agree with adding nationality field.",
  });

  await ContributionComment.create({
    contribution_id: 1,
    user_id: researcherUser.id,
    comment_text:
      "We could also add birth_date and death_date for historical authors.",
  });

  // Comments for contribution 5 (Add email to Member)
  await ContributionComment.create({
    contribution_id: 5,
    user_id: teacherUser.id,
    comment_text: "Email is essential for notifications. Approved!",
  });

  await ContributionComment.create({
    contribution_id: 5,
    user_id: researcherUser.id,
    comment_text: "Should we validate email format in the constraint?",
  });

  // Comments for contribution 8 (Add Loan entity)
  await ContributionComment.create({
    contribution_id: 8,
    user_id: moderator.id,
    comment_text:
      "We need to track loan duration. Can you add due_date attribute?",
  });

  await ContributionComment.create({
    contribution_id: 8,
    user_id: owner.id,
    comment_text: "Also add return_date and late_fee fields please.",
  });

  // Comments for contribution 12 (Track availability)
  await ContributionComment.create({
    contribution_id: 12,
    user_id: studentUser.id,
    comment_text: "This is really useful for checking book availability!",
  });

  console.log(
    "Seeded sample data with 15 contributions and comments for project ID 1!"
  );
};

module.exports = initDatabase;

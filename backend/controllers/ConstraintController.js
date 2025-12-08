const ConstraintQuestion = require("../models/ConstraintQuestion");
const ConstraintAnswer = require("../models/ConstraintAnswer");
const User = require("../models/User");
const ResearchProject = require("../models/ResearchProject");
const ResearchProjectMember = require("../models/ResearchProjectMember");

// Helpers
async function isProjectModeratorOrOwner(projectId, userId) {
  const project = await ResearchProject.findByPk(projectId);
  if (!project) return false;
  if (project.owner_id === userId) return true;
  const member = await ResearchProjectMember.findOne({
    where: { research_project_id: projectId, user_id: userId },
  });
  if (!member) return false;
  return member.role === "OWNER" || member.role === "MODERATOR";
}

const ConstraintController = {
  // Create a question (only owner/moderator allowed)
  createQuestion: async (req, res) => {
    try {
      const { research_project_id, title, question_text } = req.body;
      const userId = req.user.userId;

      if (!research_project_id || !title) {
        return res
          .status(400)
          .json({ success: false, message: "project and title are required" });
      }

      const allowed = await isProjectModeratorOrOwner(
        research_project_id,
        userId
      );
      if (!allowed)
        return res.status(403).json({ success: false, message: "Forbidden" });

      let filePath = null;
      // multer conditionalUpload uses upload.any(), which places files in req.files (array).
      // Accept either req.file (single) or first element of req.files (array).
      const uploadedFile = req.file || (req.files && req.files.length ? req.files[0] : null);
      if (uploadedFile) {
        // Use URL-style forward slashes for stored public path (avoid Windows backslashes)
        filePath = `/uploads/constraints_contribute/${uploadedFile.filename}`;
      }

      const q = await ConstraintQuestion.create({
        research_project_id,
        title,
        question_text,
        uml_use_file_path: filePath,
        created_by: userId,
      });

      res.status(201).json({ success: true, data: q });
    } catch (err) {
      console.error("createQuestion error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // List questions for a project
  listQuestionsForProject: async (req, res) => {
    try {
      const { projectId } = req.params;
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = 10; // fixed page size per requirement
      const offset = (page - 1) * limit;

      const { count, rows } = await ConstraintQuestion.findAndCountAll({
        where: { research_project_id: projectId },
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
        },
      });
    } catch (err) {
      console.error("listQuestionsForProject error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Submit an answer (any authenticated user)
  submitAnswer: async (req, res) => {
    try {
      const { questionId } = req.params;
      const { ocl_text, comment_text } = req.body;
      const userId = req.user.userId;

      if (!ocl_text)
        return res
          .status(400)
          .json({ success: false, message: "ocl_text is required" });

      const question = await ConstraintQuestion.findByPk(questionId);
      if (!question)
        return res
          .status(404)
          .json({ success: false, message: "Question not found" });

      const created = await ConstraintAnswer.create({
        question_id: questionId,
        contributor_id: userId,
        ocl_text,
        comment_text: comment_text || null,
      });

      // If the project type is OCL, ensure the contributor is added as a member (CONTRIBUTOR)
      try {
        const project = await ResearchProject.findByPk(question.research_project_id);
        if (project && project.type && project.type.toUpperCase() === "OCL") {
          const existing = await ResearchProjectMember.findOne({
            where: {
              research_project_id: project.id,
              user_id: userId,
            },
          });
          if (!existing) {
            await ResearchProjectMember.create({
              research_project_id: project.id,
              user_id: userId,
              role: "CONTRIBUTOR",
              joined_at: new Date(),
            });
          }
        }
      } catch (e) {
        // Non-fatal: membership creation failure shouldn't block answer submission
        console.warn("Could not add contributor membership:", e && e.message ? e.message : e);
      }

      // Return the created answer including contributor basic info
      const ans = await ConstraintAnswer.findByPk(created.id, {
        include: [{ model: User, as: "contributor", attributes: ["id", "full_name"] }],
      });

      res.status(201).json({ success: true, data: ans });
    } catch (err) {
      console.error("submitAnswer error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // List answers for a question
  listAnswers: async (req, res) => {
    try {
      const { questionId } = req.params;
      // Ensure question exists and get project id
      const question = await ConstraintQuestion.findByPk(questionId);
      if (!question)
        return res.status(404).json({ success: false, message: "Question not found" });

      const answers = await ConstraintAnswer.findAll({
        where: { question_id: questionId },
        order: [["created_at", "ASC"]],
        include: [{ model: User, as: "contributor", attributes: ["id", "full_name"] }],
      });

      // Fetch membership roles for all contributors in a single query
      const contributorIds = answers.map((a) => a.contributor_id).filter(Boolean);
      let memberMap = {};
      if (contributorIds.length) {
        const members = await ResearchProjectMember.findAll({
          where: {
            research_project_id: question.research_project_id,
            user_id: contributorIds,
          },
        });
        memberMap = members.reduce((m, mem) => {
          m[mem.user_id] = mem.role;
          return m;
        }, {});
      }

      // Annotate each answer with contributor_role: 'owner'|'moderator'|'contributor'|null
      const out = answers.map((a) => {
        const plain = a.get ? a.get({ plain: true }) : a;
        const role = memberMap[plain.contributor_id];
        if (role === "OWNER") plain.contributor_role = "OWNER";
        else if (role === "MODERATOR") plain.contributor_role = "MODERATOR";
        else if (role) plain.contributor_role = "CONTRIBUTOR";
        else plain.contributor_role = null;
        return plain;
      });

      res.json({ success: true, data: out });
    } catch (err) {
      console.error("listAnswers error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Update answer status (owner/moderator)
  updateAnswerStatus: async (req, res) => {
    try {
      const { answerId } = req.params;
      const { status } = req.body; // expected PENDING|APPROVED|REJECTED
      const userId = req.user.userId;

      const ans = await ConstraintAnswer.findByPk(answerId);
      if (!ans)
        return res
          .status(404)
          .json({ success: false, message: "Answer not found" });

      const question = await ConstraintQuestion.findByPk(ans.question_id);
      if (!question)
        return res
          .status(404)
          .json({ success: false, message: "Question not found" });

      const allowed = await isProjectModeratorOrOwner(
        question.research_project_id,
        userId
      );
      if (!allowed)
        return res.status(403).json({ success: false, message: "Forbidden" });

      if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status" });
      }

      ans.status = status;
      await ans.save();

      const ansWithContributor = await ConstraintAnswer.findByPk(ans.id, {
        include: [{ model: User, as: "contributor", attributes: ["id", "full_name"] }],
      });
      res.json({ success: true, data: ansWithContributor });
    } catch (err) {
      console.error("updateAnswerStatus error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Count distinct participants (contributors) who answered a question
  countParticipantsForQuestion: async (req, res) => {
    try {
      const { questionId } = req.params;
      const question = await ConstraintQuestion.findByPk(questionId);
      if (!question)
        return res.status(404).json({ success: false, message: "Question not found" });

      const participantCount = await ConstraintAnswer.count({
        where: { question_id: questionId },
        distinct: true,
        col: "contributor_id",
      });

      res.json({
        success: true,
        data: {
          question_id: parseInt(questionId, 10),
          participant_count: participantCount,
        },
      });
    } catch (err) {
      console.error("countParticipantsForQuestion error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
  // Count total number of answers for a question
  countAnswersForQuestion: async (req, res) => {
    try {
      const { questionId } = req.params;
      const question = await ConstraintQuestion.findByPk(questionId);
      if (!question)
        return res.status(404).json({ success: false, message: "Question not found" });

      const answerCount = await ConstraintAnswer.count({
        where: { question_id: questionId },
      });

      res.json({
        success: true,
        data: {
          question_id: parseInt(questionId, 10),
          answer_count: answerCount,
        },
      });
    } catch (err) {
      console.error("countAnswersForQuestion error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
  // Delete an answer. Contributor can delete their own; project owner/moderator can delete any
  deleteAnswer: async (req, res) => {
    try {
      const { answerId } = req.params;
      const userId = req.user && req.user.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const ans = await ConstraintAnswer.findByPk(answerId);
      if (!ans) return res.status(404).json({ success: false, message: 'Answer not found' });

      // If contributor owns it, allow deletion
      if (ans.contributor_id === userId) {
        await ans.destroy();
        return res.json({ success: true, message: 'Answer deleted' });
      }

      // Otherwise check project owner/moderator rights
      const question = await ConstraintQuestion.findByPk(ans.question_id);
      if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

      const allowed = await isProjectModeratorOrOwner(question.research_project_id, userId);
      if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

      await ans.destroy();
      return res.json({ success: true, message: 'Answer deleted' });
    } catch (err) {
      console.error('deleteAnswer error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};

module.exports = ConstraintController;

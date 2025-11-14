const fs = require("fs");
const path = require("path");

// ensure models & associations
require("../models/UseAssociations");
const ResearchProject = require("../models/ResearchProject");
const ResearchProjectMember = require("../models/ResearchProjectMember");
const ResearchContribution = require("../models/ResearchContribution");
const UseModel = require("../models/UseModel");

const ResearchController = {
  createProject: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const { title, description } = req.body;
      if (!title)
        return res
          .status(400)
          .json({ success: false, message: "title required" });

      const proj = await ResearchProject.create({
        title,
        description: description || null,
        ownerId: req.user.userId,
      });

      // create owner membership
      await ResearchProjectMember.create({
        researchProjectId: proj.id,
        userId: req.user.userId,
        role: "OWNER",
      });

      return res.status(201).json({ success: true, data: proj });
    } catch (err) {
      console.error("createProject error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Create a contribution: upload or provide existing path/raw_text
  createContribution: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const projectId = parseInt(req.params.projectId, 10);
      if (!projectId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid project id" });

      const project = await ResearchProject.findByPk(projectId);
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });

      // require membership (owner/moderator/contributor)
      const membership = await ResearchProjectMember.findOne({
        where: { researchProjectId: projectId, userId: req.user.userId },
      });
      if (!membership)
        return res
          .status(403)
          .json({
            success: false,
            message: "You are not a member of this project",
          });

      // Accept file upload (req.file or req.files) or body.path or body.rawText
      let filePath = null;
      let rawText = null;
      if (req.file) filePath = path.resolve(req.file.path);
      else if (req.files && req.files.length)
        filePath = path.resolve(req.files[0].path);
      else if (req.body && req.body.path) {
        const inputPath = String(req.body.path || "").replace(/\\/g, "/");
        const uploadsMatch = inputPath.match(/^\/?uploads\/(.+)/i);
        if (uploadsMatch)
          filePath = path.resolve(__dirname, "..", "uploads", uploadsMatch[1]);
        else if (path.isAbsolute(inputPath))
          filePath = path.normalize(inputPath);
        else filePath = path.resolve(inputPath);
      } else if (req.body && req.body.rawText) {
        rawText = String(req.body.rawText);
      } else {
        return res
          .status(400)
          .json({ success: false, message: "file, path or rawText required" });
      }

      if (filePath && !fs.existsSync(filePath))
        return res
          .status(404)
          .json({ success: false, message: "file not found" });

      // create a UseModel copy for this contribution
      const content = rawText || (filePath ? fs.readFileSync(filePath, "utf8") : null) || "";

      // Always store contribution copies under /uploads/research
      const researchDir = path.resolve(__dirname, "..", "uploads", "research");
      if (!fs.existsSync(researchDir)) {
        fs.mkdirSync(researchDir, { recursive: true });
      }
      const filename = Date.now() + "-contrib.use";
      const targetPath = path.join(researchDir, filename);
      fs.writeFileSync(targetPath, content, "utf8");
      const publicPath = "/uploads/research/" + filename;

      const useModel = await UseModel.create({
        name: req.body.name || null,
        filePath: publicPath,
        rawText: content,
        ownerId: req.user.userId,
      });

      const contrib = await ResearchContribution.create({
        researchProjectId: projectId,
        useModelId: useModel.id,
        contributorId: req.user.userId,
        title: req.body.title || null,
        description: req.body.description || null,
        status: "PENDING",
      });

      return res.status(201).json({ success: true, data: contrib });
    } catch (err) {
      console.error("createContribution error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // List contributions for a project (optional filter by status)
  listContributions: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const projectId = parseInt(req.params.projectId, 10);
      if (!projectId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid project id" });

      // membership required
      const isMember = await ResearchProjectMember.findOne({
        where: { researchProjectId: projectId, userId: req.user.userId },
      });
      if (!isMember)
        return res.status(403).json({ success: false, message: "Forbidden" });

      const where = { researchProjectId: projectId };
      if (req.query.status) where.status = req.query.status.toUpperCase();

      const list = await ResearchContribution.findAll({
        where,
        order: [["created_at", "DESC"]],
      });
      return res.json({ success: true, data: list });
    } catch (err) {
      console.error("listContributions error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get contribution detail
  getContribution: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const id = parseInt(req.params.id, 10);
      if (!id)
        return res.status(400).json({ success: false, message: "Invalid id" });

      const contrib = await ResearchContribution.findByPk(id, {
        include: [{ model: UseModel, as: "useModel" }],
      });
      if (!contrib)
        return res.status(404).json({ success: false, message: "Not found" });

      // membership check
      const isMember = await ResearchProjectMember.findOne({
        where: {
          researchProjectId: contrib.researchProjectId,
          userId: req.user.userId,
        },
      });
      if (!isMember)
        return res.status(403).json({ success: false, message: "Forbidden" });

      return res.json({ success: true, data: contrib });
    } catch (err) {
      console.error("getContribution error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Contributor resubmits (edit) a contribution: allowed when PENDING or NEEDS_EDIT
  resubmitContribution: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const id = parseInt(req.params.id, 10);
      if (!id)
        return res.status(400).json({ success: false, message: "Invalid id" });

      const contrib = await ResearchContribution.findByPk(id);
      if (!contrib)
        return res.status(404).json({ success: false, message: "Not found" });
      if (contrib.contributorId !== req.user.userId)
        return res.status(403).json({ success: false, message: "Forbidden" });
      if (!["PENDING", "NEEDS_EDIT"].includes(contrib.status))
        return res
          .status(400)
          .json({
            success: false,
            message: "Cannot resubmit in current status",
          });

      // Accept new file/rawText
      let filePath = null;
      let rawText = null;
      if (req.file) filePath = path.resolve(req.file.path);
      else if (req.files && req.files.length)
        filePath = path.resolve(req.files[0].path);
      else if (req.body && req.body.path) {
        const inputPath = String(req.body.path || "").replace(/\\/g, "/");
        const uploadsMatch = inputPath.match(/^\/?uploads\/(.+)/i);
        if (uploadsMatch)
          filePath = path.resolve(__dirname, "..", "uploads", uploadsMatch[1]);
        else if (path.isAbsolute(inputPath))
          filePath = path.normalize(inputPath);
        else filePath = path.resolve(inputPath);
      } else if (req.body && req.body.rawText)
        rawText = String(req.body.rawText);
      else
        return res
          .status(400)
          .json({ success: false, message: "file, path or rawText required" });

      if (filePath && !fs.existsSync(filePath))
        return res
          .status(404)
          .json({ success: false, message: "file not found" });

      const content = rawText || (filePath ? fs.readFileSync(filePath, "utf8") : null) || "";
      const researchDir = path.resolve(__dirname, "..", "uploads", "research");
      if (!fs.existsSync(researchDir)) {
        fs.mkdirSync(researchDir, { recursive: true });
      }
      const filename = Date.now() + "-resubmit.use";
      const targetPath = path.join(researchDir, filename);
      fs.writeFileSync(targetPath, content, "utf8");
      const publicPath = "/uploads/research/" + filename;

      // create new UseModel copy
      const useModel = await UseModel.create({
        name: req.body.name || null,
        filePath: publicPath,
        rawText: content,
        ownerId: req.user.userId,
      });

      contrib.useModelId = useModel.id;
      contrib.status = "PENDING";
      contrib.reviewNotes = null;
      contrib.validationReport = null;
      await contrib.save();

      return res.json({ success: true, data: contrib });
    } catch (err) {
      console.error("resubmitContribution error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Review a contribution (moderator or owner)
  reviewContribution: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const id = parseInt(req.params.id, 10);
      if (!id)
        return res.status(400).json({ success: false, message: "Invalid id" });

      const contrib = await ResearchContribution.findByPk(id);
      if (!contrib)
        return res.status(404).json({ success: false, message: "Not found" });

      // only owner or moderator can review
      const member = await ResearchProjectMember.findOne({
        where: {
          researchProjectId: contrib.researchProjectId,
          userId: req.user.userId,
        },
      });
      if (!member || !["OWNER", "MODERATOR"].includes(member.role))
        return res.status(403).json({ success: false, message: "Forbidden" });

      const { action, notes } = req.body;
      if (!action || !["ACCEPT", "REJECT", "NEEDS_EDIT"].includes(action))
        return res
          .status(400)
          .json({ success: false, message: "Invalid action" });

      contrib.reviewNotes = notes || null;
      if (action === "REJECT") {
        contrib.status = "REJECTED";
      } else if (action === "NEEDS_EDIT") {
        contrib.status = "NEEDS_EDIT";
      } else if (action === "ACCEPT") {
        contrib.status = "ACCEPTED";
        // Merge policy: set project's main_use_model_id to this contribution's useModelId
        const project = await ResearchProject.findByPk(
          contrib.researchProjectId
        );
        if (project) {
          project.mainUseModelId = contrib.useModelId;
          await project.save();
        }
      }

      // optionally run validation and store report (omitted heavy CLI run here)
      if (req.body.validationReport)
        contrib.validationReport = req.body.validationReport;

      await contrib.save();
      return res.json({ success: true, data: contrib });
    } catch (err) {
      console.error("reviewContribution error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = ResearchController;

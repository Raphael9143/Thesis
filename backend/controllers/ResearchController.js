const fs = require("fs");
const path = require("path");

// ensure models & associations
require("../models/UseAssociations");
const ResearchProject = require("../models/ResearchProject");
const ResearchProjectMember = require("../models/ResearchProjectMember");
const ResearchContribution = require("../models/ResearchContribution");
const UseModel = require("../models/UseModel");

const ResearchController = {
  // Get a project by id (public projects readable by anyone, private require membership)
  getProjectById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id)
        return res
          .status(400)
          .json({ success: false, message: "Invalid project id" });

      // Ensure associations
      require("../models/UseAssociations");
      const User = require("../models/User");

      const project = await ResearchProject.findByPk(id, {
        include: [
          { model: User, as: "owner", attributes: ["id", "full_name"] },
        ],
      });
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });

      const plain = project.get({ plain: true });

      // If project is PUBLIC, allow unauthenticated access
      if (plain.visibility === "PUBLIC") {
        // Normalize output
        if (
          Object.prototype.hasOwnProperty.call(plain, "ownerId") &&
          Object.prototype.hasOwnProperty.call(plain, "owner_id")
        )
          delete plain.ownerId;
        if (
          Object.prototype.hasOwnProperty.call(plain, "mainUseModelId") &&
          Object.prototype.hasOwnProperty.call(plain, "main_use_model_id")
        )
          delete plain.mainUseModelId;
        plain.owner = plain.owner
          ? { id: plain.owner.id, full_name: plain.owner.full_name }
          : null;
        plain.my_role = null;
        return res.json({ success: true, data: plain });
      }

      // Otherwise require authentication and membership
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });

      const member = await ResearchProjectMember.findOne({
        where: { research_project_id: id, user_id: req.user.userId },
      });
      if (!member)
        return res.status(403).json({ success: false, message: "Forbidden" });

      // Normalize: drop camelCase duplicates and add my_role
      if (
        Object.prototype.hasOwnProperty.call(plain, "ownerId") &&
        Object.prototype.hasOwnProperty.call(plain, "owner_id")
      )
        delete plain.ownerId;
      if (
        Object.prototype.hasOwnProperty.call(plain, "mainUseModelId") &&
        Object.prototype.hasOwnProperty.call(plain, "main_use_model_id")
      )
        delete plain.mainUseModelId;
      plain.owner = plain.owner
        ? { id: plain.owner.id, full_name: plain.owner.full_name }
        : null;
      plain.my_role = member.role || null;

      return res.json({ success: true, data: plain });
    } catch (err) {
      console.error("getProjectById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  // List projects related to the authenticated user (owner or member)
  listMyProjects: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });

      const userId = req.user.userId;

      // Projects owned by user
      const owned = await ResearchProject.findAll({
        where: { owner_id: userId },
        order: [["created_at", "DESC"]],
        raw: true,
      });

      // Projects where user is a member (moderator/contributor/owner)
      const memberships = await ResearchProjectMember.findAll({
        where: { user_id: userId },
        include: [
          {
            model: ResearchProject,
            as: "project",
          },
        ],
        order: [["joined_at", "DESC"]],
      });

      // Merge and deduplicate by project id; compute myRole
      const map = new Map();
      for (const p of owned) {
        map.set(p.id, { ...p, myRole: "OWNER" });
      }
      for (const m of memberships) {
        const proj = m.project && m.project.get ? m.project.get({ plain: true }) : m.project;
        if (!proj) continue;
        const existing = map.get(proj.id);
        if (!existing) map.set(proj.id, { ...proj, myRole: m.role || "CONTRIBUTOR" });
        else if (existing.myRole !== "OWNER") existing.myRole = m.role || existing.myRole;
      }

      // Normalize shape: drop camelCase ownerId/mainUseModelId; rename myRole -> my_role
      const normalized = Array.from(map.values()).map((p) => {
        const plain = p && p.get ? p.get({ plain: true }) : p;
        const { myRole, ...restRaw } = plain || {};
        // Remove camelCase duplicates
        if (Object.prototype.hasOwnProperty.call(restRaw, "ownerId")) {
          delete restRaw.ownerId;
        }
        if (Object.prototype.hasOwnProperty.call(restRaw, "mainUseModelId")) {
          delete restRaw.mainUseModelId;
        }
        return { ...restRaw, my_role: myRole || null };
      });

      const sorted = normalized.sort((a, b) => {
        const da = new Date(a.created_at || 0).getTime();
        const db = new Date(b.created_at || 0).getTime();
        return db - da;
      });

      return res.json({ success: true, data: sorted });
    } catch (err) {
      console.error("listMyProjects error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
  createProject: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const { title, description } = req.body;
      // visibility: optional, must be PUBLIC or PRIVATE; default PRIVATE
      const visibilityInput = (req.body.visibility || "").toString().toUpperCase();
      const visibility = ["PUBLIC", "PRIVATE"].includes(visibilityInput)
        ? visibilityInput
        : "PRIVATE";
      if (!title)
        return res
          .status(400)
          .json({ success: false, message: "title required" });

      // Create empty .use file for the project
      const fs = require("fs");
      const path = require("path");
      const uploadsDir = path.resolve(__dirname, "..", "uploads", "research");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const timestamp = Date.now();
      const fileName = `${sanitizedTitle}_${timestamp}.use`;
      const filePath = path.join(uploadsDir, fileName);
      const emptyUseContent = "model EmptyModel\n";
      fs.writeFileSync(filePath, emptyUseContent, "utf8");
      const publicPath = `/uploads/research/${fileName}`;

      // Create empty UseModel as main model for this project
      const UseModel = require("../models/UseModel");
      const emptyModel = await UseModel.create({
        name: `${title} - Main Model`,
        file_path: publicPath,
        raw_text: emptyUseContent,
        owner_id: req.user.userId,
      });

      const proj = await ResearchProject.create({
        title,
        description: description || null,
        owner_id: req.user.userId,
        main_use_model_id: emptyModel.id,
        visibility,
      });

      // create owner membership
      await ResearchProjectMember.create({
        research_project_id: proj.id,
        user_id: req.user.userId,
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
        where: { research_project_id: projectId, user_id: req.user.userId },
      });
      if (!membership)
        return res
          .status(403)
          .json({
            success: false,
            message: "You are not a member of this project",
          });

      // Accept file upload only (req.file or req.files)
      let filePath = null;
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
      } else {
        return res
          .status(400)
          .json({ success: false, message: "file or path required" });
      }

      if (filePath && !fs.existsSync(filePath))
        return res
          .status(404)
          .json({ success: false, message: "file not found" });

      // create a UseModel copy for this contribution
      const content = filePath ? fs.readFileSync(filePath, "utf8") : "";

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
        file_path: publicPath,
        raw_text: content,
        owner_id: req.user.userId,
      });

      const contrib = await ResearchContribution.create({
        research_project_id: projectId,
        use_model_id: useModel.id,
        contributor_id: req.user.userId,
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
        where: { research_project_id: projectId, user_id: req.user.userId },
      });
      if (!isMember)
        return res.status(403).json({ success: false, message: "Forbidden" });

      const where = { research_project_id: projectId };
      if (req.query.status) where.status = req.query.status.toUpperCase();

      // Pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await ResearchContribution.findAndCountAll({
        where,
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      console.error("listContributions error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // List current user's contributions in a specific project
  listMyContributions: async (req, res) => {
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

      const where = { 
        contributor_id: req.user.userId,
        research_project_id: projectId 
      };
      
      // Optional filter by status
      if (req.query.status) {
        where.status = req.query.status.toUpperCase();
      }

      // Pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await ResearchContribution.findAndCountAll({
        where,
        include: [
          {
            model: UseModel,
            as: "useModel",
            attributes: ["id", "name", "file_path"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      console.error("listMyContributions error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // List project members grouped by role: owner, moderators, contributors
  listProjectMembers: async (req, res) => {
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

      // Ensure associations
      require("../models/UseAssociations");
      const User = require("../models/User");

      // Verify project exists and requester is a member
      const project = await ResearchProject.findByPk(projectId, {
        include: [
          { model: User, as: "owner", attributes: ["id", "full_name"] },
        ],
      });
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });

      const member = await ResearchProjectMember.findOne({
        where: { research_project_id: projectId, user_id: req.user.userId },
      });
      if (!member)
        return res.status(403).json({ success: false, message: "Forbidden" });

      const members = await ResearchProjectMember.findAll({
        where: { research_project_id: projectId },
        include: [
          { model: User, as: "user", attributes: ["id", "full_name"] },
        ],
        order: [["joined_at", "ASC"]],
      });

      const owner = project.owner ? project.owner.get({ plain: true }) : null;
      const moderators = [];
      const contributors = [];

      for (const m of members) {
        const u = m.user ? m.user.get({ plain: true }) : null;
        if (!u) continue;
        if (m.role === "MODERATOR")
          moderators.push({ id: u.id, full_name: u.full_name });
        else if (m.role === "CONTRIBUTOR")
          contributors.push({ id: u.id, full_name: u.full_name });
      }

      // Normalize: prefer snake_case keys in payload for membership objects
      const ownerOut = owner
        ? { id: owner.id, full_name: owner.full_name }
        : null;

      const payload = {
        owner: ownerOut,
        moderators,
        contributors,
      };

      return res.json({ success: true, data: payload });
    } catch (err) {
      console.error("listProjectMembers error:", err);
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
          research_project_id: contrib.research_project_id,
          user_id: req.user.userId,
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

  // Add comment to contribution (public for PUBLIC projects)
  addContributionComment: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });

      const contributionId = parseInt(req.params.contributionId, 10);
      if (!contributionId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid contribution id" });

      const { comment_text } = req.body;
      if (!comment_text || !comment_text.trim())
        return res
          .status(400)
          .json({ success: false, message: "Comment text is required" });

      const ContributionComment = require("../models/ContributionComment");
      const contrib = await ResearchContribution.findByPk(contributionId);
      if (!contrib)
        return res
          .status(404)
          .json({ success: false, message: "Contribution not found" });

      // Check project visibility
      const project = await ResearchProject.findByPk(contrib.research_project_id);
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });

      // If project is PRIVATE, require membership
      if (project.visibility === "PRIVATE") {
        const isMember = await ResearchProjectMember.findOne({
          where: {
            research_project_id: contrib.research_project_id,
            user_id: req.user.userId,
          },
        });
        if (!isMember)
          return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const comment = await ContributionComment.create({
        contribution_id: contributionId,
        user_id: req.user.userId,
        comment_text: comment_text.trim(),
      });

      // Fetch with user info
      const User = require("../models/User");
      const commentWithUser = await ContributionComment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email"],
          },
        ],
      });

      return res.status(201).json({ success: true, data: commentWithUser });
    } catch (err) {
      console.error("addContributionComment error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get comments for a contribution
  getContributionComments: async (req, res) => {
    try {
      const contributionId = parseInt(req.params.contributionId, 10);
      if (!contributionId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid contribution id" });

      const contrib = await ResearchContribution.findByPk(contributionId);
      if (!contrib)
        return res
          .status(404)
          .json({ success: false, message: "Contribution not found" });

      const ContributionComment = require("../models/ContributionComment");
      const User = require("../models/User");

      const comments = await ContributionComment.findAll({
        where: { contribution_id: contributionId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email"],
          },
        ],
        order: [["created_at", "ASC"]],
      });

      return res.json({ success: true, data: comments });
    } catch (err) {
      console.error("getContributionComments error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get contribution history for a specific project (public access)
  getContributionHistory: async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (!projectId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid project id" });

      // Get all contributions sorted from newest to oldest
      const User = require("../models/User");
      
      // Pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await ResearchContribution.findAndCountAll({
        where: { research_project_id: projectId },
        include: [
          {
            model: User,
            as: "contributor",
            attributes: ["id", "full_name", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      console.error("getContributionHistory error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Update contribution: upload new file content (allowed when PENDING or NEEDS_EDIT)
  updateContribution: async (req, res) => {
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
      if (contrib.contributor_id !== req.user.userId)
        return res.status(403).json({ success: false, message: "Forbidden" });
      if (!["PENDING", "NEEDS_EDIT"].includes(contrib.status))
        return res
          .status(400)
          .json({
            success: false,
            message: "Cannot update in current status",
          });

      // Accept new file/raw_text
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
      } else if (req.body && req.body.raw_text)
        rawText = String(req.body.raw_text);
      else
        return res
          .status(400)
          .json({ success: false, message: "file, path or raw_text required" });

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

      // Get project to determine model name
      const project = await ResearchProject.findByPk(contrib.research_project_id);
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });

      // Get main model to extract name
      const mainModel = await UseModel.findByPk(project.main_use_model_id);
      const modelName = mainModel ? mainModel.name : null;

      // create new UseModel copy with project's model name
      const useModel = await UseModel.create({
        name: modelName,
        file_path: publicPath,
        raw_text: content,
        owner_id: req.user.userId,
      });

      contrib.use_model_id = useModel.id;
      contrib.status = "PENDING";
      contrib.review_notes = null;
      contrib.validation_report = null;
      await contrib.save();

      return res.json({ success: true, data: contrib });
    } catch (err) {
      console.error("updateContribution error:", err);
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
          research_project_id: contrib.research_project_id,
          user_id: req.user.userId,
        },
      });
      if (!member || !["OWNER", "MODERATOR"].includes(member.role))
        return res.status(403).json({ success: false, message: "Forbidden" });

      const { action, notes } = req.body;
      if (!action || !["ACCEPT", "REJECT", "NEEDS_EDIT"].includes(action))
        return res
          .status(400)
          .json({ success: false, message: "Invalid action" });

      contrib.review_notes = notes || null;
      if (action === "REJECT") {
        contrib.status = "REJECTED";
      } else if (action === "NEEDS_EDIT") {
        contrib.status = "NEEDS_EDIT";
      } else if (action === "ACCEPT") {
        contrib.status = "ACCEPTED";
        // Merge policy: set project's main_use_model_id to this contribution's use_model_id
        const project = await ResearchProject.findByPk(
          contrib.research_project_id
        );
        if (project) {
          project.main_use_model_id = contrib.use_model_id;
          await project.save();
        }

        // Add contributor to project members if not already a member
        const existingMembership = await ResearchProjectMember.findOne({
          where: {
            research_project_id: contrib.research_project_id,
            user_id: contrib.contributor_id,
          },
        });

        if (!existingMembership) {
          await ResearchProjectMember.create({
            research_project_id: contrib.research_project_id,
            user_id: contrib.contributor_id,
            role: "CONTRIBUTOR",
            joined_at: new Date(),
          });
        }
      }

      // optionally run validation and store report (omitted heavy CLI run here)
      if (req.body.validation_report)
        contrib.validation_report = req.body.validation_report;

      await contrib.save();
      return res.json({ success: true, data: contrib });
    } catch (err) {
      console.error("reviewContribution error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Star/unstar a project for current user
  toggleStarProject: async (req, res) => {
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

      // Ensure project exists
      const project = await ResearchProject.findByPk(projectId);
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });

      const User = require("../models/User");
      const user = await User.findByPk(req.user.userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      const current = user.star_projects || [];
      const want =
        typeof req.body?.star === "boolean" ? req.body.star : null;

      let next = current.slice();
      const idx = next.indexOf(projectId);
      if (want === true) {
        if (idx === -1) next.push(projectId);
      } else if (want === false) {
        if (idx !== -1) next.splice(idx, 1);
      } else {
        // toggle when not specified
        if (idx === -1) next.push(projectId);
        else next.splice(idx, 1);
      }

      // Ensure uniqueness and sort ascending
      next = Array.from(new Set(next)).sort((a, b) => a - b);
      user.star_projects = next;
      await user.save();

      // Update project star_count
      const wasStarred = idx !== -1;
      const isStarred = next.includes(projectId);
      if (!wasStarred && isStarred) {
        await project.increment("star_count");
      } else if (wasStarred && !isStarred) {
        await project.decrement("star_count");
      }

      return res.json({ success: true, data: { starred_ids: next } });
    } catch (err) {
      console.error("toggleStarProject error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Get starred project id list for current user
  getStarredProjectIds: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      const User = require("../models/User");
      const user = await User.findByPk(req.user.userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      const ids = user.star_projects || [];
      return res.json({ success: true, data: { starred_ids: ids } });
    } catch (err) {
      console.error("getStarredProjectIds error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Check if a project is starred by current user
  checkProjectStarred: async (req, res) => {
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

      const User = require("../models/User");
      const user = await User.findByPk(req.user.userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      const starredIds = user.star_projects || [];
      const isStarred = starredIds.includes(projectId);

      return res.json({
        success: true,
        data: { project_id: projectId, is_starred: isStarred },
      });
    } catch (err) {
      console.error("checkProjectStarred error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Update project status (OWNER or MODERATOR only)
  updateProjectStatus: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });

      const projectId = parseInt(req.params.id, 10);
      if (!projectId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid project id" });

      const { status } = req.body;
      const validStatuses = ["ACTIVE", "ARCHIVED", "COMPLETED", "DRAFT"];
      if (!status || !validStatuses.includes(status))
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be one of: ACTIVE, ARCHIVED, COMPLETED, DRAFT",
        });

      const project = await ResearchProject.findByPk(projectId);
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });

      // Check permission: only OWNER or MODERATOR can update status
      const member = await ResearchProjectMember.findOne({
        where: {
          research_project_id: projectId,
          user_id: req.user.userId,
        },
      });
      if (!member || !["OWNER", "MODERATOR"].includes(member.role))
        return res.status(403).json({
          success: false,
          message: "Only project owner or moderator can update status",
        });

      project.status = status;
      await project.save();

      return res.json({
        success: true,
        message: "Project status updated",
        data: { id: project.id, status: project.status },
      });
    } catch (err) {
      console.error("updateProjectStatus error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Update project visibility (OWNER only)
  updateProjectVisibility: async (req, res) => {
    try {
      if (!req.user || !req.user.userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });

      const projectId = parseInt(req.params.id, 10);
      if (!projectId)
        return res
          .status(400)
          .json({ success: false, message: "Invalid project id" });

      const { visibility } = req.body;
      const validVisibilities = ["PUBLIC", "PRIVATE"];
      if (!visibility || !validVisibilities.includes(visibility))
        return res.status(400).json({
          success: false,
          message: "Invalid visibility. Must be PUBLIC or PRIVATE",
        });

      const project = await ResearchProject.findByPk(projectId);
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });

      // Check permission: only OWNER can update visibility
      if (project.owner_id !== req.user.userId)
        return res.status(403).json({
          success: false,
          message: "Only project owner can update visibility",
        });

      project.visibility = visibility;
      await project.save();

      return res.json({
        success: true,
        message: "Project visibility updated",
        data: { id: project.id, visibility: project.visibility },
      });
    } catch (err) {
      console.error("updateProjectVisibility error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // Add moderator to project (only owner can add, only one moderator allowed)
  addModerator: async (req, res) => {
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

      const { email } = req.body;
      if (!email)
        return res
          .status(400)
          .json({ success: false, message: "Email is required" });

      const User = require("../models/User");

      // Check if project exists and requester is the owner
      const project = await ResearchProject.findByPk(projectId);
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });

      if (project.owner_id !== req.user.userId)
        return res.status(403).json({
          success: false,
          message: "Only project owner can add moderator",
        });

      // Check if moderator already exists
      const existingModerator = await ResearchProjectMember.findOne({
        where: {
          research_project_id: projectId,
          role: "MODERATOR",
        },
      });

      if (existingModerator)
        return res.status(400).json({
          success: false,
          message: "Project already has a moderator",
        });

      // Find user by email
      const moderatorUser = await User.findOne({ where: { email } });
      if (!moderatorUser)
        return res.status(404).json({
          success: false,
          message: "User with this email not found",
        });

      // Check if user is already a member
      const existingMembership = await ResearchProjectMember.findOne({
        where: {
          research_project_id: projectId,
          user_id: moderatorUser.id,
        },
      });

      if (existingMembership) {
        // Update existing membership to moderator
        existingMembership.role = "MODERATOR";
        await existingMembership.save();
        return res.json({
          success: true,
          message: "User role updated to moderator",
          data: {
            user_id: moderatorUser.id,
            full_name: moderatorUser.full_name,
            role: "MODERATOR",
          },
        });
      }

      // Create new membership
      await ResearchProjectMember.create({
        research_project_id: projectId,
        user_id: moderatorUser.id,
        role: "MODERATOR",
        joined_at: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Moderator added successfully",
        data: {
          user_id: moderatorUser.id,
          full_name: moderatorUser.full_name,
          role: "MODERATOR",
        },
      });
    } catch (err) {
      console.error("addModerator error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};

module.exports = ResearchController;

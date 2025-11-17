const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middlewares/auth");
const ResearchController = require("../controllers/ResearchController");

const router = express.Router();

const uploadDir = path.resolve(__dirname, "..", "uploads");
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

function conditionalUpload(req, res, next) {
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.startsWith("multipart/form-data")) return upload.any()(req, res, next);
  return next();
}

// List projects related to current user (owner or member)
/**
 * @swagger
 * /api/research/projects/mine:
 *   get:
 *     summary: List projects related to current user (owner/mod/contrib)
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects the user is related to
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/projects/mine", auth, ResearchController.listMyProjects);

// GET /api/research/projects/most-starred
/**
 * @swagger
 * /api/research/projects/most-starred:
 *   get:
 *     summary: List most starred PUBLIC projects with pagination
 *     tags:
 *       - Research
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         type: integer
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         type: integer
 *         default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of projects sorted by star_count DESC
 *       500:
 *         description: Internal server error
 */
router.get("/projects/most-starred", ResearchController.listMostStarredProjects);

// GET /api/research/projects/starred
/**
 * @swagger
 * /api/research/projects/starred:
 *   get:
 *     summary: List user's starred projects with pagination
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         type: integer
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         type: integer
 *         default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of starred projects
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/projects/starred", auth, ResearchController.listMyStarredProjects);

// GET /api/research/statistics
/**
 * @swagger
 * /api/research/statistics:
 *   get:
 *     summary: Get platform statistics (counts of projects, contributions, use models, researchers)
 *     tags:
 *       - Research
 *     responses:
 *       200:
 *         description: Statistics data
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: integer
 *                 contributions:
 *                   type: integer
 *                 use_models:
 *                   type: integer
 *                 researchers:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
router.get("/statistics", ResearchController.getStatistics);

// GET /api/research/projects/recent
/**
 * @swagger
 * /api/research/projects/recent:
 *   get:
 *     summary: Get recent PUBLIC projects (default 10)
 *     tags:
 *       - Research
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         type: integer
 *         default: 10
 *         description: Number of recent projects to retrieve
 *     responses:
 *       200:
 *         description: List of recent projects sorted by created_at DESC
 *       500:
 *         description: Internal server error
 */
router.get("/projects/recent", ResearchController.listRecentProjects);

// Create project
/**
 * @swagger
 * /api/research/projects:
 *   post:
 *     summary: Create a new research project
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - title
 *           properties:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *     responses:
 *       201:
 *         description: Project created
 *       400:
 *         description: Missing or invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/projects", auth, ResearchController.createProject);

// Create contribution (file or path only)
/**
 * @swagger
 * /api/research/projects/{projectId}/contribute:
 *   post:
 *     summary: Create a contribution for a project
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         type: integer
 *         description: Target project ID
 *       - in: formData
 *         name: file
 *         type: file
 *         description: .use file to upload (alternative to body.path)
 *       - in: body
 *         name: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             path:
 *               type: string
 *               description: Server path like /uploads/file.use
 *             name:
 *               type: string
 *               description: Optional model name
 *             title:
 *               type: string
 *             description:
 *               type: string
 *     responses:
 *       201:
 *         description: Contribution created (PENDING)
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a project member
 *       404:
 *         description: Project or file not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/projects/:projectId/contribute",
  auth,
  conditionalUpload,
  ResearchController.createContribution
);

// List contributions in project
/**
 * @swagger
 * /api/research/projects/{projectId}/contributions:
 *   get:
 *     summary: List contributions in a project
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         type: integer
 *       - in: query
 *         name: status
 *         required: false
 *         type: string
 *         enum: [PENDING, NEEDS_EDIT, ACCEPTED, REJECTED]
 *       - in: query
 *         name: page
 *         required: false
 *         type: integer
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         type: integer
 *         default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of contributions with pagination
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a project member
 *       500:
 *         description: Internal server error
 */
router.get(
  "/projects/:projectId/contributions",
  auth,
  ResearchController.listContributions
);

// GET /api/research/projects/:projectId/contributions/by-status
/**
 * @swagger
 * /api/research/projects/{projectId}/contributions/by-status:
 *   get:
 *     summary: List contributions by specific status with pagination
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         type: integer
 *       - in: query
 *         name: status
 *         required: true
 *         type: string
 *         enum: [PENDING, NEEDS_EDIT, ACCEPTED, REJECTED]
 *         description: Contribution status to filter by
 *       - in: query
 *         name: page
 *         required: false
 *         type: integer
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         type: integer
 *         default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of contributions with pagination
 *       400:
 *         description: Invalid or missing status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a project member
 *       500:
 *         description: Internal server error
 */
router.get(
  "/projects/:projectId/contributions/by-status",
  auth,
  ResearchController.listContributionsByStatus
);

// GET /api/research/projects/:projectId/contributions/mine
/**
 * @swagger
 * /api/research/projects/{projectId}/contributions/mine:
 *   get:
 *     summary: List current user's contributions in a specific project
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         type: integer
 *         description: Project ID
 *       - in: query
 *         name: status
 *         required: false
 *         type: string
 *         enum: [PENDING, NEEDS_EDIT, ACCEPTED, REJECTED]
 *         description: Filter by contribution status
 *       - in: query
 *         name: page
 *         required: false
 *         type: integer
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         type: integer
 *         default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of user's contributions in this project with pagination
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/projects/:projectId/contributions/mine",
  auth,
  ResearchController.listMyContributions
);

// GET /api/research/projects/:projectId/members - list contributors, owner, moderators
/**
 * @swagger
 * /api/research/projects/{projectId}/members:
 *   get:
 *     summary: Get project owner, moderators, and contributors
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Members grouped by role (id and name)
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 owner:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                     full_name:
 *                       type: string
 *                 moderators:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       full_name:
 *                         type: string
 *                 contributors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       full_name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/projects/:projectId/members",
  auth,
  ResearchController.listProjectMembers
);

// POST /api/research/projects/:projectId/moderator - add moderator to project
/**
 * @swagger
 * /api/research/projects/{projectId}/moderator:
 *   post:
 *     summary: Add moderator to project (owner only, max 1 moderator)
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of user to add as moderator
 *     responses:
 *       201:
 *         description: Moderator added successfully
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             message:
 *               type: string
 *             data:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 full_name:
 *                   type: string
 *                 role:
 *                   type: string
 *       200:
 *         description: User role updated to moderator (if already member)
 *       400:
 *         description: Missing email, invalid project id, or moderator already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only project owner can add moderator
 *       404:
 *         description: Project or user not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/projects/:projectId/moderator",
  auth,
  ResearchController.addModerator
);

// GET /api/research/projects/:id - get project by id
/**
 * @swagger
 * /api/research/projects/{id}:
 *   get:
 *     summary: Get research project by id
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project detail
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                   nullable: true
 *                 status:
 *                   type: string
 *                 owner_id:
 *                   type: integer
 *                 main_use_model_id:
 *                   type: integer
 *                   nullable: true
 *                 owner:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                     full_name:
 *                       type: string
 *                 my_role:
 *                   type: string
 *                   description: Role of current user in this project
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a project member)
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
// public access allowed for PUBLIC projects; auth middleware still works for authenticated requests
router.get("/projects/:id", ResearchController.getProjectById);

// PATCH /api/research/projects/:id/status - update project status
/**
 * @swagger
 * /api/research/projects/{id}/status:
 *   patch:
 *     summary: Update project status (OWNER or MODERATOR only)
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ARCHIVED, DRAFT]
 *                 description: New status for the project
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not owner or moderator)
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.patch("/projects/:id/status", auth, ResearchController.updateProjectStatus);

// PATCH /api/research/projects/:id/visibility - update project visibility
/**
 * @swagger
 * /api/research/projects/{id}/visibility:
 *   patch:
 *     summary: Update project visibility (OWNER only)
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visibility
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE]
 *                 description: New visibility for the project
 *     responses:
 *       200:
 *         description: Visibility updated successfully
 *       400:
 *         description: Invalid visibility value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not owner)
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.patch("/projects/:id/visibility", auth, ResearchController.updateProjectVisibility);

// POST /api/research/projects/:projectId/star - star/unstar a project
/**
 * @swagger
 * /api/research/projects/{projectId}/star:
 *   post:
 *     summary: Star or unstar a project for current user
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               star:
 *                 type: boolean
 *                 description: true to star, false to unstar; if omitted, toggles
 *     responses:
 *       200:
 *         description: Updated starred id list
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project or user not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/projects/:projectId/star",
  auth,
  ResearchController.toggleStarProject
);

// GET /api/research/projects/starred/ids - list starred ids for current user
/**
 * @swagger
 * /api/research/projects/starred/ids:
 *   get:
 *     summary: Get starred project ids for current user
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Starred IDs
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/projects/starred/ids",
  auth,
  ResearchController.getStarredProjectIds
);

// GET /api/research/projects/:projectId/starred - check if project is starred
/**
 * @swagger
 * /api/research/projects/{projectId}/starred:
 *   get:
 *     summary: Check if a project is starred by current user
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         type: integer
 *         description: Project ID to check
 *     responses:
 *       200:
 *         description: Star status
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 project_id:
 *                   type: integer
 *                 is_starred:
 *                   type: boolean
 *       400:
 *         description: Invalid project id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/projects/:projectId/starred",
  auth,
  ResearchController.checkProjectStarred
);

// Get contribution detail
/**
 * @swagger
 * /api/research/contributions/{id}:
 *   get:
 *     summary: Get contribution detail
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Contribution detail (includes useModel)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a project member
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.get("/contributions/:id", auth, ResearchController.getContribution);

// POST /api/research/contributions/:contributionId/comments - add comment to contribution
/**
 * @swagger
 * /api/research/contributions/{contributionId}/comments:
 *   post:
 *     summary: Add a comment to a contribution
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contributionId
 *         required: true
 *         type: integer
 *         description: Contribution ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment_text
 *             properties:
 *               comment_text:
 *                 type: string
 *                 description: Comment content
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a project member
 *       404:
 *         description: Contribution not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/contributions/:contributionId/comments",
  auth,
  ResearchController.addContributionComment
);

// GET /api/research/contributions/:contributionId/comments - get comments
/**
 * @swagger
 * /api/research/contributions/{contributionId}/comments:
 *   get:
 *     summary: Get all comments for a contribution
 *     tags:
 *       - Research
 *     parameters:
 *       - in: path
 *         name: contributionId
 *         required: true
 *         type: integer
 *         description: Contribution ID
 *     responses:
 *       200:
 *         description: List of comments with user info
 *       400:
 *         description: Invalid contribution id
 *       404:
 *         description: Contribution not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/contributions/:contributionId/comments",
  ResearchController.getContributionComments
);

// Get contribution history for a project (public access)
/**
 * @swagger
 * /api/research/projects/{projectId}/contributions/history:
 *   get:
 *     summary: Get contribution history sorted from oldest to newest (public access)
 *     tags:
 *       - Research
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         type: integer
 *         description: Project ID
 *       - in: query
 *         name: page
 *         required: false
 *         type: integer
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         type: integer
 *         default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of contributions with contributor info and pagination
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   research_project_id:
 *                     type: integer
 *                   use_model_id:
 *                     type: integer
 *                   contributor_id:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   validation_report:
 *                     type: string
 *                   review_notes:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *                   contributor:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       full_name:
 *                         type: string
 *                       email:
 *                         type: string
 *       400:
 *         description: Invalid project id
 *       500:
 *         description: Internal server error
 */
router.get(
  "/projects/:projectId/contributions/history",
  ResearchController.getContributionHistory
);

// Update contribution (resubmit with new file/path/rawText)
/**
 * @swagger
 * /api/research/contributions/{id}:
 *   patch:
 *     summary: Update contribution content (PENDING/NEEDS_EDIT only)
 *     description: |
 *       Upload new .use file to update contribution.
 *       Model name is automatically set from project's main model.
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: integer
 *       - in: formData
 *         name: file
 *         type: file
 *         description: .use file (alternative to body.path/rawText)
 *       - in: body
 *         name: body
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             path:
 *               type: string
 *               description: Path to existing .use file in uploads/
 *             raw_text:
 *               type: string
 *               description: Raw .use file content as string
 *     responses:
 *       200:
 *         description: Contribution updated and reset to PENDING
 *       400:
 *         description: Invalid state or input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the contributor)
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/contributions/:id",
  auth,
  conditionalUpload,
  ResearchController.updateContribution
);

// Review contribution (accept/reject/needs_edit)
/**
 * @swagger
 * /api/research/contributions/{id}/review:
 *   post:
 *     summary: Review a contribution (OWNER/MODERATOR)
 *     tags:
 *       - Research
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: integer
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - action
 *           properties:
 *             action:
 *               type: string
 *               enum: [ACCEPT, REJECT, NEEDS_EDIT]
 *             notes:
 *               type: string
 *             validationReport:
 *               type: string
 *               description: Optional validation report to store
 *     responses:
 *       200:
 *         description: Contribution reviewed (status updated)
 *       400:
 *         description: Invalid action
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not owner/moderator)
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/contributions/:id/review",
  auth,
  ResearchController.reviewContribution
);

module.exports = router;

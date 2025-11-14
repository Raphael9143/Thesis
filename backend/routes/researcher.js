const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const ResearcherController = require("../controllers/ResearcherController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Researcher:
 *       type: object
 *       properties:
 *         researcher_id:
 *           type: integer
 *         researcher_code:
 *           type: string
 *         department:
 *           type: string
 *           nullable: true
 *         field_of_study:
 *           type: string
 *           nullable: true
 *         research_interests:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *         publications:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *         current_projects:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *         academic_rank:
 *           type: string
 *           enum: [RESEARCH_ASSISTANT, RESEARCHER, SENIOR_RESEARCHER, PRINCIPAL_RESEARCHER]
 *           nullable: true
 *         years_of_experience:
 *           type: integer
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/researcher/profile:
 *   get:
 *     summary: Lấy thông tin profile researcher hiện tại
 *     tags: [Researcher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin profile researcher
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Researcher'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Researcher not found
 */

/**
 * @swagger
 * /api/researcher/profile:
 *   patch:
 *     summary: Sửa thông tin profile researcher hiện tại
 *     tags: [Researcher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               researcher_code:
 *                 type: string
 *               department:
 *                 type: string
 *               field_of_study:
 *                 type: string
 *               research_interests:
 *                 type: array
 *                 items:
 *                   type: string
 *               publications:
 *                 type: array
 *                 items:
 *                   type: string
 *               current_projects:
 *                 type: array
 *                 items:
 *                   type: string
 *               academic_rank:
 *                 type: string
 *                 enum: [RESEARCH_ASSISTANT, RESEARCHER, SENIOR_RESEARCHER, PRINCIPAL_RESEARCHER]
 *               years_of_experience:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Researcher profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Researcher'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Researcher not found
 */

// Lấy profile researcher hiện tại
router.get("/profile", auth, ResearcherController.getProfile);

// Sửa thông tin profile researcher
router.patch("/profile", auth, ResearcherController.updateProfile);

module.exports = router;

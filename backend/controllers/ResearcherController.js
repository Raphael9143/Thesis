const Researcher = require("../models/Researcher");
const User = require("../models/User");

const ResearcherController = {
  // Get current researcher profile
  getProfile: async (req, res) => {
    try {
      const researcherId = req.user.userId;
      const researcher = await Researcher.findByPk(researcherId);
      if (!researcher) {
        return res
          .status(404)
          .json({ success: false, message: "Researcher not found!" });
      }
      // Also include fields from auth/profile (user fields)
      const user = await User.findByPk(researcherId, {
        attributes: { exclude: ["password"] },
      });
      const merged = user
        ? { ...user.get({ plain: true }), ...researcher.get({ plain: true }) }
        : researcher.get({ plain: true });

      res.json({ success: true, data: merged });
    } catch (error) {
      console.error("Get researcher profile error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // Update current researcher profile
  updateProfile: async (req, res) => {
    try {
      const researcherId = req.user.userId;
      const {
        department,
        field_of_study,
        description,
        reference_links,
      } = req.body;

      const researcher = await Researcher.findByPk(researcherId);
      if (!researcher) {
        return res
          .status(404)
          .json({ success: false, message: "Researcher not found!" });
      }

      // Update allowed fields
      if (department !== undefined) researcher.department = department;
      if (field_of_study !== undefined)
        researcher.field_of_study = field_of_study;
      if (description !== undefined) researcher.description = description;
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
          researcher.reference_links = reference_links;
        } else {
          return res.status(400).json({
            success: false,
            message: "reference_links must be an array",
          });
        }
      }

      await researcher.save();
      res.json({
        success: true,
        message: "Researcher profile updated!",
        data: researcher,
      });
    } catch (error) {
      console.error("Update researcher profile error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
};

module.exports = ResearcherController;

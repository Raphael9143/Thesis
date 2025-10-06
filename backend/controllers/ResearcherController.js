const User = require('../models/User');
const Researcher = require('../models/Researcher');

const ResearcherController = {
    // Lấy thông tin profile researcher hiện tại
    getProfile: async (req, res) => {
        try {
            const researcherId = req.user.userId;
            const researcher = await Researcher.findByPk(researcherId);
            if (!researcher) {
                return res.status(404).json({ success: false, message: 'Researcher not found!' });
            }
            res.json({ success: true, data: researcher });
        } catch (error) {
            console.error('Get researcher profile error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Sửa thông tin profile researcher hiện tại
    updateProfile: async (req, res) => {
        try {
            const researcherId = req.user.userId;
            const { researcher_code, department, field_of_study, research_interests, publications, current_projects, academic_rank, years_of_experience } = req.body;
            
            const researcher = await Researcher.findByPk(researcherId);
            if (!researcher) {
                return res.status(404).json({ success: false, message: 'Researcher not found!' });
            }
            
            // Cập nhật các trường cho phép
            if (researcher_code !== undefined) researcher.researcher_code = researcher_code;
            if (department !== undefined) researcher.department = department;
            if (field_of_study !== undefined) researcher.field_of_study = field_of_study;
            if (research_interests !== undefined) researcher.research_interests = research_interests;
            if (publications !== undefined) researcher.publications = publications;
            if (current_projects !== undefined) researcher.current_projects = current_projects;
            if (academic_rank !== undefined) researcher.academic_rank = academic_rank;
            if (years_of_experience !== undefined) researcher.years_of_experience = years_of_experience;
            
            await researcher.save();
            res.json({ success: true, message: 'Researcher profile updated!', data: researcher });
        } catch (error) {
            console.error('Update researcher profile error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = ResearcherController;
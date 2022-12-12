const router = require('express').Router();
const { protect } = require('../../middleware/authMiddleware');
// /api/project

const {
    getProjects,
    getSingleProject,
    updateProject,
    deleteProject,
    getProjectDate,
    createProject
} = require('../../controllers/projectController');

// Project Routes
router.route('/projects').get(protect, getProjects).post(protect, createProject);
router.route('/projects/date').get(protect, getProjectDate);
router.route('/projects/:id').get(protect, getSingleProject).delete(protect, deleteProject).put(protect, updateProject);

module.exports = router;
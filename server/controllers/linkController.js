const { ObjectId } = require('mongoose').Types;
const { Link } = require('../models');
const asyncHandler = require('express-async-handler')

// Get all projects
const getProjects = asyncHandler(async (req, res) => {
    const project = await Project.find({ user: req.user.id })

    res.status(200).json(project)
})
// Get a single projects
const getSingleProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
    // Check for user
    if (!req.user) {
        res.status(401)
        throw new Error('User not found')
    }
    // Make sure the logged in user matches
    if (project.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('User not authorized')
    }
    Project.findOne({ _id: req.params.id })
        .select('-__v')
        .then((project) =>
            !project
                ? res.status(404).json({ message: 'No project with that ID' })
                : res.json(project)
        )
        .catch((err) => res.status(500).json(err));
})
const getProjectDate = asyncHandler(async (req, res) => {
    Project.find({ createdAt: req.body.createdAt })
        .then((project) => res.json(project))
        .catch((err) => res.status(500).json(err));
})
// create a new projects
const createProject = asyncHandler(async (req, res) => {
    // Check for user
    if (!req.user) {
        res.status(401)
        throw new Error('User not found')
    }

    if (!req.body.boulderingOrSportClimbing || !req.body.totalAttempts || !req.body.indoorOutdoor || !req.body.sendProject || !req.body.totalSessions) {
        res.status(400)
        throw new Error('Please add the needed fields')
    }
    // boulderingActualGrade: '',
    // boulderingFeltGrade: '',
    // sportClimbingActualGrade: '',
    // sportClimbingFeltGrade: '',
    const project = await Project.create({
        boulderingOrSportClimbing: req.body.boulderingOrSportClimbing,
        boulderingActualGrade: req.body.boulderingActualGrade,
        boulderingFeltGrade: req.body.boulderingFeltGrade,
        sportClimbingActualGrade: req.body.sportClimbingActualGrade,
        sportClimbingFeltGrade: req.body.sportClimbingFeltGrade,
        notes: req.body.notes,
        indoorOutdoor: req.body.indoorOutdoor,
        sportClimbing: req.body.sportClimbing,
        bouldering: req.body.bouldering,
        sendProject: req.body.sendProject,
        totalSessions: req.body.totalSessions,
        totalAttempts: req.body.totalAttempts,
        videoOrImg: req.body.videoOrImg,
        createdAt: req.body.createdAt,
        user: req.user.id,
    })

    const updatedUser = await User.findByIdAndUpdate(
        { _id: req.user.id },
        { $addToSet: { projects: project } },
        { runValidators: true, new: true }
    );

    res.status(200).json(updatedUser)
    // res.status(200).json(project)
})
// update a projects
const updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
    // Check for user
    if (!req.user) {
        res.status(401)
        throw new Error('User not found')
    }
    // Make sure the logged in user matches
    if (project.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('User not authorized')
    }
    Project.findOneAndUpdate(
        { _id: req.params.id },
        { $set: req.body },
        { runValidators: true, new: true }
    )
        .then((project) =>
            !project
                ? res.status(404).json({ message: 'No project with this id!' })
                : res.json(project)
        )
        .catch((err) => res.status(500).json(err));
})
// Delete a projects
const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
    // Check for user
    if (!req.user) {
        res.status(401)
        throw new Error('User not found')
    }
    // Make sure the logged in user matches
    if (project.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('User not authorized')
    }
    Project.findOneAndDelete({ _id: req.params.id })
        .then(() => res.json({ message: 'Project deleted!' }))
        .catch((err) => res.status(500).json(err));
    const updatedUser = await User.findByIdAndUpdate(
        { _id: req.user.id },
        { $pull: { projects: req.params.id } },
        { runValidators: true, new: true }
    );
    // res.status(200).json(updatedUser)
})


module.exports = {
    getProjects,
    getSingleProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectDate
};

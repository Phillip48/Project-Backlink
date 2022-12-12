import axios from 'axios'

const API_URL = '/api/project/'

// Create new project
const createProject = async (projectData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const response = await axios.post(API_URL + 'projects', projectData, config)

  return response.data
}

// Get user projects
const getProjects = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const response = await axios.get(API_URL + 'projects', config)

  return response.data
}

// Delete user project
const deleteProject = async (projectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  console.log(projectId)
  const response = await axios.delete(API_URL + 'projects/' + projectId, config)

  return response.data
}

// Update projects
const updateProject = async (projectId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  let projectIdReal = projectId.projectId

  const response = await axios.put(API_URL + 'projects/' + projectIdReal, projectId, config)

  return response.data
}

const projectService = {
  createProject,
  getProjects,
  deleteProject,
  updateProject
}

export default projectService

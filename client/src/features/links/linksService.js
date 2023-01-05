import axios from "axios";

const API_URL = "/api/crawler/";

// upload - to upload csv and crawl

// Create new project
const crawlSite = async (linksData) => {
  console.log("csvFile", linksData.inputFile);
  const response = await axios({
    method: "post",
    headers: {
      "Content-Type": "multipart/form-data"
   },
    url: "/api/crawler/upload",
    data: { linksData },
  });
  console.log("response data line 11", response);
  return response.data;
};

// Get user projects
const getLinks = async () => {
  const response = await axios.get(API_URL + "links");

  return response.data;
};

// Delete user project
const deleteProject = async (projectId, token) => {
  console.log(projectId);
  const response = await axios.delete(API_URL + "links/" + projectId);

  return response.data;
};

// Update projects
// const updateProject = async (projectId, token) => {
//   const config = {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   }
//   let projectIdReal = projectId.projectId

//   const response = await axios.put(API_URL + 'projects/' + projectIdReal, projectId, config)

//   return response.data
// }

const linksService = {
  crawlSite,
  getLinks,
  deleteProject,
  // updateProject
};

export default linksService;

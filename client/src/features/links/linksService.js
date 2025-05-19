import axios from "axios";

const API_URL = "/api/get-link/";

const crawlSite = async (formData) => {
  const headers = {
    "Content-Type": "multipart/form-data",
  };
  const response = await axios
    .post("/api/crawler/upload", formData, headers)
    // crawlHeadingsController / upload
    .then((res) => {
      console.log(res);
      return res;
    });
  return response;
};

const crawlSiteHeadingsCSV = async (formData) => {
  const headers = {
    "Content-Type": "multipart/form-data",
  };
  const response = await axios
    .post("/api/crawler/upload2", formData, headers)
    // crawlHeadingsController / upload
    .then((res) => {
      console.log(res);
      return res;
    });
  return response;
};
const crawlSiteHeadingsURL = async (formData) => {
  const headers = {
    "Content-Type": "multipart/form-data",
  };
  const response = await axios
    .post("/api/crawler/upload3", formData, headers)
    // crawlHeadingsController / upload
    .then((res) => {
      console.log(res);
      return res;
    });
  return response;
};
// const gscCrawl = async (formData) => {
//   const headers = {
//     "Content-Type": "multipart/form-data",
//   };
//   const response = await axios
//     .post("/api/crawler/gsc", formData, headers)
//     .then((res) => {
//       console.log(res);
//     });
//   return response;
// };

const getLinks = async () => {
  const response = await axios.get(API_URL + "links");
  
  return response.data;
};

const getSingleLink = async (clientID) => {
  console.log('link id in links service', clientID);
  const response =  await axios.get(API_URL + "links/" + clientID);
  return response.data;
};


const recheckLinks = async () => {
  const response = await axios.get("/api/crawler/recheck");
  return response.data;
};

const linksService = {
  crawlSite,
  crawlSiteHeadingsURL,
  crawlSiteHeadingsCSV,
  getLinks,
  getSingleLink,
  // gscCrawl,
  recheckLinks
};

export default linksService;

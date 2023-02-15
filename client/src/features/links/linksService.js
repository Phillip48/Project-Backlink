import axios from "axios";

const API_URL = "/api/get-link/";

const crawlSite = async (formData) => {
  const headers = {
    "Content-Type": "multipart/form-data",
  };
  const response = await axios
    .post("/api/crawler/upload", formData, headers)
    .then((res) => {
      console.log(res);
    });
  return response.data;
};
const gscCrawl = async (formData) => {
  const headers = {
    "Content-Type": "multipart/form-data",
  };
  const response = await axios
    .post("/api/crawler/gsc", formData, headers)
    .then((res) => {
      console.log(res);
    });
  return response;
};

const getLinks = async () => {
  const response = await axios.get(API_URL + "links");
  
  return response.data;
};


const recheckLinks = async () => {
  const response = await axios.get("/api/crawler/recheck");
  return response.data;
};

const linksService = {
  crawlSite,
  getLinks,
  gscCrawl,
  recheckLinks
};

export default linksService;

import axios from "axios";

const gscCrawl = async (formData) => {
  const headers = {
    "Content-Type": "multipart/form-data",
  };
  const response = await axios
    .post("/api/crawler/gsc", formData, headers)
    .then((res) => {
      console.log(res);
      return res;
    });
  // console.log('response', response)
  return response;
};


const linksService = {
  gscCrawl
};

export default linksService;

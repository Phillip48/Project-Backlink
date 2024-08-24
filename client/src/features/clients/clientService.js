import axios from "axios";

const API_URL = "/api/get-client/";

// const crawlSite = async (formData) => {
//   const headers = {
//     "Content-Type": "multipart/form-data",
//   };
//   const response = await axios
//     .post("/api/crawler/upload", formData, headers)
//     .then((res) => {
//       console.log(res);
//       return res;
//     });
//   return response;
// };

const getClient = async () => {
  const response = await axios.get(API_URL + "client");

  return response.data;
};

const createClient = async (clientData) => {
  console.log("clientservice", clientData);
  const headers = {
    "Content-Type": "multipart/form-data",
  };
  const response = await axios
    .post("/api/get-client/client-create", clientData, headers)
    .then((res) => {
      console.log(res);
      return res;
    });
  return response;
  // console.log('clientservice', req);
  // const clientData = {
  //     clientName : req.clientName,
  //     clientWebsite : req.clientWebsite,
  // };
  // const response = await axios.post(API_URL + "client-create", clientData);

  // return response.data;
};

const clientService = {
  //   crawlSite,
  getClient,
  createClient,
};

export default clientService;

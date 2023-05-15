const asyncHandler = require("express-async-handler");
const Crawler = require("crawler");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const request = require("request");
const proxy_checker = require("proxy-check");
const { performance } = require("perf_hooks");
const fs = require("fs");
const { parse } = require("csv-parse");
const DBLINK = require("../models/Link");
const uploadFile = require("../middleware/upload");
const multer = require("multer");
const http = require("http");
const https = require("https");
const HttpsProxyAgent = require('https-proxy-agent');
const { RateLimit } = require("async-sema");
const limiter = RateLimit(1);

// Call functions needed to add to the db
const { createLink } = require("../controllers/linkController");
const { setMaxListeners } = require("events");

// ===================================== Important ===================================== //
const maxArrayLength = 5; // Sets the number of list items in array you see in the terminal; Could be "null" to see all of them
const fetchRateLimiting = 1000; // Rate limiting on the status code fetch in milliseconds
const timeBetweenDifferentCrawls = 2000; // Time between links in csv crawled
// ===================================================================================== //
let crawledLinksCount = 0;
// Host URL and URL Protocol
let urlProtocol;
let hostUrl;
let rawHostUrl;
let pathURL;
let crawlingURL;
// Array for links read from the CSV
const csvLinks = [];
// Arrays for the links and status resposne
let crawledLinks = [];
let formattedLinks = [];
const linkStatus = [];
let sitemapList = [];
let FinalSitemapList = [];

// For the proxygenerator
let proxyHost;
let proxyPort;

// Date format
const date = new Date();
let year = date.getFullYear();
let month = date.getMonth() + 1;
let day = date.getDate();
let format = month + "/" + day + "/" + year;

// ================================== Code =================================================== //
//  Step : Uploads the csv file and renames it so its alwasy the same. Then reads the file and pulls the link

const upload = async (req, res) => {
  try {
    await uploadFile(req, res);
    fileName = req.file;
    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    } else {
      res.status(200).json("File uploading and being crawled");
    }
    // rename file so it's always the same // Was in a timeout - removed timeout
    fs.rename(
      `${__basedir}/resources/static/assets/uploads/${req.file.originalname}`,
      `${__basedir}/resources/static/assets/uploads/crawlcsv.csv`,
      (err) => {
        if (err) throw err;
        console.log("\nFile Renamed!\n");
      }
    );
    // Read the csv file and get the links
    setTimeout(async function () {
      fs.createReadStream(
        __basedir + `/resources/static/assets/uploads/crawlcsv.csv`
      )
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
          firstLinks = [...row].shift();
          firstLinks.trim();
          csvLinks.push(firstLinks);
        })
        .on("error", function (error) {
          console.log(error.message);
        })
        .on("end", function () {
          console.log("Links from reader:", csvLinks);
          console.log("CSV scan finished");
          statusCheck(csvLinks);
        });
    }, 1000);
  } catch (err) {
    console.log(err);
    res.sendStatus(500).send({
      message: `Could not upload the file. ${err}`,
    });
  }
}

// Step : Checking the repsonse status of the link
const statusCheck = async (array) => {
  console.log("---    Status Check...    ---");
  let index = 0;
  console.log("Status check array length", array.length);
  // Websockets
  const httpAgent = new http.Agent({ keepalive: true });
  const httpsAgent = new https.Agent({ keepAlive: true });
  httpAgent.maxSockets = 5;
  httpsAgent.maxSockets = 5;
  const schemeHeader = (_parsedURL) => {
    _parsedURL.protocol == "http:" ? httpAgent : httpsAgent
  }
  const agent = (_parsedURL) =>
    _parsedURL.protocol == "http:" ? httpAgent : httpsAgent;
  const proxyAgent = new HttpsProxyAgent(`http://${proxyHost}:${proxyPort}`);
  // Callback function
  const runningArray = async (array) => {
    await array.forEach(async (linkCrawled, i) => {
      await limiter();
      const startTime = performance.now();
      let newLinkCrawled = linkCrawled;
      // How long you want the delay to be, measured in milliseconds.
      setTimeout(async () => {
        fetch(newLinkCrawled, {
          method: "GET",
          agent,
          credentials: "include",
          headers: {
            "User-Agent":
              // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36:",
              // "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
              // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
          },
          // keepalive: true,
          host: rawHostUrl,
          path: pathURL,
        })
          .then((response) => {
            // If 403 rerun with proxy 
            if (response.status > 399 && response.status < 500) {
              console.log("Client Error", response.status);
              fetch(newLinkCrawled, {
                method: "GET",
                // proxyAgent,
                proxy: 'http://localhost:3001/',
                // These headers will allow for accurate status code and not get a 403
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",                  // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
                },
                // accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.",
                // scheme: schemeHeader,
                keepalive: true,
                host: rawHostUrl,
                path: pathURL,
              }) 
              .then((response) => {
                console.log(response.status);
                linkStatus.push({
                  urlFrom: linkCrawled.URLFrom,
                  urlTo: newLinkCrawled,
                  text: linkCrawled.text,
                  linkStatus: response.status,
                  statusText: response.statusText,
                  linkFollow: linkCrawled.linkFollow,
                });
                index++;
              })
              .catch((error) => {
                console.log("---    Fetch retry failed    ---");
                console.log("Error:", error);
                // Pushing the bad link to the array because it was still pulled from the page and marking it as a bad link
                linkStatus.push({
                  URLFrom: linkCrawled.URLFrom,
                  urlTo: newLinkCrawled,
                  text: linkCrawled.text,
                  linkStatus: "Error on this link",
                  statusText: "Error on this link",
                  linkFollow: linkCrawled.linkFollow,
                });
                index++;
                console.log("---    Continuing the check    ---");
              });
            } else {
              linkStatus.push({
                urlFrom: linkCrawled.URLFrom,
                urlTo: newLinkCrawled,
                text: linkCrawled.text,
                linkStatus: response.status,
                statusText: response.statusText,
                linkFollow: linkCrawled.linkFollow,
              });
              index++;
            }
            if (array.length - 1 === index) {
              const endTime = performance.now();
              //   console.dir(linkStatus, { maxArrayLength: maxArrayLength });
              console.log(
                `Status check took ${endTime - startTime} milliseconds.`
              );
              console.log("Final array length", linkStatus.length);
              linkDB(linkStatus);
            }
          })
          // If theres an error run this code
          .catch((error) => {
            console.log("---    Error    ---");
            console.error(error);
            console.log(newLinkCrawled);
            console.log("---    Retrying the fetch    ---");
            setTimeout(async () => {
              fetch(newLinkCrawled, {
                method: "GET",
                pool: agent,
                // These headers will allow for accurate status code and not get a 403
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
                  // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
                },
                keepalive: true,
                // maxSockets: 15,
              })
                .then((response) => {
                  console.log("Retry successful");
                  console.log(newLinkCrawled);
                  console.log(response.status);
                  linkStatus.push({
                    urlFrom: linkCrawled.URLFrom,
                    urlTo: newLinkCrawled,
                    text: linkCrawled.text,
                    linkStatus: response.status,
                    statusText: response.statusText,
                    linkFollow: linkCrawled.linkFollow,
                  });

                  index++;
                  if (array.length - 1 === index) {
                    const endTime = performance.now();
                    console.dir(linkStatus, { maxArrayLength: maxArrayLength });
                    console.log(
                      `Status check took ${endTime - startTime} milliseconds.`
                    );
                    console.log("Final array length", linkStatus.length);
                    linkDB(linkStatus);
                  }
                  console.log("---    Continuing the check    ---");
                })
                .catch((error) => {
                  console.log("---    Fetch retry failed    ---");
                  console.log("Error:", error);
                  // Removes from the array so when it does the 2 fetch it wont get the same error
                  array.splice(
                    array.findIndex((error) => error.link === newLinkCrawled),
                    1
                  );
                  // Pushing the bad link to the array because it was still pulled from the page and marking it as a bad link
                  linkStatus.push({
                    URLFrom: linkCrawled.URLFrom,
                    urlTo: newLinkCrawled,
                    text: linkCrawled.text,
                    linkStatus: "Error on this link",
                    statusText: "Error on this link",
                    linkFollow: linkCrawled.linkFollow,
                  });
                  index++;
                  console.log("---    Continuing the check    ---");
                });
            }, 0);
            if (array.length - 1 === index) {
              //   console.dir("Final Array", linkStatus, {
              //     maxArrayLength: maxArrayLength});
              const endTime = performance.now();
              console.log(
                `Status check took ${endTime - startTime} milliseconds.`
              );
              console.log("Final array length", linkStatus.length);
              linkDB(linkStatus);
            } else {
              // Run the fetch on the array thats being passed in again now that the error should be resolved
              runningArray(array);
            }
          });
      }, 0);
    });
  };
  runningArray(array);
};

// Step : Check to see if the DB has the link, if it does update the last checked... If it doesn't then create the link in the DB
const linkDB = async (array) => {
  console.log("---    Updating/Creating links in the Database    ---");
  let index = 0;
  array.forEach(async (link) => {
    const linkInDB = await DBLINK.findOne({ urlTo: link.urlTo });
    if (!linkInDB) {
      createLink({
        urlFrom: link.urlFrom,
        urlTo: link.urlTo,
        text: link.text,
        linkStatus: link.linkStatus,
        statusText: link.statusText,
        linkFollow: link.linkFollow,
        dateFound: format,
        dateLastChecked: format,
      });
      index++;
    } else {
      await DBLINK.findOneAndUpdate(
        { urlTo: link.urlTo },
        { $set: { dateLastChecked: format } },
        { runValidators: true, new: true }
      );
      index++;
    }
    if (array.length - 1 === index) {
      console.log("-------------------------------------------");
      console.log("Done with the Database");
      return;
    }
  });
};

module.exports = {
  CSVCrawlLink,
  upload,
};

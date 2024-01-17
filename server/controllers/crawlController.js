const asyncHandler = require("express-async-handler");
const Crawler = require("crawler");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const request = require("request");
const proxy_checker = require("proxy-check");
const fs = require("fs");
const { parse } = require("csv-parse");
const DBLINK = require("../models/Link");
const uploadFile = require("../middleware/upload");
const http = require("http");
const https = require("https");
const HttpsProxyAgent = require("https-proxy-agent");
const axios = require("axios");

// Call functions needed to add to the db
const { createLink } = require("../controllers/linkController");
const { setMaxListeners } = require("events");

// ===================================== Important ===================================== //
const maxArrayLength = 5; // Sets the number of list items in array you see in the terminal; Could be "null" to see all of them
const fetchRateLimiting = 1000; // Rate limiting on the status code fetch in milliseconds
const timeBetweenDifferentCrawls = 2000; // Time between links in csv crawled
// ===================================================================================== //
let crawledLinksCount = 0;
let csvCount = 0;
let initalCrawlCount = 0;

// Host URL and URL Protocol
let urlProtocol;
let hostUrl;
let rawHostUrl;
let pathURL;
let crawlingURL;

// Array for links read from the CSV
const csvLinks = [];
const csvWriteLinks = [];
const newURLCSVLinks = [];
const nonClientLinks = [];

// Arrays for the links and status resposne
let crawledLinks = [];

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
// ============== Important functions ============== //
// JS Promise to delay however many senconds you put
const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};
// URL Checker
const isValidUrl = (urlString) => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};
// JS Promise to database upload create -> Might not really need since we are making a CSV file with the links
const dbPromise = (linkCrawled) => {
  return new Promise(async (resolve) => {
    await sleep(1000);
    console.log(
      "URL TO ->",
      linkCrawled.urlTo,
      "URL FROM ->",
      linkCrawled.urlFrom
    );
    const linkInDB = await DBLINK.findOne({
      urlTo: linkCrawled.urlTo,
      urlFrom: linkCrawled.urlFrom,
    });
    if (!linkInDB) {
      createLink(linkCrawled), resolve;
      // console.log("Creating Link"), resolve;
    } else {
      // console.log({ urlTo: linkCrawled.urlTo, urlFrom: linkCrawled.urlFrom });
      // { urlFrom: linkCrawled.urlFrom },
      await DBLINK.findOneAndUpdate(
        { urlTo: linkCrawled.urlTo },
        { $set: { dateLastChecked: format } },
        { runValidators: true, new: true }
      ),
        resolve;
      // console.log("Updating Link"), resolve;
    }
  });
};
// JS Promise to se if the link is one of our internal sites or client sites
const backLinkPromise = (urlFrom, link, linkRel, linkText) => {
  return new Promise(async (resolve) => {
    // code
    if (
      link === undefined ||
      link == undefined ||
      link === null ||
      link == null ||
      link.startsWith("#")
    ) {
      resolve;
    }
    if (isValidUrl(link)) {
      link.toString();
      if (link.hostname) {
        link = link.hostname.replace("www.", "");
        link.toString();
        // console.log(link);
      }
      if (
        link.includes("samndan.com") ||
        link.includes("https://samndan.com") ||
        link.includes("omaralawgroup.com") ||
        link.includes("https://omaralawgroup.com") ||
        link.includes("birthinjurycenter.org/") ||
        link.includes("https://birthinjurycenter.org/") ||
        link.includes("veternsguide.org") ||
        link.includes("https://veternsguide.org") ||
        link.includes("steinlawoffices.com") ||
        link.includes("https://steinlawoffices.com") ||
        link.includes("levinperconti.com") ||
        link.includes("https://levinperconti.com") ||
        link.includes("cordiscosaile.com") ||
        link.includes("https://cordiscosaile.com") ||
        link.includes("advologix.com") ||
        link.includes("https://advologix.com") ||
        link.includes("wvpersonalinjury.com") ||
        link.includes("https://wvpersonalinjury.com") ||
        link.includes("nstlaw.com") ||
        link.includes("https://nstlaw.com") ||
        link.includes("brownandcrouppen.com") ||
        link.includes("https://brownandcrouppen.com") ||
        link.includes("cutterlaw.com") ||
        link.includes("https://cutterlaw.com") ||
        link.includes("lanierlawfirm.com") ||
        link.includes("http://lanierlawfirm.com") ||
        link.includes("nursinghomeabuse.org") ||
        link.includes("https://nursinghomeabuse.org") ||
        link.includes("helpingsurvivors.org") ||
        link.includes("https://helpingsurvivors.org") ||
        link.includes("socialmediavictims.org") ||
        link.includes("https://socialmediavictims.org") ||
        link.includes("m-n-law.com") ||
        link.includes("https://m-n-law.com")
      ) {
        console.log(link);
        console.log(urlFrom);
        if (linkRel == "follow" || linkRel == "nofollow") {
          anchorObj = {
            URLFrom: urlFrom,
            link: link,
            text: linkText,
            linkFollow: linkRel,
            // dateFound: currentDate
          };
          crawledLinks.push(anchorObj), resolve;
        } else {
          anchorObj = {
            URLFrom: urlFrom,
            link: link,
            text: linkText,
            linkFollow: "No link Rel",
            // dateFound: currentDate
          };
          crawledLinks.push(anchorObj), resolve;
        }
      } else {
        nonClientLinks.push({
          URLFrom: urlFrom,
          urlTo: "Nothing was found on this link",
          text: "N/A",
          linkFollow: "N/A",
          linkStatus: "N/A",
          statusText: "N/A",
          linkFollow: "N/A",
        }),
          resolve;
        // console.log('link removed', link);
      }
    } else {
      resolve;
    }
  });
};

// Send data to client side with 10 ms inbetween so its not too much data sent and\
// you dont get a range error

// ================================================= //

// Inital crawl to get anchor tags with href attr
const CSVCrawlLink = asyncHandler(async (req, response) => {
  // Step : Gets links from CSV file
  try {
    await uploadFile(req, response);
    fileName = req.file;
    if (req.file == undefined) {
      return response.status(400).send({ message: "Please upload a file!" });
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
          setTimeout(async function () {
            await sleep(4000);
            // proxyGenerator();
            crawlerInstance.queue(csvLinks);
          }, 1000);
        });
    }, 1000);
  } catch (err) {
    console.log(err);
    response.sendStatus(500).send({
      message: `Could not upload the file. ${err}`,
    });
  }
  const httpAgent = new http.Agent({ keepalive: true });
  const httpsAgent = new https.Agent({ keepAlive: true });
  httpAgent.maxSockets = 5;
  httpsAgent.maxSockets = 5;
  const agent = (_parsedURL) =>
    _parsedURL.protocol == "http:" ? httpAgent : httpsAgent;
  // Step : Create an instance of a new crawler
  const crawlerInstance = new Crawler({
    headers: {
      // The User-Agent request header passes information related to the identification of application type, operating system, software, and its version, and allows for data target to decide what type of HTML layout to use in response i.e. mobile, tablet, or pc.
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
      // The Accept-Language request header passes information indicating to a web server which languages the client understands, and which particular language is preferred when the web server sends the response back.
      "Accept-Language": "en-gb",
      // The Accept request header falls into a content negotiation category, and its purpose is to notify the web server on what type of data format can be returned to the client.
      Accept: "test/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      // The Referer request header provides the previous web page’s address before the request is sent to the web server.
      // Referer: "http://www.google.com/",
      method: "GET",
      credentials: "include",
      agent: "http:" ? httpAgent : httpsAgent,
    },
    // jQuery: true,
    // family: 4,
    retries: 0, // The crawlers internal code will retry -> I don't think it ends up working the 2 time.
    rateLimit: 2000, // `maxConnections` will be forced to 1 - rateLimit is the minimum time gap between two tasks
    maxConnections: 1, // maxConnections is the maximum number of tasks that can be running at the same time

    // Will be called for each crawled page
    callback: (error, res, done) => {
      if (error) {
        initalCrawlCount++;
        sleep(1000);
        linkRel = "Couldnt get rel attr due to website error";
        linkText = "Couldnt get text due to website error";
        csvWriteLinks.push({
          urlFrom: res.options.uri,
          // urlTo: `Error: ${error.stack}`,
          urlTo: `Error:`,
          text: linkText,
          linkStatus: "Error",
          statusText: "Error",
          linkFollow: "Error",
        });
        console.log("\u001b[1;31m Conditonal Error", error.stack);
        console.log("Continuing");
        if (csvLinks.length == initalCrawlCount) {
          if (crawledLinks.length === 0) {
            console.log("No links found");
            response.status(200).json("No links");
            return;
          } else {
            statusCheckV2(crawledLinks, response);
          }
        }
        done();
      } else {
        csvCount++;
        initalCrawlCount++;
        if (
          res.request === null ||
          res.$ === null ||
          res.$ === undefined ||
          res === null ||
          res === undefined ||
          res.request === undefined
        ) {
          console.log(`\u001b[1;31m Protocol undefined ->`, res.options.uri);
          csvWriteLinks.push({
            urlFrom: res.options.uri,
            linkRel: "Error protocol undefined",
            linkText: "Error protocol undefined",
          });
          done();
        }
        // =========================================================1 //
        numberOn = csvCount;
        numberTo = csvLinks.length;
        let progressUpdater
        progressUpdater = `${numberOn} / ${numberTo}`;
        console.log('CC',progressUpdater);
        const socketEventUpdate = require('../middleware/socketsMiddleware');
        socketEventUpdate(progressUpdater);
        // ========================================================= //
        if (res.statusCode == 200) {
          console.log("\u001b[1;32m Status code: 200 ->", res.options.uri);
        } else if (res.statusCode == 404 || res.statusCode == 403) {
          console.log(
            `\u001b[1;31m Status code: ${res.statusCode} ->`,
            res.options.uri
          );
        } else {
          console.log(
            `\u001b[1;31m Status code: ${res.statusCode} ->`,
            res.options.uri
          );
        }
        // Looking for href in the HTML
        const $ = res.$;
        if ($) {
          const anchorTag = $("a");
          anchorTag.each(async function () {
            // For the link
            let link = $(this).attr("href");
            // To see things link follow, no follow etc...
            let linkText = $(this).text();
            linkText.trim();
            let linkRel = $(this).attr("rel");
            // Checking text to see if there are any line breaks with the anchor text and trims whitespace
            if (
              // linkText.toString().startsWith("\n") ||
              // linkText.toString().endsWith("\n") ||
              linkText.toString().includes("\n") ||
              linkText.toString().includes("\r")
              // linkText.toString().startsWith("\r") ||
              // linkText.toString().endsWith("\r")
            ) {
              linkText = linkText.replace(/[\r\n\t]/gm, "");
              linkText = linkText.trim();
            }
            if (link == undefined || link == null) {
              // console.log("undefined link removed", link);
              done();
            }
            let urlFrom = res.options.uri;
            await backLinkPromise(urlFrom, link, linkRel, linkText);
            await sleep(1000);
          });
          console.log("-------------------------------------------");
          if (csvLinks.length == initalCrawlCount) {
            if (crawledLinks.length == 0) {
              console.log("No links found");
              response.status(200).json("No links found");
              return;
            } else {
              statusCheckV2(crawledLinks, response);
              // response.status(200).json("File uploading and being crawled");
            }
          }
          done();
        } else {
          console.log("error -> $");
          done();
        }
      }
    },
  });
});

const statusCheckV2 = async (array, response) => {
  console.log("---    Status Check...    ---");
  console.log("Status check array length", array.length);
  // console.log("Array", array);

  // Websockets
  const httpAgent = new http.Agent({ keepalive: true });
  const httpsAgent = new https.Agent({ keepAlive: true });
  httpAgent.maxSockets = 5;
  httpsAgent.maxSockets = 5;
  const schemeHeader = (_parsedURL) => {
    _parsedURL.protocol == "http:" ? httpAgent : httpsAgent;
  };
  const agent = (_parsedURL) =>
    _parsedURL.protocol == "http:" ? httpAgent : httpsAgent;
  const proxyAgent = new HttpsProxyAgent(`http://${proxyHost}:${proxyPort}`);
  // Callback function
  let dbCounter = 0;
  const runningArrayV2 = async (array) => {
    for (
      let forEachCounter = 0;
      forEachCounter <= array.length;
      forEachCounter++
    ) {
      await sleep(5000);
      // =========================================================1 //
      numberOn = forEachCounter;
      numberTo = array.length;
      let progressUpdater
      module.exports = progressUpdater = `${numberOn} / ${numberTo}`;
      console.log('CC',progressUpdater);
      // const wss = require("../server");
      // wss.send("Sending progress data", progressUpdater);;
      // console.log('wss', wss);
      // ========================================================= //
      let linkCrawled = array;
      let newLinkCrawled = array;
      if (array.length === forEachCounter) {
        console.log(
          forEachCounter,
          "forEachCounter",
          dbCounter,
          "Final dbCounter",
          array.length,
          "array length",
          "- Done -"
        );
        console.log(csvWriteLinks);
        response.status(200).send(JSON.stringify(csvWriteLinks));
        // const finalNonClientLinks = nonClientLinks.filter(
        //   (thing, index, self) =>
        //     index === self.findIndex((t) => t.URLFrom === thing.URLFrom)
        // );
        // console.log(finalNonClientLinks);
        // const finalArray = csvWriteLinks.concat(finalNonClientLinks);
      }
      if (array.length !== forEachCounter) {
        // if (newLinkCrawled[forEachCounter] === undefined) {
        //   // Removes from the array so when it does the 2 fetch it wont get the same error
        //   array.splice(
        //     array.findIndex(
        //       (newLinkCrawled) => newLinkCrawled[forEachCounter] === newLinkCrawled[forEachCounter].link
        //     ),
        //     1
        //   );
        //   console.log("Removed undefined");
        // }
        // Makes sure url is proper before crawling
        if (newLinkCrawled[forEachCounter].link.startsWith("mailto:")) {
          console.log("mailto not valid", newLinkCrawled[forEachCounter].link);
          // array.split(
          //   array.findIndex(
          //     (error) => error.link === newLinkCrawled[forEachCounter].link
          //   ),
          //   1
          // );
        }
        if (isValidUrl(newLinkCrawled[forEachCounter].link) == false) {
          console.log("failed url check", linkCrawled[forEachCounter].URLFrom);
          let dbPromiseObject = {
            urlFrom: linkCrawled[forEachCounter].URLFrom,
            urlTo: newLinkCrawled[forEachCounter].link,
            text: newLinkCrawled[forEachCounter].text,
            linkStatus: "Not a valid link!!!!",
            statusText: "Not a valid link!!!!",
            linkFollow: newLinkCrawled[forEachCounter].linkFollow,
          };
          dbCounter++;
          csvWriteLinks.push(dbPromiseObject);
          await dbPromise(dbPromiseObject);
        }
        console.log(forEachCounter, "forEachCounter");
        fetch(newLinkCrawled[forEachCounter].link, {
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
          .then(async (response) => {
            let dbPromiseObject = {
              urlFrom: linkCrawled[forEachCounter].URLFrom,
              urlTo: newLinkCrawled[forEachCounter].link,
              text: newLinkCrawled[forEachCounter].text,
              linkStatus: response.status,
              statusText: response.statusText,
              linkFollow: newLinkCrawled[forEachCounter].linkFollow,
            };
            // console.log(dbPromiseObject);
            dbCounter++;
            csvWriteLinks.push(dbPromiseObject);
            await dbPromise(dbPromiseObject);
          })
          // If theres an error run this code
          .catch(async (error) => {
            console.log("---    Error    ---");
            console.error(error);
            console.log("link", newLinkCrawled[forEachCounter].link);
            console.log("---    Retrying the fetch    ---");
            fetch(newLinkCrawled[forEachCounter].link, {
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
              .then(async (response) => {
                console.log("Retry successful");
                console.log(newLinkCrawled[forEachCounter].link);
                console.log(response.status);
                let dbPromiseObject = {
                  urlFrom: linkCrawled[forEachCounter].URLFrom,
                  urlTo: newLinkCrawled[forEachCounter].link,
                  text: newLinkCrawled[forEachCounter].text,
                  linkStatus: response.status,
                  statusText: response.statusText,
                  linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                };
                // console.log(dbPromiseObject);

                dbCounter++;
                csvWriteLinks.push(dbPromiseObject);
                await dbPromise(dbPromiseObject);
                // const linkInDB = await DBLINK.findOne({
                //   urlTo: newLinkCrawled[forEachCounter].link,
                // });
                // if (!linkInDB) {
                //   await createLink({
                //     urlFrom: linkCrawled[forEachCounter].URLFrom,
                //     urlTo: newLinkCrawled[forEachCounter].link,
                //     text: newLinkCrawled[forEachCounter].text,
                //     linkStatus: response.status,
                //     statusText: response.statusText,
                //     linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                //   });
                //   dbCounter++;
                //   console.log("Creating Link");
                // } else {
                //   await DBLINK.findOneAndUpdate(
                //     { urlTo: newLinkCrawled[forEachCounter].urlTo },
                //     { $set: { dateLastChecked: format } },
                //     { runValidators: true, new: true }
                //   );
                //   dbCounter++;
                //   console.log("Updating Link");
                // }
                console.log("---    Continuing the check    ---");
              })
              .catch(async (error) => {
                console.log("---    Fetch retry failed    ---");
                console.log(
                  "Error:",
                  error,
                  "link ->",
                  newLinkCrawled[forEachCounter].link
                );
                // Pushing the bad link to the array because it was still pulled from the page and marking it as a bad link
                // linkStatus.push({
                //   URLFrom: newLinkCrawled[forEachCounter].URLFrom,
                //   urlTo: newLinkCrawled[forEachCounter].link,
                //   text: newLinkCrawled[forEachCounter].text,
                //   linkStatus: "Error on this link",
                //   statusText: "Error on this link",
                //   linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                // });
                let newURLFrom = linkCrawled[forEachCounter].URLFrom;
                if (newURLFrom !== undefined) {
                  console.log("line 574", newURLFrom);
                  let dbPromiseObject = {
                    URLFrom: newURLFrom,
                    urlTo: newLinkCrawled[forEachCounter].link,
                    text: newLinkCrawled[forEachCounter].text,
                    linkStatus: "Error on this link",
                    statusText: "Error on this link",
                    linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                  };
                  // console.log(dbPromiseObject);

                  dbCounter++;
                  csvWriteLinks.push(dbPromiseObject);
                  await dbPromise(dbPromiseObject);
                } else {
                  console.log("line 587", newURLFrom);
                  let dbPromiseObject = {
                    URLFrom: `${
                      newURLFrom === undefined ? "Undefined" : newURLFrom
                    }`,
                    urlTo: newLinkCrawled[forEachCounter].link,
                    text: newLinkCrawled[forEachCounter].text,
                    linkStatus: "Error on this link",
                    statusText: "Error on this link",
                    linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                  };
                  dbCounter++;
                  csvWriteLinks.push(dbPromiseObject);
                  await dbPromise(dbPromiseObject);
                }
                console.log("---    Continuing the check    ---");
              });
          });
      }
      // continue;
    }
  };
  runningArrayV2(array);
};

module.exports = {
  CSVCrawlLink,
  // upload,
};

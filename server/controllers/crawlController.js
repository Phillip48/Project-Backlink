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
const HttpsProxyAgent = require("https-proxy-agent");
const axios = require("axios");

// Call functions needed to add to the db
const { createLink } = require("../controllers/linkController");
const { convertArrayToCSV } = require("convert-array-to-csv");
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
const csvLinksAfterCheck = [];
const csvWriteLinks = [];
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
// ============== Important functions ============== //
// JS Promise to delay
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
// JS Promise to database upload create
const dbPromise = (linkCrawled) => {
  return new Promise(async (resolve) => {
    const linkInDB = await DBLINK.findOne({
      urlTo: linkCrawled.urlTo,
      urlFrom: linkCrawled.urlFrom,
    });
    if (!linkInDB) {
      createLink(linkCrawled);
      console.log("Creating Link"), resolve;
    } else {
      // console.log({ urlTo: linkCrawled.urlTo, urlFrom: linkCrawled.urlFrom });
      // { urlFrom: linkCrawled.urlFrom },
      await DBLINK.findOneAndUpdate(
        { urlTo: linkCrawled.urlTo },
        { $set: { dateLastChecked: format } },
        { runValidators: true, new: true }
      );
      console.log("Updating Link"), resolve;
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
      // if(link.startsWith("mailto:")){
      //   console.log('mailto not valid', link);
      //   link = null;
      //   resolve;
      // }
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
        // console.log(link);
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
        // console.log('link removed', link);
        resolve;
      }
    } else {
      // console.log('url is not vaild'),
      resolve;
    }
  });
};
// ================================================= //
// Upload csv file
const upload = async (req, res) => {};

// Inital crawl to get anchor tags with href attr
const CSVCrawlLink = asyncHandler(async (req, response) => {
  // Step : calls the crawl as soon as the function is called
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
            await sleep(3000);
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
      Referer: "http://www.google.com/",
    },
    // jQuery: true,
    // family: 4,
    retries: 1, // The crawlers internal code will retry
    rateLimit: 1000, // `maxConnections` will be forced to 1 - rateLimit is the minimum time gap between two tasks
    maxConnections: 2, // maxConnections is the maximum number of tasks that can be running at the same time

    // Will be called for each crawled page
    callback: (error, res, done) => {
      if (error) {
        initalCrawlCount++;
        sleep(1000);
        // let link = error;
        linkRel = "Couldnt get rel attr due to website error";
        linkText = "Couldnt get text due to website error";
        csvWriteLinks.push({
          urlFrom: res.options.uri,
          linkRel: linkRel,
          linkText: linkText,
        });
        // console.error("---    Error    ---", error);
        console.error("Conditonal Error", error.stack);
        console.log("Continuing");
        if (csvLinks.length == initalCrawlCount) {
          // console.log("Working last part of csvlink function");
          if (crawledLinks.length == 0) {
            console.log("No links found");
            response.status(200).json("No links");
            return;
          } else {
            statusCheckV2(crawledLinks, response);
            // response.status(200).json("File uploading and being crawled");
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
        console.log("---    Working...    ---");
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
              linkText.toString().startsWith("\n") ||
              linkText.toString().endsWith("\n") ||
              linkText.toString().startsWith("\r") ||
              linkText.toString().endsWith("\r")
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

// const initalMultipeCrawl = async() => {
//   fetchData(url).then((res) => {
//     const html = res.data;
//     const $ = cheerio.load(html);
//     if (
//       res.request === null ||
//       res.$ === null ||
//       res.$ === undefined ||
//       res.request === undefined
//     ) {
//       console.log(`\u001b[1;31m Protocol undefined ->`, res.options.uri);
//       // console.log(res, res.options.uri);
//       csvWriteLinks.push({
//         urlFrom: res.options.uri,
//         linkRel: "Error protocol undefined",
//         linkText: "Error protocol undefined",
//       });
//       done();
//     }
//     // hostUrl = res.request.req.protocol + "//" + res.request.host;
//     // rawHostUrl = res.request.host;
//     // urlProtocol = res.request.req.protocol;
//     // pathURL = res.request.path;
//     // crawlingURL = hostUrl + pathURL;
//     console.log("---    Working...    ---");
//     // console.log("Crawling URL:", crawlingURL);
//     if (res.statusCode == 200) {
//       console.log("\u001b[1;32m Status code: 200 ->", res.options.uri);
//     } else if (res.statusCode == 404 || res.statusCode == 403) {
//       console.log(
//         `\u001b[1;31m Status code: ${res.statusCode} ->`,
//         res.options.uri
//       );
//     } else {
//       console.log(
//         `\u001b[1;31m Status code: ${res.statusCode} ->`,
//         res.options.uri
//       );
//     }
//     // console.log("URL Protocol:", urlProtocol);
//     // console.log("Host URL:", hostUrl);
//     // console.log("Raw Host:", rawHostUrl);
//     // console.log("URL Path:", pathURL);
//     // Looking for href in the HTML
//     const anchorTag = $("a");
//     anchorTag.each(async function () {
//       // For the link
//       let link = $(this).attr("href");
//       // To see things link follow, no follow etc...
//       let linkText = $(this).text();
//       linkText.trim();
//       let linkRel = $(this).attr("rel");
//       // console.log('link', link);
//       // Checking text to see if there are any line breaks with the anchor text and trims whitespace
//       if (linkText.toString().startsWith("\n") || inkText.toString().endsWith("\n") || linkText.toString().startsWith("\r") || linkText.toString().endsWith("\r")) {
//         linkText = linkText.replace(/[\r\n\t]/gm, "");
//         linkText = linkText.trim();
//       }
//       if (link == undefined || link == null) {
//         // console.log("undefined link removed", link);
//         return;
//       }
//       let urlFrom = res.options.uri;
//       await backLinkPromise(urlFrom, link, linkRel, linkText);
//       await sleep(1000);
//     });
//     console.log("-------------------------------------------");
//   });
// }

// Checks the status of the link
const statusCheckV2 = async (array, response) => {
  console.log("---    Status Check...    ---");
  console.log("Status check array length", array.length);
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
      await sleep(2000);
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
        response.status(200).send(JSON.stringify(csvWriteLinks));

        // const headers = [
        //   "urlFrom",
        //   "urlTo",
        //   "text",
        //   "linkStatus",
        //   "statusText",
        //   "linkFollow",
        // ];
        // const csvFromArrayOfObjects = convertArrayToCSV(csvWriteLinks, {
        //   headers,
        //   seperator: ",",
        // });

        // fs.writeFile("output.csv", csvFromArrayOfObjects, (err) => {
        //   if (err) {
        //     console.log(err);
        //   }
        //   console.log("Created CSV File");
        // });

        // response.status(200).json("File uploading and being crawled", csvFile);
        // response.status(200).send(csvFromArrayOfObjects.toString());
        // const csv = file2CSV(csvWriteLinks, { fields: headers});
        //
        // response.status(200).send(csvWriteLinks);
      }

      if (array.length !== forEachCounter) {
        console.log(forEachCounter, newLinkCrawled[forEachCounter].link);
        // Makes sure url is proper before crawling
        if (newLinkCrawled[forEachCounter].link.startsWith("mailto:")) {
          console.log("mailto not valid", newLinkCrawled[forEachCounter].link);
          array.splice(
            array.findIndex(
              (error) => error.link === newLinkCrawled[forEachCounter].link
            ),
            1
          );
        }
        if (isValidUrl(newLinkCrawled[forEachCounter].link) == false) {
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
          // const linkInDB = await DBLINK.findOne({
          //   urlTo: newLinkCrawled[forEachCounter].link,
          // });
          // if (!linkInDB) {
          //   await createLink({
          //     urlFrom: linkCrawled[forEachCounter].URLFrom,
          //     urlTo: newLinkCrawled[forEachCounter].link,
          //     text: newLinkCrawled[forEachCounter].text,
          //     linkStatus: 'Not a valid link!!!!',
          //     statusText: 'Not a valid link!!!!',
          //     linkFollow: newLinkCrawled[forEachCounter].linkFollow,
          //   });
          //   dbCounter++;
          //   console.log("Creating non valid link", newLinkCrawled[forEachCounter].link);
          // } else {
          //   await DBLINK.findOneAndUpdate(
          //     { urlTo: newLinkCrawled[forEachCounter].urlTo },
          //     { $set: { dateLastChecked: format } },
          //     { runValidators: true, new: true }
          //   );
          //   dbCounter++;
          //   console.log("Updating non valid link", newLinkCrawled[forEachCounter].link);
          //   // Removes from the array so when it does the 2 fetch it wont get the same error
          //   array.splice(
          //     array.findIndex(
          //       (error) =>
          //         error.link === newLinkCrawled[forEachCounter].link
          //     ),
          //     1
          //   );
          // }
        }
        // console.log(forEachCounter, "forEachCounter");
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
            // If 403 rerun with proxy
            if (response.status > 399 && response.status < 500) {
              console.log("Client Error", response.status);
              console.log("Fetching 2");
              fetch(newLinkCrawled[forEachCounter].link, {
                method: "GET",
                // proxyAgent,
                proxy: "http://localhost:3001/",
                // These headers will allow for accurate status code and not get a 403
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36", // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
                },
                // accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.",
                // scheme: schemeHeader,
                keepalive: true,
                host: rawHostUrl,
                path: pathURL,
              })
                .then(async (response) => {
                  console.log(
                    linkCrawled[forEachCounter].URLFrom,
                    response.status
                  );
                  let dbPromiseObject = {
                    urlFrom: linkCrawled[forEachCounter].URLFrom,
                    urlTo: newLinkCrawled[forEachCounter].link,
                    text: newLinkCrawled[forEachCounter].text,
                    linkStatus: response.status,
                    statusText: response.statusText,
                    linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                  };
                  dbCounter++;
                  csvWriteLinks.push(dbPromiseObject);
                  await dbPromise(dbPromiseObject);
                })
                .catch(async (error) => {
                  console.log("---    Fetch retry failed    ---");
                  console.log("Error:", error);
                  let dbPromiseObject = {
                    URLFrom: linkCrawled[forEachCounter].URLFrom,
                    urlTo: newLinkCrawled[forEachCounter].link,
                    text: newLinkCrawled[forEachCounter].text,
                    linkStatus: "Error on this link",
                    statusText: "Error on this link",
                    linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                  };
                  dbCounter++;
                  csvWriteLinks.push(dbPromiseObject);
                  await dbPromise(dbPromiseObject);
                  console.log("---    Continuing the check    ---");
                });
            } else {
              let dbPromiseObject = {
                urlFrom: linkCrawled[forEachCounter].URLFrom,
                urlTo: newLinkCrawled[forEachCounter].link,
                text: newLinkCrawled[forEachCounter].text,
                linkStatus: response.status,
                statusText: response.statusText,
                linkFollow: newLinkCrawled[forEachCounter].linkFollow,
              };
              dbCounter++;
              csvWriteLinks.push(dbPromiseObject);
              await dbPromise(dbPromiseObject);
            }
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
                // linkStatus.push({
                //   urlFrom: linkCrawled[forEachCounter].URLFrom,
                //   urlTo: newLinkCrawled[forEachCounter].link,
                //   text: newLinkCrawled[forEachCounter].text,
                //   linkStatus: response.status,
                //   statusText: response.statusText,
                //   linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                // });
                let dbPromiseObject = {
                  urlFrom: linkCrawled[forEachCounter].URLFrom,
                  urlTo: newLinkCrawled[forEachCounter].link,
                  text: newLinkCrawled[forEachCounter].text,
                  linkStatus: response.status,
                  statusText: response.statusText,
                  linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                };
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
                // Removes from the array so when it does the 2 fetch it wont get the same error
                array.splice(
                  array.findIndex(
                    (error) =>
                      error.link === newLinkCrawled[forEachCounter].link
                  ),
                  1
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
                let dbPromiseObject = {
                  URLFrom: linkCrawled[forEachCounter].URLFrom,
                  urlTo: newLinkCrawled[forEachCounter].link,
                  text: newLinkCrawled[forEachCounter].text,
                  linkStatus: "Error on this link",
                  statusText: "Error on this link",
                  linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                };
                dbCounter++;
                csvWriteLinks.push(dbPromiseObject);
                await dbPromise(dbPromiseObject);
                console.log("---    Continuing the check    ---");
              });
          });
      }
      continue;
    }
  };
  runningArrayV2(array);
};

// const linkDB = async (array) => {
//   console.log("---    Updating/Creating links in the Database    ---");
//   let index = 0;
//   console.log(array.length);
//   // console.log(array);
//   await array.forEach(async (link) => {
//     await sleep(1000);
//     const linkInDB = await DBLINK.findOne({ urlTo: link.urlTo });
//     if (!linkInDB) {
//       createLink({
//         urlFrom: link.urlFrom,
//         urlTo: link.urlTo,
//         text: link.text,
//         linkStatus: link.linkStatus,
//         statusText: link.statusText,
//         linkFollow: link.linkFollow,
//         dateFound: format,
//         dateLastChecked: format,
//       });
//       index += 1;
//     } else {
//       await DBLINK.findOneAndUpdate(
//         { urlTo: link.urlTo },
//         { $set: { dateLastChecked: format } },
//         { runValidators: true, new: true }
//       );
//       index++;
//     }
//     if (array.length - 1 === index) {
//       console.log("-------------------------------------------");
//       console.log("Done with the Database");
//       return;
//     }
//   });
// };

// Step : Checking the repsonse status of the link
// const statusCheck = async (array) => {
//   console.log("---    Status Check...    ---");
//   console.log("Status check array length", array.length);
//   // Websockets
//   const httpAgent = new http.Agent({ keepalive: true });
//   const httpsAgent = new https.Agent({ keepAlive: true });
//   httpAgent.maxSockets = 5;
//   httpsAgent.maxSockets = 5;
//   const schemeHeader = (_parsedURL) => {
//     _parsedURL.protocol == "http:" ? httpAgent : httpsAgent;
//   };
//   const agent = (_parsedURL) =>
//     _parsedURL.protocol == "http:" ? httpAgent : httpsAgent;
//   const proxyAgent = new HttpsProxyAgent(`http://${proxyHost}:${proxyPort}`);
//   // Callback function
//   const runningArray = async (array) => {
//     let forEachCounter = 0;
//     await array.forEach(async (linkCrawled) => {
//       // await limiter();
//       console.log(forEachCounter, "forEachCounter - link ->", linkCrawled.link);
//       let newLinkCrawled = linkCrawled.link;
//       if (array.length - 1 == forEachCounter) {
//         console.log(forEachCounter, "forEachCounter");
//         console.log(array.length);
//         console.log("Final array length", linkStatus.length);
//         linkDB(linkStatus);
//       }
//       // How long you want the delay to be, measured in milliseconds.
//       setTimeout(async () => {
//         fetch(newLinkCrawled, {
//           method: "GET",
//           agent,
//           credentials: "include",
//           headers: {
//             "User-Agent":
//               // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36:",
//               // "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
//               // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
//               "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
//           },
//           // keepalive: true,
//           host: rawHostUrl,
//           path: pathURL,
//         })
//           .then((response) => {
//             // If 403 rerun with proxy
//             if (response.status > 399 && response.status < 500) {
//               console.log("Client Error", response.status);
//               fetch(newLinkCrawled, {
//                 method: "GET",
//                 // proxyAgent,
//                 proxy: "http://localhost:3001/",
//                 // These headers will allow for accurate status code and not get a 403
//                 headers: {
//                   "User-Agent":
//                     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36", // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
//                 },
//                 // accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.",
//                 // scheme: schemeHeader,
//                 keepalive: true,
//                 host: rawHostUrl,
//                 path: pathURL,
//               })
//                 .then((response) => {
//                   console.log(linkCrawled.URLFrom, response.status);
//                   linkStatus.push({
//                     urlFrom: linkCrawled.URLFrom,
//                     urlTo: newLinkCrawled,
//                     text: linkCrawled.text,
//                     linkStatus: response.status,
//                     statusText: response.statusText,
//                     linkFollow: linkCrawled.linkFollow,
//                   });
//                   forEachCounter++;
//                 })
//                 .catch((error) => {
//                   console.log("---    Fetch retry failed    ---");
//                   console.log("Error:", error);
//                   // Pushing the bad link to the array because it was still pulled from the page and marking it as a bad link
//                   linkStatus.push({
//                     URLFrom: linkCrawled.URLFrom,
//                     urlTo: newLinkCrawled,
//                     text: linkCrawled.text,
//                     linkStatus: "Error on this link",
//                     statusText: "Error on this link",
//                     linkFollow: linkCrawled.linkFollow,
//                   });
//                   forEachCounter++;
//                   console.log("---    Continuing the check    ---");
//                 });
//             } else {
//               linkStatus.push({
//                 urlFrom: linkCrawled.URLFrom,
//                 urlTo: newLinkCrawled,
//                 text: linkCrawled.text,
//                 linkStatus: response.status,
//                 statusText: response.statusText,
//                 linkFollow: linkCrawled.linkFollow,
//               });
//               // console.log(linkCrawled.urlTo, response.status);
//               forEachCounter++;
//             }
//           })
//           // If theres an error run this code
//           .catch((error) => {
//             console.log("---    Error    ---");
//             console.error(error);
//             console.log(newLinkCrawled);
//             console.log("---    Retrying the fetch    ---");
//             setTimeout(async () => {
//               fetch(newLinkCrawled, {
//                 method: "GET",
//                 pool: agent,
//                 // These headers will allow for accurate status code and not get a 403
//                 headers: {
//                   "User-Agent":
//                     "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
//                   // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
//                 },
//                 keepalive: true,
//                 // maxSockets: 15,
//               })
//                 .then((response) => {
//                   console.log("Retry successful");
//                   console.log(newLinkCrawled);
//                   console.log(response.status);
//                   linkStatus.push({
//                     urlFrom: linkCrawled.URLFrom,
//                     urlTo: newLinkCrawled,
//                     text: linkCrawled.text,
//                     linkStatus: response.status,
//                     statusText: response.statusText,
//                     linkFollow: linkCrawled.linkFollow,
//                   });

//                   forEachCounter++;
//                   console.log("---    Continuing the check    ---");
//                 })
//                 .catch((error) => {
//                   console.log("---    Fetch retry failed    ---");
//                   console.log("Error:", error);
//                   // Removes from the array so when it does the 2 fetch it wont get the same error
//                   array.splice(
//                     array.findIndex((error) => error.link === newLinkCrawled),
//                     1
//                   );
//                   // Pushing the bad link to the array because it was still pulled from the page and marking it as a bad link
//                   linkStatus.push({
//                     URLFrom: linkCrawled.URLFrom,
//                     urlTo: newLinkCrawled,
//                     text: linkCrawled.text,
//                     linkStatus: "Error on this link",
//                     statusText: "Error on this link",
//                     linkFollow: linkCrawled.linkFollow,
//                   });
//                   forEachCounter++;
//                   console.log("---    Continuing the check    ---");
//                 });
//             }, 1000);
//           });
//       }, 1000);
//     });
//   };
//   runningArray(array);
// };

// Step : Check to see if the DB has the link, if it does update the last checked... If it doesn't then create the link in the DB
//

module.exports = {
  CSVCrawlLink,
  upload,
};

// Step : Converts incomplete links to make them have its domain if it doens't already.
// For Each link that starts with / (Because it needs a doamin to check its status). We are going to pull it from the array, add the domain to it and push it to a new array
// We are doing various checks to see what we are getting back... We want to make sure we are getting relative or absolute URL's
// const linkConverter = async (array) => {
//   console.log("---    Converting Links...    ---");
//   let forEachCount = 0;

//   await array.forEach((linkCrawled) => {
//     let newLinkCrawled = linkCrawled.link;
//     // newLinkCrawled.trim();
//     // console.log(newLinkCrawled);
//     if (
//       array.length - 1 == forEachCount ||
//       (array.length - 1 == forEachCount &&
//         crawledLinks.length - 1 == crawledLinksCount)
//     ) {
//       console.dir(formattedLinks, { maxArrayLength: 200 });
//       statusCheckV2(formattedLinks);
//       return;
//     }
//     if (
//       newLinkCrawled === undefined ||
//       newLinkCrawled.startsWith("#") ||
//       !newLinkCrawled ||
//       newLinkCrawled.trim() == 0
//     ) {
//       console.log("link removed", newLinkCrawled);
//       forEachCount++;
//     } else if (newLinkCrawled && newLinkCrawled.startsWith("//")) {
//       let pulledLink = newLinkCrawled;
//       pulledLink = urlProtocol + pulledLink;
//       formattedLinks.push({
//         URLFrom: linkCrawled.URLFrom,
//         link: pulledLink,
//         text: linkCrawled.text,
//         linkFollow: linkCrawled.linkFollow,
//       });
//       forEachCount++;
//       // console.log(pulledLink);
//     } else if (
//       newLinkCrawled &&
//       newLinkCrawled.startsWith("/") &&
//       !newLinkCrawled.startsWith("/www")
//     ) {
//       let pulledLink = newLinkCrawled;
//       pulledLink = hostUrl + pulledLink;
//       formattedLinks.push({
//         URLFrom: linkCrawled.URLFrom,
//         link: pulledLink,
//         text: linkCrawled.text,
//         linkFollow: linkCrawled.linkFollow,
//       });
//       forEachCount++;
//       // console.log(pulledLink);
//     } else {
//       formattedLinks.push({
//         URLFrom: linkCrawled.URLFrom,
//         link: newLinkCrawled,
//         text: linkCrawled.text,
//         linkFollow: linkCrawled.linkFollow,
//       });
//       forEachCount++;
//       // console.log(newLinkCrawled.link);
//     }
//   });
// };

// if(isValidUrl(newLinkCrawled)){
//   let domain = (newLinkCrawled.toString());
//   if(domain.hostname){
//     domain = domain.hostname.replace('www.','');
//   }
//   // console.log(domain);
//   if(domain.toString() ===
//     "nstlaw.com" ||
//     "cutterlaw.com" ||
//     "lanierlawfirm.com" ||
//     "nursinghomeabuse.com)" ||
//     "birthinjurycenter.com" ||
//     "helpingsurvivors.com"||
//     "samndan.com" ||
//     "m-n-law.com" ||
//     'brownandcrouppen.com' ||
//     "omara.com" ||
//     "veternsguide.com" ||
//     "stein.com" ||
//     "cordiscosaile.com" ||
//     "advologix.com" ||
//     "wvpersonalinjury.com"){
//       formattedLinks.push({
//         URLFrom: linkCrawled.URLFrom,
//         link: newLinkCrawled,
//         text: linkCrawled.text,
//         linkFollow: linkCrawled.linkFollow,
//       });
//       console.log({
//         URLFrom: linkCrawled.URLFrom,
//         link: newLinkCrawled,
//         text: linkCrawled.text,
//         linkFollow: linkCrawled.linkFollow,
//       })
//   } else {
//     console.log('link removed', newLinkCrawled)
//     forEachCount++;
//   }
// }

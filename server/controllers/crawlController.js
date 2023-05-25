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
// const { RateLimit } = require("async-sema");
// const limiter = RateLimit(1);

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
      urlTo: linkCrawled.urlTo, urlFrom: linkCrawled.urlFrom
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
const backLinkPromise = (link, linkRel, linkText) => {
  return new Promise(async (resolve) => {
    // code
    // link !== undefined && 
    if (link.hostname) {
      link = link.hostname.replace("www.", "");
      console.log('link hostname',link);
    }
    if (
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
      link.includes("https://m-n-law.com") ||
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
      link.includes("https://nstlaw.com")
    ) {
      console.log(link);
      if (linkRel == "follow" || linkRel == "nofollow") {
        anchorObj = {
          URLFrom: crawlingURL,
          link: link,
          text: linkText,
          linkFollow: linkRel,
          // dateFound: currentDate
        };
        rawLinkCount++;
        crawledLinks.push(anchorObj), resolve;
      } else {
        anchorObj = {
          URLFrom: crawlingURL,
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
  });
};
// ================================================= //
// Upload csv file
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
          CSVCrawlLink();
        });
    }, 1000);
  } catch (err) {
    console.log(err);
    res.sendStatus(500).send({
      message: `Could not upload the file. ${err}`,
    });
  }
};
// Inital crawl to get anchor tags with href attr
const CSVCrawlLink = asyncHandler(async () => {
  // Step : calls the crawl as soon as the function is called
  setTimeout(async function () {
    await sleep(3000);
    // proxyGenerator();
    crawlerInstance.queue(csvLinks);
  }, 1000);

  // Step : Called to get a free proxy
  const proxyGenerator = () => {
    // Establishing the variables
    let ip_addresses = [];
    let port_numbers = [];
    let random_number;

    // Uses request and cheerio to pull the free proxies from the link and randomzies the port and proxy so when you crawl it doesn't hit the same website from the same ip address
    request("https://sslproxies.org/", function (error, response, html) {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);

        $("td:nth-child(5)").each(function (index, value) {
          if ($(this).text().includes("elite")) {
            $("td:nth-child(1)").each(function (index, value) {
              ip_addresses[index] = $(this).text();
            });

            $("td:nth-child(2)").each(function (index, value) {
              port_numbers[index] = $(this).text();
            });
          }
        });
      } else {
        console.log("Error loading proxy, please try again", error);
      }

      ip_addresses.join(", ");
      port_numbers.join(", ");

      random_number = Math.floor(Math.random() * 8);

      proxyRotation = `http://${ip_addresses[random_number]}:${port_numbers[random_number]}`;
      proxyHost = ip_addresses[random_number];
      proxyPort = port_numbers[random_number];

      const proxyCheck = {
        host: ip_addresses[random_number],
        port: port_numbers[random_number],
        // proxyAuth: "y0adXjeO:pAzAHCr4",
      };

      console.log("Checking Proxy", proxyCheck);

      proxy_checker(proxyCheck)
        .then((res) => {
          console.log("Good Proxy", res); // true
          // setTimeout(function () {
          // console.log(csvLinks);
          // csvLinks.forEach((link) => {
          //   crawlerInstance.queue({
          //     uri: link,
          //     proxy: proxyRotation,
          //   });
          // });
          // }, 0);
          crawlerInstance.queue(csvLinks);
        })
        .catch((error) => {
          console.error("error", error); // ECONNRESET
          proxyGenerator();
        });
    });
  };

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
    // retries: 0, // The crawlers internal code will not retry but custom code will
    rateLimit: 3000, // `maxConnections` will be forced to 1 - rateLimit is the minimum time gap between two tasks
    maxConnections: 1, // maxConnections is the maximum number of tasks that can be running at the same time

    // Will be called for each crawled page
    callback: (error, res, done) => {
      if (error) {
        console.log("---    Error    ---", error);
        // proxyGenerator();
      } else {
        csvCount++;
        initalCrawlCount++;
        hostUrl = res.request.req.protocol + "//" + res.request.host;
        rawHostUrl = res.request.host;
        urlProtocol = res.request.req.protocol;
        pathURL = res.request.path;
        crawlingURL = hostUrl + pathURL;
        console.log("---    Working...    ---");
        console.log("Crawling URL:", crawlingURL);
        if(res.statusCode == 200){ 
          console.log("\u001b[1;32m Status code: 200 ->", crawlingURL);
          
        }
        if(res.statusCode == 404){ 
          console.log("\u001b[1;31m Status code: 404 ->", crawlingURL);
          
        }
        if(res.statusCode == 403){ 
          console.log("\u001b[1;31m Status code: 403 ->", crawlingURL);
          
        }
        // console.log("URL Protocol:", urlProtocol);
        // console.log("Host URL:", hostUrl);
        // console.log("Raw Host:", rawHostUrl);
        // console.log("URL Path:", pathURL);
        // Looking for href in the HTML
        const $ = res.$;
        const anchorTag = $("a");
        anchorTag.each(async function () {
          // For the link
          let link = $(this).attr("href");
          // To see things link follow, no follow etc...
          let linkText = $(this).text();
          let linkRel = $(this).attr("rel");
          // console.log('link', link);
          // Checking text to see if there are any line breaks with the anchor text and trims whitespace
          if (
            linkText.toString().startsWith("\n") ||
            linkText.toString().endsWith("\n")
          ) {
            linkText = linkText.replace(/[\r\n\t]/gm, "");
            linkText = linkText.trim();
          }
          if (link == undefined || link == null) {
            // console.log("undefined link removed", link);
            return
          }
          await backLinkPromise(link, linkRel, linkText);
          await sleep(1000);
        });
        console.log("-------------------------------------------");
        if (csvLinks.length == initalCrawlCount) {
          // console.log("Working last part of csvlink function");
          if(crawledLinks.length == 0){
            console.log('No links found');
            return;
          } else{
            statusCheckV2(crawledLinks);
          }
        }
        // Passes array into function to convert it. Then takes the formatted links array and checks the link status putting it into an object
        // After StatusCheck is done it will check the DB to see if the links in the array are in there. If its not create the link in the array.
      }
      // linkConverter(crawledLinks);
      done();
    },
  });
});

// Step : Converts incomplete links to make them have its domain if it doens't already.
// For Each link that starts with / (Because it needs a doamin to check its status). We are going to pull it from the array, add the domain to it and push it to a new array
// We are doing various checks to see what we are getting back... We want to make sure we are getting relative or absolute URL's
const linkConverter = async (array) => {
  console.log("---    Converting Links...    ---");
  let forEachCount = 0;

  await array.forEach((linkCrawled) => {
    let newLinkCrawled = linkCrawled.link;
    // newLinkCrawled.trim();
    // console.log(newLinkCrawled);
    if (
      array.length - 1 == forEachCount ||
      (array.length - 1 == forEachCount &&
        crawledLinks.length - 1 == crawledLinksCount)
    ) {
      console.dir(formattedLinks, { maxArrayLength: 200 });
      statusCheckV2(formattedLinks);
      return;
    }
    if (
      newLinkCrawled === undefined ||
      newLinkCrawled.startsWith("#") ||
      !newLinkCrawled ||
      newLinkCrawled.trim() == 0
    ) {
      console.log("link removed", newLinkCrawled);
      forEachCount++;
    } else if (newLinkCrawled && newLinkCrawled.startsWith("//")) {
      let pulledLink = newLinkCrawled;
      pulledLink = urlProtocol + pulledLink;
      formattedLinks.push({
        URLFrom: linkCrawled.URLFrom,
        link: pulledLink,
        text: linkCrawled.text,
        linkFollow: linkCrawled.linkFollow,
      });
      forEachCount++;
      // console.log(pulledLink);
    } else if (
      newLinkCrawled &&
      newLinkCrawled.startsWith("/") &&
      !newLinkCrawled.startsWith("/www")
    ) {
      let pulledLink = newLinkCrawled;
      pulledLink = hostUrl + pulledLink;
      formattedLinks.push({
        URLFrom: linkCrawled.URLFrom,
        link: pulledLink,
        text: linkCrawled.text,
        linkFollow: linkCrawled.linkFollow,
      });
      forEachCount++;
      // console.log(pulledLink);
    } else {
      formattedLinks.push({
        URLFrom: linkCrawled.URLFrom,
        link: newLinkCrawled,
        text: linkCrawled.text,
        linkFollow: linkCrawled.linkFollow,
      });
      forEachCount++;
      // console.log(newLinkCrawled.link);
    }
  });
};

// Checks the status of the link
const statusCheckV2 = async (array) => {
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
      // const linkInDB = await DBLINK.findOne({
      //   urlTo: newLinkCrawled[forEachCounter].link,
      // });
      if (array.length === forEachCounter) {
        console.log(
          forEachCounter,
          "forEachCounter",
          array.length,
          "array length"
        );
        // console.log("Final length of status check array", linkStatus.length);
        console.log("Final dbCounter++;", dbCounter);
        // linkDB(linkStatus);
        console.log("Links updated");
        // return;
      }

      if (array.length !== forEachCounter) {
        console.log(forEachCounter, newLinkCrawled[forEachCounter].link);
        // Makes sure url is proper before crawling
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
                })
                .catch(async (error) => {
                  console.log("---    Fetch retry failed    ---");
                  console.log("Error:", error);
                  // Pushing the bad link to the array because it was still pulled from the page and marking it as a bad link
                  // const linkInDB = await DBLINK.findOne({
                  //   urlTo: newLinkCrawled[forEachCounter].link,
                  // });
                  // if (!linkInDB) {
                  //   await createLink({
                  //     URLFrom: linkCrawled[forEachCounter].URLFrom,
                  //     urlTo: newLinkCrawled[forEachCounter].link,
                  //     text: newLinkCrawled[forEachCounter].text,
                  //     linkStatus: "Error on this link",
                  //     statusText: "Error on this link",
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
                  let dbPromiseObject = {
                    URLFrom: linkCrawled[forEachCounter].URLFrom,
                    urlTo: newLinkCrawled[forEachCounter].link,
                    text: newLinkCrawled[forEachCounter].text,
                    linkStatus: "Error on this link",
                    statusText: "Error on this link",
                    linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                  };
                  dbCounter++;
                  await dbPromise(dbPromiseObject);
                  // linkStatus.push({
                  //   URLFrom: linkCrawled[forEachCounter].URLFrom,
                  //   urlTo: newLinkCrawled[forEachCounter].link,
                  //   text: newLinkCrawled[forEachCounter].text,
                  //   linkStatus: "Error on this link",
                  //   statusText: "Error on this link",
                  //   linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                  // });
                  console.log("---    Continuing the check    ---");
                });
            } else {
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
                  URLFrom: newLinkCrawled[forEachCounter].URLFrom,
                  urlTo: newLinkCrawled[forEachCounter].link,
                  text: newLinkCrawled[forEachCounter].text,
                  linkStatus: "Error on this link",
                  statusText: "Error on this link",
                  linkFollow: newLinkCrawled[forEachCounter].linkFollow,
                };
                dbCounter++;
                await dbPromise(dbPromiseObject);
                // const linkInDB = await DBLINK.findOne({
                //   urlTo: newLinkCrawled[forEachCounter].link,
                // });
                // if (!linkInDB) {
                //   await createLink({
                //     URLFrom: newLinkCrawled[forEachCounter].URLFrom,
                //     urlTo: newLinkCrawled[forEachCounter].link,
                //     text: newLinkCrawled[forEachCounter].text,
                //     linkStatus: "Error on this link",
                //     statusText: "Error on this link",
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
              });
          });
      }
      continue;
    }
  };
  runningArrayV2(array);
};

const linkDB = async (array) => {
  console.log("---    Updating/Creating links in the Database    ---");
  let index = 0;
  console.log(array.length);
  // console.log(array);
  await array.forEach(async (link) => {
    await sleep(1000);
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
      index += 1;
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

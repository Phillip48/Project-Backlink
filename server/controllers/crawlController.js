const asyncHandler = require("express-async-handler");
const Crawler = require("crawler");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const request = require("request");
const proxy_checker = require("proxy-check");
const newFetch = require("fetch-retry")(fetch);
const { performance } = require("perf_hooks");
const fs = require("fs");
const { parse } = require("csv-parse");
const asyncHandler = require("express-async-handler");
const db = require("./config/connection");
const DBLINK = require("../models/Link");

// Call functions needed to add to the db
const {
  getLinks,
  createLink,
  updateLinkbyURL,
  updateLink,
} = require("../../controllers/linkController");

// ===================================== Important ===================================== //
const maxArrayLength = 70; // Sets the number of list items in array you see in the terminal; Could be "null" to see all of them
const fetchRateLimiting = 500; // Rate limiting on the status code fetch in milliseconds
const timeBetweenDifferentCrawls = 2000; // Time between links in csv crawled
// ===================================================================================== //
// Arrays for the links and status resposne
let crawledLinks = [];
let formattedLinks = [];
const linkStatus = [];
let sitemapList = [];
let FinalSitemapList = [];

// Date format
const date = new Date();
let year = date.getFullYear();
let month = date.getMonth() + 1;
let day = date.getDate();
let format = month + "/" + day + "/" + year;

const CSVCrawlLink = asyncHandler(async (req, res) => {
  // Host URL and URL Protocol
  let urlProtocol;
  let hostUrl;
  let rawHostUrl;
  let pathURL;
  let crawlingURL;
  let runProxyBoolean = req.params;

  // Step 1
  // Array for links read from the CSV
  const csvLinks = [];
  //   Code to read from csv
  console.log("CSV reader scanning");
  fs.createReadStream("./CSVCRAWLERTEST.csv")
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
      // console.log("Links from reader:", csvLinks);
      console.log("CSV scan finished");
    });

  // Step 2 if used
  // Create an instance of a new crawler
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
    rateLimit: 2000, // `maxConnections` will be forced to 1 - rateLimit is the minimum time gap between two tasks
    maxConnections: 1, // maxConnections is the maximum number of tasks that can be running at the same time

    // Will be called for each crawled page
    callback: (error, res, done) => {
      if (error) {
        console.log("---    Error    ---", error);
        console.log(
          "---    The crawler will retry and is getting a new proxy.    ---"
        );
        // proxyGenerator();
      } else {
        const startTime = performance.now();
        hostUrl = res.request.req.protocol + "//" + res.request.host;
        rawHostUrl = res.request.host;
        urlProtocol = res.request.req.protocol;
        pathURL = res.request.path;
        crawlingURL = hostUrl + pathURL;
        console.log("---    Working...    ---");
        console.log("Crawling URL:", crawlingURL);
        console.log("URL Protocol:", urlProtocol);
        console.log("Host URL:", hostUrl);
        console.log("Raw Host:", rawHostUrl);
        console.log("URL Path:", pathURL);
        // Looking for href in the HTML
        const $ = res.$;
        // ========================================================================== //
        // For crawling sitemaps... Need to work on it
        if (crawlingURL.includes("/sitemap.xml")) {
          // https://www.apple.com/sitemap.xml
          const sitemap = $("loc");
          for (let link in sitemap) {
            if (sitemap.hasOwnProperty(link)) {
              // let logs = link + sitemap[link];
              let logs2 = sitemap[link].children;
              sitemapList.push(logs2);
              let results = sitemapList.filter((element) => {
                return element !== undefined;
              });
              results.forEach((link, index) => {
                let newLink = link[0];
                if (newLink == undefined) {
                  console.log("newLink removed");
                }
                console.log(newLink);
                FinalSitemapList.push(newLink);
                FinalSitemapList = [...new Set(FinalSitemapList)];
                FinalSitemapList = FinalSitemapList.filter((element) => {
                  return element !== undefined;
                });
              });
            }
          }
        }
        // ========================================================================== //
        const anchorTag = $("a");
        anchorTag.each(function () {
          // For the link
          let link = $(this).attr("href");
          // To see things link follow, no follow etc...
          let linkText = $(this).text();
          let linkRel = $(this).attr("rel");
          let anchorObj;
          // Checking text to see if there are any line breaks with the anchor text and trims whitespace
          if (
            linkText.toString().startsWith("\n") ||
            linkText.toString().endsWith("\n")
          ) {
            linkText = linkText.replace(/[\r\n\t]/gm, "");
            linkText = linkText.trim();
          }
          if (linkRel == "follow" || linkRel == "nofollow") {
            anchorObj = {
              URLFrom: crawlingURL,
              link: link,
              text: linkText,
              linkFollow: linkRel,
              // dateFound: currentDate
            };
          } else {
            anchorObj = {
              URLFrom: crawlingURL,
              link: link,
              text: linkText,
              linkFollow: "No link Rel",
              // dateFound: currentDate
            };
          }
          crawledLinks.push(anchorObj);
        });
        const endTime = performance.now();
        console.log(
          `Inital crawl for ${hostUrl} took ${
            endTime - startTime
          } milliseconds.`
        );
        console.log("-------------------------------------------");
        // Passes array into function to convert it. Then takes the formatted links array and checks the link status putting it into an object
        linkConverter(crawledLinks);
        statusCheck(formattedLinks);
        // After StatusCheck is done it will check the DB to see if the links in the array are in there. If its not create the link in the array.
      }
      done();
    },
  });
  startsCrawler(runProxyBoolean);
});
// Step 3: Converts incomplete links to make them have its domain if it doens't already.
// For Each link that starts with / (Because it needs a doamin to check its status). We are going to pull it from the array, add the domain to it and push it to a new array
// We are doing various checks to see what we are getting back... We want to make sure we are getting relative or absolute URL's
const linkConverter = async (array) => {
  console.log("---    Converting Links...    ---");
  let forEachCount = 0;

  // Remove anything undefined from the array if there is something before the loop
  array = array.filter(function (element) {
    if (element.link == undefined) {
      console.log("Removed undefined");
    }
    return element.link !== undefined;
  });

  await array.forEach((linkCrawled) => {
    let newLinkCrawled = linkCrawled.link;

    if (array.length <= forEachCount) {
      // console.log("Total number removed:", linksRemoved);
      return;
    } else if (
      !newLinkCrawled.startsWith("/") &&
      !newLinkCrawled.startsWith("h") &&
      !newLinkCrawled.startsWith("u")
    ) {
      console.log("link removed", newLinkCrawled);
    } else if (newLinkCrawled && newLinkCrawled.startsWith("//")) {
      let pulledLink = newLinkCrawled;
      // console.log("Linked changed:", pulledLink);
      // pulledLink = newLinkCrawled.slice(2);
      pulledLink = urlProtocol + pulledLink;
      formattedLinks.push({
        URLFrom: linkCrawled.URLFrom,
        link: pulledLink,
        text: linkCrawled.text,
        linkFollow: linkCrawled.linkFollow,
        // dateFound: linkCrawled.dateFound
      });
      forEachCount++;
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
        // dateFound: linkCrawled.dateFound
      });
      forEachCount++;
    } else {
      formattedLinks.push({
        URLFrom: linkCrawled.URLFrom,
        link: newLinkCrawled,
        text: linkCrawled.text,
        linkFollow: linkCrawled.linkFollow,
        // dateFound: linkCrawled.dateFound
      });
      forEachCount++;
    }
  });
};

// Step 4: Checking the repsonse status of the link
const statusCheck = async (array) => {
  console.log("---    Status Check...    ---");
  let index = 0;
  const runningArray = async (array) => {
    // console.log("Array length", array.length);
    await array.forEach((linkCrawled, i) => {
      const startTime = performance.now();
      let newLinkCrawled = linkCrawled.link;

      // How long you want the delay to be, measured in milliseconds.
      setTimeout(function () {
        // Something you want delayed.
        // newFetch or fetch
        fetch(newLinkCrawled, {
          method: "GET",
          // These headers will allow for accurate status code and not get a 403
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
          },
          // host: hostUrl,
          host: proxyHost,
          port: proxyPort,
          // retries: 2,
          retryDelay: 3000,
        })
          .then((response) => {
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
              console.log("Final array length", linkStatus.length);
              console.log(
                `Status check took ${endTime - startTime} milliseconds.`
              );
              linkDB(linkStatus);
              // writeToJSON(linkStatus);
            }
          })
          // If theres an error run this code
          .catch((error) => {
            console.log("---    Error    ---");
            console.error(error);
            // Removes from the array so when it does the 2 fetch it wont get the same error
            array.splice(
              array.findIndex((e) => e.link === newLinkCrawled),
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
            if (array.length - 1 === index) {
              console.dir("Final Array", linkStatus, {
                maxArrayLength: maxArrayLength,
              });
              const endTime = performance.now();
              console.log("Final array length", linkStatus.length);
              console.log(
                `Status check took ${endTime - startTime} milliseconds.`
              );
              linkDB(linkStatus);
              // writeToJSON(linkStatus);
            } else {
              // Run the fetch on the array thats being passed in again now that the error should be resolved
              runningArray(array);
            }
          });
      }, i * fetchRateLimiting);
    });
  };
  runningArray(array);
};

// Step 5: Check to see if the DB has the link, if it does update the last checked... If it doesn't then create the link in the DB
const linkDB = async (array) => {
  array.forEach((link) => {
    // db.ProjectBacklinks.find({ "urlTo": { $in: [`${link.urlTo}`] } })
    if (DBLINK.find({ urlTo: link })) {
      DBLINK.findOneAndUpdate(
        { urlTo: link },
        { $set: { dateLastChecked: format } },
        { runValidators: true, new: true }
      );
      //  updateLinkbyURL({dateLastChecked: format})
    } else {
      createLink({
        urlFrom: array.urlFrom,
        urlTo: array.urlTo,
        text: array.text,
        linkStatus: array.linkStatus,
        statusText: array.statusText,
        linkFollow: array.linkFollow,
        dateFound: array.dateFound,
        dateLastChecked: array.dateLastChecked,
      });
    }
  });
};

// Called to get a free proxy
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
        setTimeout(function () {
          // console.log(csvLinks);
          csvLinks.forEach((link) => {
            crawlerInstance.queue({
              uri: link,
              proxy: proxyRotation,
            });
          });
        }, 0);
      })
      .catch((error) => {
        console.error("error", error); // ECONNRESET
        proxyGenerator();
      });
  });
};

// Determines if you use the proxyGenerator or the normal crawler
const startsCrawler = async (runProxyBoolean) => {
  if (runProxyBoolean == true) {
    proxyGenerator();
  } else {
    // This timeout allows time for the csv to be read
    setTimeout(async function () {
      crawlerInstance.queue(csvLinks);
      // }, 1500);
    }, 1500);
  }
};

module.exports = {
  CSVCrawlLink,
};
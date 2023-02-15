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

// ===================================== Important ===================================== //
const maxArrayLength = 5; // Sets the number of list items in array you see in the terminal; Could be "null" to see all of them
const fetchRateLimiting = 1000; // Rate limiting on the status code fetch in milliseconds
const timeBetweenDifferentCrawls = 2000; // Time between links in csv crawled
// ===================================================================================== //
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

// Date format
const date = new Date();
let year = date.getFullYear();
let month = date.getMonth() + 1;
let day = date.getDate();
let format = month + "/" + day + "/" + year;

const upload = async (req, res) => {
  try {
    await uploadFile(req, res);
    fileName = req.file;
    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }
    // rename file so it's always the same // Was in a timeout - removed timeout
    await fs.rename(
      `${__basedir}/resources/static/assets/uploads/${req.file.originalname}`,
      `${__basedir}/resources/static/assets/uploads/gsccrawl.csv`,
      (err) => {
        if (err) throw err;
        console.log("\nFile Renamed!\n");
      }
    );
    // Read the csv file and get the links
    await setTimeout(async function () {
      fs.createReadStream(
        __basedir + `/resources/static/assets/uploads/gsccrawl.csv`
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
        });

      const CSVCrawlLink = asyncHandler(async () => {
        console.log(csvLinks)
        let crawlerCount = 0;
        // Step : calls the crawl as soon as the function is called
        setTimeout(async function () {
          crawlerInstance.queue(csvLinks);
          // proxyGenerator();
          // }, 1500);
        }, 1000);

        // Step : Create an instance of a new crawler
        const crawlerInstance = new Crawler({
          headers: {
            // The User-Agent request header passes information related to the identification of application type, operating system, software, and its version, and allows for data target to decide what type of HTML layout to use in response i.e. mobile, tablet, or pc.
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
            // The Accept-Language request header passes information indicating to a web server which languages the client understands, and which particular language is preferred when the web server sends the response back.
            "Accept-Language": "en-gb",
            // The Accept request header falls into a content negotiation category, and its purpose is to notify the web server on what type of data format can be returned to the client.
            Accept:
              "test/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            // The Referer request header provides the previous web page’s address before the request is sent to the web server.
            //   Referer: "http://www.google.com/",
          },
          // retries: 0, // The crawlers internal code will not retry but custom code will
          rateLimit: 2000, // `maxConnections` will be forced to 1 - rateLimit is the minimum time gap between two tasks
          maxConnections: 1, // maxConnections is the maximum number of tasks that can be running at the same time

          // Will be called for each crawled page
          callback: (error, res, done) => {
            if (error) {
              console.log("---    Error    ---", error);
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
                    //   linkFollow: "No link Rel",
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
              crawlerCount ++;
              console.log("-------------------------------------------");
              if (csvLinks.length == crawlerCount) {
                linkConverter(crawledLinks);
              }
            }
            done();
          },
        });
      });
      CSVCrawlLink();
      const linkConverter = async (array) => {
        console.log("---    Converting Links...    ---");
        let forEachCount = 0;

        // Remove anything undefined from the array if there is something before the loop
        let newArray = array.filter(function (element) {
          if (element.link == undefined) {
            console.log("Removed undefined");
          }
          return element.link !== undefined;
        });
        // console.log(newArray.length);
        await newArray.forEach((linkCrawled) => {
          let newLinkCrawled = linkCrawled.link;

          if (
            newArray.length - 1 == forEachCount ||
            newArray.length == forEachCount
          ) {
            res.status(200).send(formattedLinks);
            return;
          } else if (
            !newLinkCrawled.startsWith("/") &&
            !newLinkCrawled.startsWith("h") &&
            !newLinkCrawled.startsWith("u") &&
            !newLinkCrawled.startsWith(" ")
          ) {
            console.log("link removed", newLinkCrawled);
            forEachCount++;
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
              //   linkFollow: linkCrawled.linkFollow,
              // dateFound: linkCrawled.dateFound
            });
            forEachCount++;
          }
        });
      };
    }, 1000);
  } catch (err) {
    console.log(err);
    res.sendStatus(500).send({
      message: `Could not upload the file. ${err}`,
    });
  }
};

module.exports = {
  // CSVCrawlLink,
  upload,
};

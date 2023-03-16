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

// Array for links read from the CSV
const linkComparison = [];

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
          linkComparison.push(firstLinks);
        })
        .on("error", function (error) {
          console.log(error.message);
        })
        .on("end", function () {
          console.log("Links from reader:", csvLinks);
          console.log("CSV scan finished");
        });
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

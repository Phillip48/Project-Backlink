const asyncHandler = require("express-async-handler");
const fetch = require("node-fetch");
const { performance } = require("perf_hooks");
const DBLINK = require("../models/Link");
const http = require("http");
const https = require("https");

const maxArrayLength = 5; // Sets the number of list items in array you see in the terminal; Could be "null" to see all of them
const fetchRateLimiting = 1000; // Rate limiting on the status code fetch in milliseconds
const linksFromDB = []; // Array

// Test
const recheckDB = asyncHandler(async (req, res) => {
  const linkInDB = await DBLINK.find(!linkStatus == 200);
  linkInDB.push(linksFromDB);

  await statusCheckFromDB(linksFromDB).then(() => {
    res.json("Done");
  });
});

// Step : Checking the repsonse status of the link
const statusCheckFromDB = async (array) => {
  console.log("---    Status Check...    ---");
  let index = 0;
  const httpAgent = new http.Agent({ keepalive: true });
  const httpsAgent = new https.Agent({ keepAlive: true });
  httpAgent.maxSockets = 10;
  httpsAgent.maxSockets = 10;
  const agent = (_parsedURL) =>
    _parsedURL.protocol == "http:" ? httpAgent : httpsAgent;
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
          // pool: httpAgent,
          agent,
          // These headers will allow for accurate status code and not get a 403
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
          },
          keepalive: true,
          // maxSockets: 15,
          // host: !proxyHost ? null : proxyHost,
          // port: !proxyPort ? null : proxyPort,
          host: rawHostUrl,
          path: pathURL,
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
              //   console.dir(linkStatus, { maxArrayLength: maxArrayLength });
              console.log(
                `Status check took ${endTime - startTime} milliseconds.`
              );
              console.log("Final array length", linkStatus.length);
              linkDB(linkStatus);
              // writeToJSON(linkStatus);
            }
          })
          // If theres an error run this code
          .catch((error) => {
            console.log("---    Error    ---");
            console.error(error);
            console.log("---    Retrying the fetch    ---");
            setTimeout(async function () {
              fetch(newLinkCrawled, {
                method: "GET",
                pool: httpAgent,
                // These headers will allow for accurate status code and not get a 403
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
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
            }, 3000);
            if (array.length === index) {
              //   console.dir("Final Array", linkStatus, {
              //     maxArrayLength: maxArrayLength,
              //   });
              const endTime = performance.now();
              console.log(
                `Status check took ${endTime - startTime} milliseconds.`
              );
              console.log("Final array length", linkStatus.length);
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

// Step : Check to see if the DB has the link, if it does update the last checked... If it doesn't then create the link in the DB
const linkDB = async (array) => {
  console.log("---    Updating/Creating links in the Database    ---");
  let index = 0;
  array.forEach(async (link) => {
    // const linkInDB = await DBLINK.findOne({ urlTo: link.urlTo });
    // Link is grabbed from db so it has to be in there
    await DBLINK.findOneAndUpdate(
      { urlTo: link.urlTo },
      { $set: { statusCheck: link.statusCheck } },
      { $set: { dateLastChecked: format } },
      { runValidators: true, new: true }
    );
    index++;
    if (array.length - 1 === index) {
      console.log("-------------------------------------------");
      console.log("Done with the Database");
      return;
    }
  });
};

module.exports = {
  recheckDB,
};
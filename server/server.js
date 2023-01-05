const express = require("express");
const path = require("path");
const db = require("./config/connection");
const bodyParser = require("body-parser");
const routes = require("./routes");
require("dotenv").config();

const PORT = process.env.PORT || 3001;
const app = express();

global.__basedir = __dirname;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(routes);

app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "../", "client", "build", "index.html"))
);

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../client/build")));

//   app.get("*", (req, res) =>
//     res.sendFile(
//       path.resolve(__dirname, "../", "client", "build", "index.html")
//     )
//   );
// }

app.use(function (req, res) {
  res.status(404).send({ url: req.originalUrl + " not found" });
});

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/build/index.html"))
);

db.once("open", () => {
  app.listen(PORT, () => {
    console.log("-------------------------------------------");
    console.log(`API server running on port ${PORT}!`);
  });
});

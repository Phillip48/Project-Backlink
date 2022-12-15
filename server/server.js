const express = require("express");
const path = require("path");
const db = require("./config/connection");
const bodyParser = require("body-parser");
const routes = require("./routes");
require("dotenv").config();

const PORT = process.env.PORT || 3001;
const app = express();
// // Sets up session and connect to our Sequelize db
// const sess = {
//   secret: 'Super secret secret',
//   // TODO: Add a comment describing the purpose of adding a cookies object to our options to our session object
//   cookie: {
//     // TODO: Add a comment describing the functionality of the maxAge attribute
//     maxAge: 3600,
//     // TODO: Add a comment describing the functionality of the httpOnly attribute
//     httpOnly: true,
//     // TODO: Add a comment describing the functionality of the secure attribute
//     secure: false,
//     // TODO: Add a comment describing the functionality of the sameSite attribute
//     sameSite: 'strict',
//   },
//   resave: false,
//   saveUninitialized: true,
//   // Sets up session store
//   store: new SequelizeStore({
//     db: sequelize,
//   }),
// };

global.__basedir = __dirname;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(routes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) =>
    res.sendFile(
      path.resolve(__dirname, "../", "client", "build", "index.html")
    )
  );
} else {
  app.get("/", (req, res) => res.send("Please set to production"));
}

app.use(function (req, res) {
  res.status(404).send({ url: req.originalUrl + " not found" });
});

// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../client/build')));
// }

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

db.once("open", () => {
  app.listen(PORT, () => {
    console.log("-------------------------------------------");
    console.log(`API server running on port ${PORT}!`);
  });
});

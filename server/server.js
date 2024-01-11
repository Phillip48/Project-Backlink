const express = require("express");
const path = require("path");
const db = require("./config/connection");
const bodyParser = require("body-parser");
const routes = require("./routes");
require("dotenv").config();
const PORT = process.env.PORT || 3001;
const app = express();

// ========================================================= //
// For Websocket -> To communicate with client side
const server = require("http").createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server: server });
module.exports = { wss };
// ========================================================= //

global.__basedir = __dirname;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(routes);

app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "../", "client", "build", "index.html"))
);

app.use(function (req, res) {
  res.status(404).send({ url: req.originalUrl + " not found" });
});

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/build/index.html"))
);


// ========================================================= //
// Old server code
// db.once("open", () => {
//   app.listen(PORT, () => {
//     console.log("-------------------------------------------");
//     console.log(`API server running on port ${PORT}!`);
//   });
// });
// ========================================================= //
// New ws code //
const wsConnectionFunction = () => {
  wss.on("connection", function connection(ws) {
    console.log("A new client Connected!");
    ws.send("Server Connected");
    // ws.send("CounterAdd", UpdateProgress.updater);
    // console.log("CounterAdd",counterAdd);
    // console.log("CounterAdd",UpdateProgress.updater);
  
    ws.on("message", function incoming(message) {
      console.log("received: %s", message);
  
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });
}
wsConnectionFunction()

db.once("open", () => {
  server.listen(PORT, () => {
    console.log("-------------------------------------------");
    console.log(`API server running on port ${PORT}!`);
  });
});
// ========================================================= //

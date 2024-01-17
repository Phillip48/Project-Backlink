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
// const io = require('socket.io');
// const WebSocket = require("ws");
// const wss = new WebSocket.Server({ server: server });
// const { createServer } = require("http");
// const server = createServer();
const { Server } = require("socket.io");
const server = require("http").createServer(app);
const io = new Server(server);
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

// New ws code //
// wss.on("connection", function connection(ws) {
//   ws.on("error", console.error);
//   // This is to send a message through sockets to the client without sending it when server starts up
//   console.log("A new client Connected!");
//   ws.send("Server Connected");
//   console.log("============================================");
//   ws.on("message", function incoming(message) {
//     console.log("received: %s", message);
//     console.log("============================================");
//     wss.clients.forEach(function each(client) {
//       if (client !== ws && client.readyState === WebSocket.OPEN) {
//         client.send(message);
//         console.log("client.send(message)", message);
//       }
//     });
//   });
// });

// New socket io code

io.on("connection", (socket) => {
  console.log('A user connected');
  console.log(socket.id);
  socket.broadcast.emit('Server connected');
  console.log("-------------------------------------------");
  const id = socket.handshake.query.id
  socket.join(id)
  socket.on('message', (msg) => {
    console.log('message: ' + msg);
  });
  // socket.on('send-message', () => {
  //   // console.log('');
  // })
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

db.once("open", () => {
  server.listen(PORT, () => {
    console.log("-------------------------------------------");
    console.log(`API server running on port ${PORT}!`);
    // io.emit('Server Connected')
  });
});
// ========================================================= //
// Old server code
// db.once("open", () => {
//   app.listen(PORT, () => {
//     console.log("-------------------------------------------");
//     console.log(`API server running on port ${PORT}!`);
//   });
// });
// ========================================================= //

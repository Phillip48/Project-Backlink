const io = require("socket.io")();

module.exports = function socketEventUpdate(progressUpdater) {
  console.log("Inside socketEventUpdate");
  io.sockets.on("connection", function (socket) {
    // Broadcasts a message
    socket.on("send message", function (data) {
      console.log("sending message");
      io.sockets.emit("new message", "test");
    });
  });
  io.on("connection", function (socket) {
    // Broadcasts a message
    socket.on("send message", function (data) {
      console.log("sending message");
      io.sockets.emit("new message", "test");
    });
  });

  io.use((socket, next) => {
    next(new Error("Error", socket));
  });
  // console.log("update middleware", progressUpdater);
  io.emit("message", progressUpdater);
  io.emit("connection", progressUpdater);

  io.use((socket, next) => {
    console.log("in use 1");
    socket.broadcast.emit("hi");
    next();
  });
};

const http = require('http');
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const express = require('express');

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`)

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true
  }
});

instrument(wsServer, {
  auth: false
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if(sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anonymous";
  socket.onAny((event) => {
    console.log(event);
  });
  socket.on("enter_room", (roomName, nickname, done) => {
    socket.join(roomName);
    socket["nickname"] = nickname;
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    done();
    wsServer.sockets.emit("room_change", publicRooms());
    socket.emit("room_count", countRoom(roomName));
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (message, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${message}`);
    done();
  });
});

// const sockets = [];

// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anonymous";
//   console.log("Connected to Browser ✅");
//   socket.on("close", () => {
// 		console.log("Disconnected from the Browser ❌");
// 	});
//   socket.on("message", (message) => {
//     const parsed_message = JSON.parse(message);
//     switch (parsed_message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket.nickname}: ${parsed_message.payload}`)
//         );
// 				break;
//       case "nickname":
//         socket["nickname"] = parsed_message.payload;
// 				break;
//     }
//   });
// });

httpServer.listen(3000, handleListen);
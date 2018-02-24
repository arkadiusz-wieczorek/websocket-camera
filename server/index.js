import express from "express";
const app = express();
const http = require("http").Server(app);

http.listen(3000, () => console.log("start server, listening on *:3000"));

const io = require("socket.io")(http, {
	pingTimeout: 100,
});

//
app.get("/login", (req, res) => res.sendFile(__dirname + "/index.html"));
app.get("/stream", (req, res) => res.sendFile(__dirname + "/stream.html"));

io.on("connection", socket => {
	console.log("connected:", socket.client.id);

	socket.on("base64-image", base64 => {
		io.sockets.emit("live-stream", base64);
	});
	socket.on("base64-image-2", base64 => {
		io.sockets.emit("live-stream-2", base64);
	});
});

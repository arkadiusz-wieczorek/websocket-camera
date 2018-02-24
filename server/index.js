const express = require("express");
const app = express();
const http = require("http").Server(app);

http.listen(3000, () => console.log("listening on *:3000"));

const io = require("socket.io")(http, {
	pingTimeout: 100,
});

io.on("connection", socket => {
	console.log("connected:", socket.client.id);

	socket.on("base64-image", function(data) {
		console.log("new message from client:", data);
	});
	// setInterval(function() {
	// 	socket.emit("clientEvent", Math.random());
	// 	console.log("message sent to the clients");
	// }, 3000);
});

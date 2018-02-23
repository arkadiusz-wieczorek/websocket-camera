const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
	pingTimeout: 100, // pingInterval: 100,
});
const fs = require("fs");
const path = require("path");
const btoa = require("btoa");

const v4l2camera = require("v4l2camera");
const cam = new v4l2camera.Camera("/dev/video1"); // /dev/video0 on rpi3
cam.start();

app.use("/", express.static(path.join(__dirname, "stream")));
app.get("/login", (req, res) => res.sendFile(__dirname + "/index.html"));
app.get("/stream", (req, res) => res.sendFile(__dirname + "/stream.html"));

const sockets = {};

io.on("connection", socket => {
	sockets[socket.id] = socket;
	console.log(`\nClients connected: ${Object.keys(sockets).length}\n`);

	socket.on("disconnect", () => {
		delete sockets[socket.id];
		if (Object.keys(sockets).length == 0) {
			app.set("watchingFile", false);
			fs.unwatchFile("./stream/image_stream.jpg");
		}
	});

	socket.on("start-stream", () => {
		processImage(io);
	});
});

http.listen(3000, () => {
	console.log("listening on *:3000");
});

function printProgress() {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(
		`${state.evenTick ? "○" : "●"}  ${(new Date() / 1e3) | 0} `
	);
	state.evenTick = !state.evenTick;
}

const state = {
	evenTick: false,
	counter: 0,
};

const getFrame = () =>
	new Promise(resolve => {
		setTimeout(() => {
			cam.capture(() => resolve(cam.frameRaw()));
		}, 100); // 10 fps
	});

async function processImage(io) {
	const uint8ArrayFrame = await getFrame();
	const b64encoded = btoa(String.fromCharCode.apply(null, uint8ArrayFrame));

	io.sockets.emit("liveStream", b64encoded);
	processImage(io);
	printProgress();
}

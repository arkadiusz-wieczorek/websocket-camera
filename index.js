const express = require("express");
const app = express();

const http = require("http").Server(app);
const io = require("socket.io")(http, {
	pingTimeout: 100, // pingInterval: 100,
});
const fs = require("fs");
const path = require("path");

const v4l2camera = require("v4l2camera");
const cam = new v4l2camera.Camera("/dev/video1"); // /dev/video0 on rpi3
cam.start();

app.use("/", express.static(path.join(__dirname, "stream")));
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

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
		startStreaming(io);
	});
});

http.listen(3000, () => {
	console.log("listening on *:3000");
});

function printProgress() {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(`○  ${(new Date() / 1e3) | 0} `);

	setTimeout(() => {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`●  ${(new Date() / 1e3) | 0} `);
	}, 500);
}

const getFrame = () =>
	new Promise(resolve => {
		setTimeout(() => {
			cam.capture(() => resolve(cam.frameRaw()));
		}, 1000);
	});

async function processImage() {
	const frame = await getFrame();
	fs.createWriteStream("./stream/image_stream.jpg").end(Buffer(frame));
	processImage();
	printProgress();
}

processImage();

function startStreaming(io) {
	fs.watchFile(
		"./stream/image_stream.jpg",
		{ persistent: false, interval: 100 },
		(current, previous) => {
			if (
				current.birthtime !== previous.birthtime &&
				current.size !== 0 &&
				previous.size !== 0
			) {
				io.sockets.emit(
					"liveStream",
					`image_stream.jpg?_t=${(new Date() / 1e3) | 0}`
				);
			} else {
				return null;
			}
		}
	);
}

// function stopStreaming() {
// 	if (Object.keys(sockets).length == 0) {
// 		app.set("watchingFile", false);
// 		if (proc) proc.kill();
// 		fs.unwatchFile("./stream/image_stream.jpg");
// 	}
// }

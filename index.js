const express = require("express");
const app = express();

const http = require("http").Server(app);
const io = require("socket.io")(http, {
	pingTimeout: 1000, // pingInterval: 100,
});
const fs = require("fs");
const path = require("path");

const v4l2camera = require("v4l2camera");
const cam = new v4l2camera.Camera("/dev/video1"); // /dev/video0 on rpi3

const jimp = require("jimp");

app.use("/", express.static(path.join(__dirname, "stream")));
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

const sockets = {};
io.on("connection", socket => {
	sockets[socket.id] = socket;
	console.log(`Clients connected: ${Object.keys(sockets).length}`);

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

// function capture() {
// 	console.log("start camera");
// 	cam.start();
// 	cam.capture(function loop() {
// 		const frame = cam.frameRaw();
// 		fs.createWriteStream("./stream/image_stream.jpg").end(Buffer(frame));
// 		cam.capture(loop);
// 	});
// }

function capture() {
	console.log("start camera");
	cam.start();

	function processImage() {
		return new Promise(resolve => {
			const frame = cam.frameRaw();
			jimp
				.read(Buffer(frame), function(err, image) {
					image
						.resize(640, 480)
						.quality(50)
						.greyscale()
						.write("./stream/image_stream.jpg", () => {
							resolve("save file");
						});
				})
				.catch(() => resolve("err"));
		});
	}

	async function loop() {
		await processImage();
		cam.capture(loop);
	}
	// cam.capture(loop);
	loop();
}

capture();

function startStreaming(io) {
	fs.watchFile(
		"./stream/image_stream.jpg",
		{ persistent: true, interval: 500 },
		(current, previous) => {
			if (current.birthtime !== previous.birthtime) {
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

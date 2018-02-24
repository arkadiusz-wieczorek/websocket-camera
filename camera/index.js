import v4l2camera from "v4l2camera";
const cam = new v4l2camera.Camera("/dev/video1"); // /dev/video0 on rpi3
cam.start();

import btoa from "btoa";
import io from "socket.io-client";
const socket = io.connect("http://localhost:3000/", {
	reconnection: true,
});

socket.on("connect", function() {
	console.log("connected to localhost:3000");
	processImage(socket);
});

function getFrame() {
	return new Promise(resolve => {
		setTimeout(() => {
			cam.capture(() => resolve(cam.frameRaw()));
		}, 1000); // max 10 fps
	});
}

async function processImage(socket) {
	const uint8ArrayFrame = await getFrame();
	const b64encoded = await btoa(
		String.fromCharCode.apply(null, uint8ArrayFrame)
	);
	socket.emit("base64-image", b64encoded);
	processImage(socket);
	// printProgress();
}

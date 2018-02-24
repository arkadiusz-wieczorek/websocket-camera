import v4l2camera from "v4l2camera";
const cam = new v4l2camera.Camera("/dev/video1"); // /dev/video0 on rpi3
cam.start();
const cam2 = new v4l2camera.Camera("/dev/video2"); // /dev/video0 on rpi3
cam2.start();

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
		// setTimeout(() => {
		cam.capture(() => resolve(cam.frameRaw()));
		// }, 100); // max 6~9 fps
	});
}

function getFrame2() {
	return new Promise(resolve => {
		// setTimeout(() => {
		cam2.capture(() => resolve(cam2.frameRaw()));
		// }, 1000); // max 6~9 fps
	});
}

function printProgress() {
	let currentTimestamp = (new Date() / 1e3) | 0;
	if (state.timestamp === currentTimestamp) {
		state.fps += 1;
	} else {
		console.log(`${state.timestamp} ${state.fps} FPS`);
		state.timestamp = currentTimestamp;
		state.fps = 0;
	}
}

const state = {
	timestamp: (new Date() / 1e3) | 0,
	fps: 0,
};

async function processImage(socket) {
	const uint8ArrayFrame = await getFrame();
	const uint8ArrayFrame2 = await getFrame2();
	const b64encoded = await btoa(
		String.fromCharCode.apply(null, uint8ArrayFrame)
	);
	const b64encoded2 = await btoa(
		String.fromCharCode.apply(null, uint8ArrayFrame2)
	);
	socket.emit("base64-image", b64encoded);
	socket.emit("base64-image-2", b64encoded2);
	processImage(socket);
	printProgress();
}

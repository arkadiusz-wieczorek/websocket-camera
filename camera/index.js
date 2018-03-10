import v4l2camera from "v4l2camera";
import btoa from "btoa";
import io from "socket.io-client";
import { FileManager } from "./components/file-manager";
const fileManager = new FileManager();
const cam = new v4l2camera.Camera("/dev/video0"); // /dev/video0 on rpi3
cam.start();

const socket = io.connect("http://localhost:3000/", {
	secure: true,
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
		}, 100); // max 6~9 fps
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
	currentMinute: new Date().getMinutes(),
	firstRun: true,
	fps: 0,
};

async function processImage(socket) {
	const uint8ArrayFrame = await getFrame();
	state.newCurrentMinute = new Date().getMinutes();

	if (
		state.firstRun === true ||
		state.currentMinute !== state.newCurrentMinute
	) {
		state.firstRun = false;
		state.currentMinute = state.newCurrentMinute;
		await fileManager.saveFile(uint8ArrayFrame);
	}
	const b64encoded = await btoa(
		String.fromCharCode.apply(null, uint8ArrayFrame)
	);
	socket.emit("base64-image", b64encoded);
	processImage(socket);
	printProgress();
}

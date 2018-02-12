var v4l2camera = require("v4l2camera");
var cam = new v4l2camera.Camera("/dev/video1");

const fs = require("fs");
cam.start();
cam.capture(success => {
	const frame = cam.frameRaw();
	fs.createWriteStream("result.jpg").end(Buffer(frame));
	cam.stop(handleStop);
});

const handleStop = () => {
	console.log("pyk");
};

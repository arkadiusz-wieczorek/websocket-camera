import fs from "fs";

export class FileManager {
	saveFile(frame) {
		fs
			.createWriteStream(
				`/media/usb-disk/captured-images/${(new Date() / 1e3) | 0}.jpeg`
			)
			.end(Buffer(frame));
	}
}

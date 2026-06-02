const fs = require("fs");
const path = require("path");

const IMAGES_DIR = path.join(__dirname, "..", "images");

function collectPngFiles(dir, relativeDir = "") {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const images = [];

	for (const entry of entries) {
		const rel = relativeDir
			? path.join(relativeDir, entry.name).replace(/\\/g, "/")
			: entry.name;
		const abs = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			images.push(...collectPngFiles(abs, rel));
		} else if (/\.png$/i.test(entry.name)) {
			images.push({
				path: rel,
				contents: fs.readFileSync(abs),
			});
		}
	}

	return images;
}

function getTestImagesDir() {
	return IMAGES_DIR;
}

function hasTestImages() {
	if (!fs.existsSync(IMAGES_DIR)) {
		return false;
	}
	return collectPngFiles(IMAGES_DIR).length > 0;
}

function loadTestImages() {
	if (!hasTestImages()) {
		return [];
	}
	return collectPngFiles(IMAGES_DIR);
}

module.exports = {
	getTestImagesDir,
	hasTestImages,
	loadTestImages,
};

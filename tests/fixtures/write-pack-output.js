const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "out");

function getOutDir() {
	return OUT_DIR;
}

function clearOutDir() {
	if (fs.existsSync(OUT_DIR)) {
		fs.rmSync(OUT_DIR, { recursive: true, force: true });
	}
	fs.mkdirSync(OUT_DIR, { recursive: true });
}

/**
 * @param {{ name: string, buffer: Buffer }[]} files
 * @param {string} scenarioName subdirectory under tests/out
 */
function writePackOutput(files, scenarioName) {
	const dir = path.join(OUT_DIR, scenarioName);
	fs.mkdirSync(dir, { recursive: true });

	for (const file of files) {
		fs.writeFileSync(path.join(dir, file.name), file.buffer);
	}

	console.log(`Pack output written to ${dir}`);
	return dir;
}

module.exports = {
	getOutDir,
	clearOutDir,
	writePackOutput,
};

const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const { packAsync } = require("../index");
const {
	getTestImagesDir,
	hasTestImages,
	loadTestImages,
} = require("./fixtures/load-test-images");
const { clearOutDir, writePackOutput } = require("./fixtures/write-pack-output");

const describePack = hasTestImages() ? describe : describe.skip;

if (!hasTestImages()) {
	console.log(
		`Skipping pack-images tests: folder not found or empty (${getTestImagesDir()})`
	);
}

function findFile(files, pattern) {
	return files.find((f) => pattern.test(f.name));
}

describePack("pack with real images", () => {
	let images;

	before(() => {
		images = loadTestImages();
		assert.ok(images.length > 0, "expected at least one PNG in tests/images");
		clearOutDir();
	});

	it("packs all images into atlas + JsonHash metadata", async () => {
		const files = await packAsync(images, {
			textureName: "test-atlas",
			width: 1024,
			height: 1024,
			padding: 2,
			exporter: "JsonHash",
			allowRotation: true,
			allowTrim: true,
		});

		assert.ok(Array.isArray(files));
		assert.ok(files.length >= 2, "expected metadata and texture files");

		const jsonFile = findFile(files, /\.json$/);
		const pngFile = findFile(files, /\.png$/);

		assert.ok(jsonFile, "missing JSON export");
		assert.ok(pngFile, "missing PNG atlas");

		const meta = JSON.parse(jsonFile.buffer.toString("utf8"));
		assert.ok(meta.frames, "JSON must contain frames");
		assert.ok(Object.keys(meta.frames).length > 0, "frames must not be empty");
		assert.equal(meta.meta.image, "test-atlas.png");

		assert.equal(pngFile.buffer[0], 0x89);
		assert.equal(pngFile.buffer[1], 0x50);
		assert.ok(pngFile.buffer.length > 100);

		writePackOutput(files, "all-images");
	});

	it("packs snowflake sprites with trim and rotation enabled", async () => {
		const snowflakes = images.filter((img) => img.path.startsWith("snowflake/"));
		if (snowflakes.length === 0) {
			console.log("Skipping snowflake scenario: no files in tests/images/snowflake/");
			return;
		}

		const files = await packAsync(snowflakes, {
			textureName: "snowflake",
			width: 512,
			height: 512,
			padding: 1,
			exporter: "JsonHash",
			allowRotation: true,
			allowTrim: true,
			alphaThreshold: 1,
		});

		const jsonFile = findFile(files, /\.json$/);
		const meta = JSON.parse(jsonFile.buffer.toString("utf8"));
		const frameCount = Object.keys(meta.frames).length;

		assert.equal(frameCount, snowflakes.length);
		assert.ok(meta.meta.size.w > 0 && meta.meta.size.h > 0);

		writePackOutput(files, "snowflake");
	});

	it("packs with scale and grayscale filter", async () => {
		let subset = images.filter((img) => img.path.startsWith("snowflake/")).slice(0, 4);
		if (subset.length === 0) {
			subset = images.filter((img) => !/hand\.png$/i.test(img.path)).slice(0, 3);
		}
		if (subset.length === 0) {
			subset = images.slice(0, 1);
		}

		const files = await packAsync(subset, {
			textureName: "scaled",
			width: 1024,
			height: 1024,
			scale: 0.5,
			scaleMethod: "BILINEAR",
			filter: "grayscale",
			exporter: "JsonHash",
		});

		const jsonFile = findFile(files, /\.json$/);
		const pngFile = findFile(files, /\.png$/);
		const meta = JSON.parse(jsonFile.buffer.toString("utf8"));

		assert.equal(meta.meta.scale, 0.5);
		assert.ok(meta.meta.size.w <= 512);
		assert.ok(meta.meta.size.h <= 512);
		assert.ok(pngFile.buffer.length > 0);

		writePackOutput(files, "scaled-grayscale");
	});

	it("exports every predefined format without error", async () => {
		const exporterList = require("../exporters/list.json");
		let subset = images.filter((img) => img.path.startsWith("snowflake/")).slice(0, 2);
		if (subset.length === 0) {
			subset = images.slice(0, 2);
		}

		for (const exporter of exporterList) {
			const files = await packAsync(subset, {
				textureName: "format-check",
				width: 512,
				height: 512,
				padding: 0,
				exporter: exporter.type,
				allowRotation: exporter.allowRotation,
				allowTrim: exporter.allowTrim,
			});

			const dataFile = files.find(
				(f) => f.name.endsWith("." + exporter.fileExt)
			);
			assert.ok(dataFile, `${exporter.type}: missing .${exporter.fileExt} file`);
			assert.ok(
				dataFile.buffer.length > 0,
				`${exporter.type}: empty export buffer`
			);

			writePackOutput(files, path.join("formats", exporter.type));
		}
	});
});

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const { packAsync } = require("../index");

async function makeMinimalPng() {
	return sharp(
		Buffer.from([
			255, 0, 0, 255,   0, 255, 0, 255,   0, 0, 255, 255,   255, 255, 0, 255,
			255, 0, 0, 255,   0, 255, 0, 255,   0, 0, 255, 255,   255, 255, 0, 255,
			255, 0, 0, 255,   0, 255, 0, 255,   0, 0, 255, 255,   255, 255, 0, 255,
			255, 0, 0, 255,   0, 255, 0, 255,   0, 0, 255, 255,   255, 255, 0, 255,
		]),
		{ raw: { width: 4, height: 4, channels: 4 } }
	)
		.png()
		.toBuffer();
}

describe("strict-mode width/height regression (issue #54)", () => {
	it("packAsync resolves with non-empty frames for a single sprite", async () => {
		const png = await makeMinimalPng();
		const input = [{ path: "sprite.png", contents: png }];

		const result = await packAsync(input, {
			textureName: "test",
			width: 64,
			height: 64,
			exporter: "JsonHash",
			allowRotation: false,
			allowTrim: false,
		});

		assert.ok(Array.isArray(result), "packAsync must resolve with an array");

		const json = result.find((f) => f.name.endsWith(".json"));
		assert.ok(json, "missing JSON metadata file");

		const meta = JSON.parse(json.buffer.toString("utf8"));
		assert.ok(
			Object.keys(meta.frames).length > 0,
			"frames must not be empty — image was silently dropped (issue #54)"
		);
	});
});

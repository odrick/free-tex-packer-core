"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const { packAsync } = require("../index");

// 6×6 solid red, fully opaque.
function makeSolidRedPng() {
	const pixel = [0xff, 0x00, 0x00, 0xff];
	const raw = Buffer.from(Array(6 * 6).fill(pixel).flat());
	return sharp(raw, { raw: { width: 6, height: 6, channels: 4 } }).png().toBuffer();
}

// 10×10: transparent 2px border, solid red 6×6 center.
// With allowTrim:true the packer strips the border → sx=2, sy=2, sw=6, sh=6.
function makeRedWithTransparentBorderPng() {
	const raw = Buffer.alloc(10 * 10 * 4);
	for (let row = 2; row < 8; row++) {
		for (let col = 2; col < 8; col++) {
			const i = (row * 10 + col) * 4;
			raw[i] = 0xff; raw[i + 1] = 0x00; raw[i + 2] = 0x00; raw[i + 3] = 0xff;
		}
	}
	return sharp(raw, { raw: { width: 10, height: 10, channels: 4 } }).png().toBuffer();
}

// 6×6 solid red with 50% alpha (0x80).
function makeSemiTransparentRedPng() {
	const pixel = [0xff, 0x00, 0x00, 0x80];
	const raw = Buffer.from(Array(6 * 6).fill(pixel).flat());
	return sharp(raw, { raw: { width: 6, height: 6, channels: 4 } }).png().toBuffer();
}

async function getAtlasPixel(atlasBuf, atlasWidth, x, y) {
	const { data } = await sharp(atlasBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	const i = (y * atlasWidth + x) * 4;
	return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

async function sampleExtrudedEdges(pngFile, meta, frameName) {
	const frame = meta.frames[frameName].frame;
	const atlasWidth = meta.meta.size.w;
	const midX = frame.x + Math.floor(frame.w / 2);
	const midY = frame.y + Math.floor(frame.h / 2);
	return {
		top:    await getAtlasPixel(pngFile.buffer, atlasWidth, midX,              frame.y - 1),
		bottom: await getAtlasPixel(pngFile.buffer, atlasWidth, midX,              frame.y + frame.h),
		left:   await getAtlasPixel(pngFile.buffer, atlasWidth, frame.x - 1,       midY),
		right:  await getAtlasPixel(pngFile.buffer, atlasWidth, frame.x + frame.w, midY),
	};
}

function assertEdgePixels(samples, r, g, b, a) {
	for (const [side, px] of Object.entries(samples)) {
		assert.equal(px.r, r, `${side}: red (got ${px.r})`);
		assert.equal(px.g, g, `${side}: green (got ${px.g})`);
		assert.equal(px.b, b, `${side}: blue (got ${px.b})`);
		assert.equal(px.a, a, `${side}: alpha (got ${px.a})`);
	}
}

describe("extrude", () => {
	it("fills extruded border with edge color of a solid sprite (no trim)", async () => {
		const contents = await makeSolidRedPng();
		const files = await packAsync(
			[{ path: "red.png", contents }],
			{
				textureName: "extrude-notrim",
				width: 64,
				height: 64,
				padding: 0,
				extrude: 2,
				allowTrim: false,
				allowRotation: false,
				exporter: "JsonHash",
			}
		);
		const meta = JSON.parse(files.find((f) => f.name.endsWith(".json")).buffer.toString("utf8"));
		const pngFile = files.find((f) => f.name.endsWith(".png"));
		assertEdgePixels(await sampleExtrudedEdges(pngFile, meta, "red.png"), 0xff, 0x00, 0x00, 0xff);
	});

	it("preserves semi-transparent alpha in extruded border", async () => {
		const contents = await makeSemiTransparentRedPng();
		const files = await packAsync(
			[{ path: "red.png", contents }],
			{
				textureName: "extrude-alpha",
				width: 64,
				height: 64,
				padding: 0,
				extrude: 2,
				allowTrim: false,
				allowRotation: false,
				exporter: "JsonHash",
			}
		);
		const meta = JSON.parse(files.find((f) => f.name.endsWith(".json")).buffer.toString("utf8"));
		const pngFile = files.find((f) => f.name.endsWith(".png"));
		assertEdgePixels(await sampleExtrudedEdges(pngFile, meta, "red.png"), 0xff, 0x00, 0x00, 0x80);
	});

	it("fills extruded border from trimmed content edge, not transparent border (issue #53)", async () => {
		const contents = await makeRedWithTransparentBorderPng();
		const files = await packAsync(
			[{ path: "red.png", contents }],
			{
				textureName: "extrude-trim",
				width: 64,
				height: 64,
				padding: 0,
				extrude: 2,
				allowTrim: true,
				allowRotation: false,
				exporter: "JsonHash",
			}
		);
		const meta = JSON.parse(files.find((f) => f.name.endsWith(".json")).buffer.toString("utf8"));
		const pngFile = files.find((f) => f.name.endsWith(".png"));
		const frame = meta.frames["red.png"].frame;
		assert.equal(frame.w, 6, "trimmed frame width should be 6");
		assert.equal(frame.h, 6, "trimmed frame height should be 6");
		assertEdgePixels(await sampleExtrudedEdges(pngFile, meta, "red.png"), 0xff, 0x00, 0x00, 0xff);
	});
});

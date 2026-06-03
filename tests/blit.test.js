const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const { packAsync } = require("../index");
const { blitImage, Jimp } = require("../utils/jimp");

const BANNER_PATH = path.join(
	__dirname,
	"images",
	"banners",
	"banner-landscape-final.png"
);

describe("blitImage", () => {
	it("preserves straight-alpha RGB when compositing onto transparent canvas", () => {
		const src = new Jimp({ width: 3, height: 1, color: 0x00000000 });
		src.bitmap.data[0] = 102;
		src.bitmap.data[1] = 247;
		src.bitmap.data[2] = 247;
		src.bitmap.data[3] = 110;

		const dst = new Jimp({ width: 3, height: 1, color: 0x00000000 });
		blitImage(dst, src, 1, 0, 0, 0, 1, 1);

		const i = 4;
		assert.equal(dst.bitmap.data[i], 102);
		assert.equal(dst.bitmap.data[i + 1], 247);
		assert.equal(dst.bitmap.data[i + 2], 247);
		assert.equal(dst.bitmap.data[i + 3], 110);
	});

	it("packs semi-transparent banner without darkening center pixel", async () => {
		if (!fs.existsSync(BANNER_PATH)) {
			console.log(`Skipping: ${BANNER_PATH} not found`);
			return;
		}

		const contents = fs.readFileSync(BANNER_PATH);
		const { data: srcData, info: srcInfo } = await sharp(contents)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		const cx = Math.floor(srcInfo.width / 2);
		const cy = Math.floor(srcInfo.height / 2);
		const si = (cy * srcInfo.width + cx) * 4;
		const srcR = srcData[si];
		const srcG = srcData[si + 1];
		const srcB = srcData[si + 2];
		const srcA = srcData[si + 3];

		const files = await packAsync(
			[{ path: "banners/banner-landscape-final.png", contents }],
			{
				textureName: "blit-check",
				width: 1024,
				height: 1024,
				padding: 2,
				allowTrim: false,
				allowRotation: false,
				exporter: "JsonHash",
			}
		);

		const png = files.find((f) => f.name.endsWith(".png"));
		const meta = JSON.parse(
			files.find((f) => f.name.endsWith(".json")).buffer.toString("utf8")
		);
		const frame = meta.frames["banners/banner-landscape-final.png"].frame;
		const ax = frame.x + Math.floor(frame.w / 2);
		const ay = frame.y + Math.floor(frame.h / 2);

		const { data: atlasData, info: atlasInfo } = await sharp(png.buffer)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		const ai = (ay * atlasInfo.width + ax) * 4;

		assert.equal(atlasData[ai + 3], srcA, "alpha must be unchanged");
		assert.equal(atlasData[ai], srcR, "red must match source");
		assert.equal(atlasData[ai + 1], srcG, "green must match source");
		assert.equal(atlasData[ai + 2], srcB, "blue must match source");
	});
});

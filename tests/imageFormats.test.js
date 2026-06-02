const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const {
	normalizeTextureFormat,
	getBase64Prefix,
	getPixelFormat,
	isWebpBuffer,
	readImage,
	encodeTextureBuffer,
} = require("../utils/imageFormats");
const { Jimp } = require("../utils/jimp");

describe("imageFormats", () => {
	it("normalizes jpeg alias to jpg", () => {
		assert.equal(normalizeTextureFormat("jpeg"), "jpg");
	});

	it("rejects unknown texture format", () => {
		assert.throws(() => normalizeTextureFormat("bmp"), /Unsupported textureFormat/);
	});

	it("getBase64Prefix includes webp", () => {
		assert.equal(getBase64Prefix("webp"), "data:image/webp;base64,");
	});

	it("getPixelFormat uses RGBA for webp", () => {
		assert.equal(getPixelFormat("webp"), "RGBA8888");
	});

	it("round-trips webp through readImage and encodeTextureBuffer", async () => {
		const png = await Jimp.read(Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
			"base64"
		));
		const webpBuf = await sharp(await png.getBuffer("image/png")).webp().toBuffer();
		assert.ok(isWebpBuffer(webpBuf));

		const decoded = await readImage(webpBuf, "test.webp");
		assert.equal(decoded.bitmap.width, 1);

		const encoded = await encodeTextureBuffer(decoded, "webp");
		assert.ok(isWebpBuffer(encoded));
	});
});

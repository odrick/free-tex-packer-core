const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { Jimp } = require("../utils/jimp");

describe("sprite rotation (Jimp 1.x CW 90°)", () => {
	it("rotate({ deg: -90 }) matches clockwise 90° for a 2×1 image", () => {
		// Left pixel red, right pixel blue — after CW 90°: red on top, blue on bottom.
		const data = Buffer.alloc(8);
		data.writeUInt32BE(0xff0000ff, 0);
		data.writeUInt32BE(0x0000ffff, 4);

		const img = Jimp.fromBitmap({ data, width: 2, height: 1 });
		img.rotate({ deg: -90 });

		assert.equal(img.bitmap.width, 1);
		assert.equal(img.bitmap.height, 2);
		assert.equal(img.getPixelColor(0, 0), 0xff0000ff);
		assert.equal(img.getPixelColor(0, 1), 0x0000ffff);
	});

	it("rotate({ deg: 90 }) is counter-clockwise (regression guard)", () => {
		const data = Buffer.alloc(8);
		data.writeUInt32BE(0xff0000ff, 0);
		data.writeUInt32BE(0x0000ffff, 4);

		const img = Jimp.fromBitmap({ data, width: 2, height: 1 });
		img.rotate({ deg: 90 });

		assert.equal(img.getPixelColor(0, 0), 0x0000ffff);
		assert.equal(img.getPixelColor(0, 1), 0xff0000ff);
	});
});

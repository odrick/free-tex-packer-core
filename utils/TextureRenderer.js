const { Jimp, blitImage, getResizeStrategy } = require("./jimp");

class TextureRenderer {

	constructor(data, options = {}, callback) {
		this.buffer = null;
		this.data = data;
		this.callback = callback;
		this.width = 0;
		this.height = 0;

		this.render(data, options)
			.then(() => {
				if (this.callback) {
					this.callback(this);
				}
			})
			.catch((err) => {
				if (this.callback) {
					this.callback(null, err);
				} else {
					throw err;
				}
			});
	}

	static getSize(data, options = {}) {
		let width = options.width || 0;
		let height = options.height || 0;
		let padding = options.padding || 0;
		let extrude = options.extrude || 0;

		if (!options.fixedSize) {
			width = 0;
			height = 0;

			for (let item of data) {
				let w = item.frame.x + item.frame.w;
				let h = item.frame.y + item.frame.h;

				if (item.rotated) {
					w = item.frame.x + item.frame.h;
					h = item.frame.y + item.frame.w;
				}

				if (w > width) {
					width = w;
				}
				if (h > height) {
					height = h;
				}
			}

			width += padding + extrude;
			height += padding + extrude;
		}

		if (options.powerOfTwo) {
			let sw = Math.round(Math.log(width) / Math.log(2));
			let sh = Math.round(Math.log(height) / Math.log(2));

			let pw = Math.pow(2, sw);
			let ph = Math.pow(2, sh);

			if (pw < width) pw = Math.pow(2, sw + 1);
			if (ph < height) ph = Math.pow(2, sh + 1);

			width = pw;
			height = ph;
		}

		return { width, height };
	}

	async render(data, options = {}) {
		let { width, height } = TextureRenderer.getSize(data, options);

		this.width = width;
		this.height = height;

		const image = new Jimp({ width, height, color: 0x00000000 });
		this.buffer = image;

		for (let item of data) {
			this.renderItem(item, options);
		}

		let filter = new options.filter();
		filter.apply(image);

		if (options.scale && options.scale !== 1) {
			const mode = getResizeStrategy(options.scaleMethod);
			image.resize({
				w: Math.round(width * options.scale) || 1,
				h: Math.round(height * options.scale) || 1,
				mode,
			});
		}
	}

	renderItem(item, options) {
		if (!item.skipRender) {
			let img = item.image;

			let dx = item.frame.x;
			let dy = item.frame.y;
			let sx = item.spriteSourceSize.x;
			let sy = item.spriteSourceSize.y;
			let sw = item.spriteSourceSize.w;
			let sh = item.spriteSourceSize.h;
			let ow = item.sourceSize.w;
			let oh = item.sourceSize.h;

			if (item.rotated) {
				img = img.clone();
				// Jimp 1.x rotates CCW for positive deg; packer expects CW 90° (Jimp 0.2 behavior).
				img.rotate({ deg: -90 });

				sx = item.sourceSize.h - item.spriteSourceSize.h - item.spriteSourceSize.y;
				sy = item.spriteSourceSize.x;
				sw = item.spriteSourceSize.h;
				sh = item.spriteSourceSize.w;
				ow = item.sourceSize.h;
				oh = item.sourceSize.w;
			}

			if (options.extrude) {
				const e = options.extrude;

				// Corners — repeat the single corner pixel across the extrude×extrude block.
				for (let row = 0; row < e; row++) {
					for (let col = 0; col < e; col++) {
						blitImage(this.buffer, img, dx - e + col, dy - e + row, sx,          sy,          1, 1);
						blitImage(this.buffer, img, dx + sw + col, dy - e + row, sx + sw - 1, sy,          1, 1);
						blitImage(this.buffer, img, dx - e + col, dy + sh + row, sx,          sy + sh - 1, 1, 1);
						blitImage(this.buffer, img, dx + sw + col, dy + sh + row, sx + sw - 1, sy + sh - 1, 1, 1);
					}
				}

				// Edges — repeat each edge column/row across the full extrude band.
				for (let i = 0; i < e; i++) {
					blitImage(this.buffer, img, dx - e + i, dy, sx,          sy, 1,  sh);
					blitImage(this.buffer, img, dx + sw + i, dy, sx + sw - 1, sy, 1,  sh);
					blitImage(this.buffer, img, dx, dy - e + i, sx, sy,          sw, 1);
					blitImage(this.buffer, img, dx, dy + sh + i, sx, sy + sh - 1, sw, 1);
				}
			}

			blitImage(this.buffer, img, dx, dy, sx, sy, sw, sh);
		}
	}
}

module.exports = TextureRenderer;

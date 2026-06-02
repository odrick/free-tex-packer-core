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
				img.rotate({ deg: 90 });

				sx = item.sourceSize.h - item.spriteSourceSize.h - item.spriteSourceSize.y;
				sy = item.spriteSourceSize.x;
				sw = item.spriteSourceSize.h;
				sh = item.spriteSourceSize.w;
				ow = item.sourceSize.h;
				oh = item.sourceSize.w;
			}

			if (options.extrude) {
				let extrudeImage = img.clone();

				extrudeImage.resize({ w: 1, h: 1 });
				blitImage(extrudeImage, img, 0, 0, 0, 0, 1, 1);
				extrudeImage.resize({ w: options.extrude, h: options.extrude });
				blitImage(
					this.buffer,
					extrudeImage,
					dx - options.extrude,
					dy - options.extrude,
					0,
					0,
					options.extrude,
					options.extrude
				);

				extrudeImage.resize({ w: 1, h: 1 });
				blitImage(extrudeImage, img, 0, 0, ow - 1, 0, 1, 1);
				extrudeImage.resize({ w: options.extrude, h: options.extrude });
				blitImage(
					this.buffer,
					extrudeImage,
					dx + sw,
					dy - options.extrude,
					0,
					0,
					options.extrude,
					options.extrude
				);

				extrudeImage.resize({ w: 1, h: 1 });
				blitImage(extrudeImage, img, 0, 0, 0, oh - 1, 1, 1);
				extrudeImage.resize({ w: options.extrude, h: options.extrude });
				blitImage(
					this.buffer,
					extrudeImage,
					dx - options.extrude,
					dy + sh,
					0,
					0,
					options.extrude,
					options.extrude
				);

				extrudeImage.resize({ w: 1, h: 1 });
				blitImage(extrudeImage, img, 0, 0, ow - 1, oh - 1, 1, 1);
				extrudeImage.resize({ w: options.extrude, h: options.extrude });
				blitImage(
					this.buffer,
					extrudeImage,
					dx + sw,
					dy + sh,
					0,
					0,
					options.extrude,
					options.extrude
				);

				extrudeImage.resize({ w: 1, h: sh });
				blitImage(extrudeImage, img, 0, 0, 0, sy, 1, sh);
				extrudeImage.resize({ w: options.extrude, h: sh });
				blitImage(this.buffer, extrudeImage, dx - options.extrude, dy, 0, 0, options.extrude, sh);

				extrudeImage.resize({ w: 1, h: sh });
				blitImage(extrudeImage, img, 0, 0, ow - 1, sy, 1, sh);
				extrudeImage.resize({ w: options.extrude, h: sh });
				blitImage(this.buffer, extrudeImage, dx + sw, dy, 0, 0, options.extrude, sh);

				extrudeImage.resize({ w: sw, h: 1 });
				blitImage(extrudeImage, img, 0, 0, sx, 0, sw, 1);
				extrudeImage.resize({ w: sw, h: options.extrude });
				blitImage(this.buffer, extrudeImage, dx, dy - options.extrude, 0, 0, sw, options.extrude);

				extrudeImage.resize({ w: sw, h: 1 });
				blitImage(extrudeImage, img, 0, 0, sx, oh - 1, sw, 1);
				extrudeImage.resize({ w: sw, h: options.extrude });
				blitImage(this.buffer, extrudeImage, dx, dy + sh, 0, 0, sw, options.extrude);
			}

			blitImage(this.buffer, img, dx, dy, sx, sy, sw, sh);
		}
	}
}

module.exports = TextureRenderer;

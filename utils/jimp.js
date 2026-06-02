const { Jimp, JimpMime, ResizeStrategy } = require("jimp");

function blitImage(dst, src, x, y, srcX, srcY, srcW, srcH) {
	dst.blit({ src, x, y, srcX, srcY, srcW, srcH });
}

function getResizeStrategy(scaleMethod) {
	switch (scaleMethod) {
		case "NEAREST_NEIGHBOR":
			return ResizeStrategy.NEAREST_NEIGHBOR;
		case "BICUBIC":
			return ResizeStrategy.BICUBIC;
		case "HERMITE":
			return ResizeStrategy.HERMITE;
		case "BEZIER":
			return ResizeStrategy.BEZIER;
		default:
			return ResizeStrategy.BILINEAR;
	}
}

module.exports = {
	Jimp,
	JimpMime,
	ResizeStrategy,
	blitImage,
	getResizeStrategy,
};

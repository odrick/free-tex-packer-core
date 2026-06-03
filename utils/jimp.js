const { Jimp, JimpMime, ResizeStrategy } = require("jimp");

/**
 * Porter–Duff source-over with straight (unassociated) alpha.
 * Jimp 1.x blit darkens RGB when compositing onto transparent pixels.
 */
function blitImage(dst, src, x, y, srcX, srcY, srcW, srcH) {
	x = Math.round(x);
	y = Math.round(y);
	srcX = Math.round(srcX);
	srcY = Math.round(srcY);
	srcW = Math.round(srcW);
	srcH = Math.round(srcH);

	const dstData = dst.bitmap.data;
	const srcData = src.bitmap.data;
	const dstW = dst.bitmap.width;
	const dstH = dst.bitmap.height;
	const srcStride = src.bitmap.width;

	for (let row = 0; row < srcH; row++) {
		const yOffset = y + row;
		if (yOffset < 0 || yOffset >= dstH) {
			continue;
		}

		const srcRow = srcY + row;

		for (let col = 0; col < srcW; col++) {
			const xOffset = x + col;
			if (xOffset < 0 || xOffset >= dstW) {
				continue;
			}

			const srcCol = srcX + col;
			const srcIdx = (srcRow * srcStride + srcCol) * 4;
			const sa = srcData[srcIdx + 3];

			if (sa === 0) {
				continue;
			}

			const dstIdx = (yOffset * dstW + xOffset) * 4;

			if (sa === 255) {
				dstData[dstIdx] = srcData[srcIdx];
				dstData[dstIdx + 1] = srcData[srcIdx + 1];
				dstData[dstIdx + 2] = srcData[srcIdx + 2];
				dstData[dstIdx + 3] = 255;
				continue;
			}

			const da = dstData[dstIdx + 3];

			if (da === 0) {
				dstData[dstIdx] = srcData[srcIdx];
				dstData[dstIdx + 1] = srcData[srcIdx + 1];
				dstData[dstIdx + 2] = srcData[srcIdx + 2];
				dstData[dstIdx + 3] = sa;
				continue;
			}

			const invSa = 255 - sa;
			const oa = sa + Math.floor((da * invSa) / 255);

			if (oa === 0) {
				dstData[dstIdx] = 0;
				dstData[dstIdx + 1] = 0;
				dstData[dstIdx + 2] = 0;
				dstData[dstIdx + 3] = 0;
				continue;
			}

			const srcR = srcData[srcIdx];
			const srcG = srcData[srcIdx + 1];
			const srcB = srcData[srcIdx + 2];
			const dstR = dstData[dstIdx];
			const dstG = dstData[dstIdx + 1];
			const dstB = dstData[dstIdx + 2];
			const blend = Math.floor((da * invSa) / 255);

			dstData[dstIdx] = Math.round((srcR * sa + dstR * blend) / oa);
			dstData[dstIdx + 1] = Math.round((srcG * sa + dstG * blend) / oa);
			dstData[dstIdx + 2] = Math.round((srcB * sa + dstB * blend) / oa);
			dstData[dstIdx + 3] = oa;
		}
	}
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

const path = require("path");
const sharp = require("sharp");
const { Jimp, JimpMime } = require("./jimp");

const TEXTURE_FORMATS = ["png", "jpg", "webp"];

const MIME = {
	png: JimpMime.png,
	jpg: JimpMime.jpeg,
	webp: "image/webp",
};

const BASE64_PREFIX = {
	png: "data:image/png;base64,",
	jpg: "data:image/jpeg;base64,",
	webp: "data:image/webp;base64,",
};

function normalizeTextureFormat(format) {
	if (!format) {
		return "png";
	}
	const f = String(format).toLowerCase();
	if (f === "jpeg") {
		return "jpg";
	}
	if (!TEXTURE_FORMATS.includes(f)) {
		throw new Error(
			`Unsupported textureFormat "${format}". Use: ${TEXTURE_FORMATS.join(", ")}`
		);
	}
	return f;
}

function getTextureMime(textureFormat) {
	return MIME[normalizeTextureFormat(textureFormat)];
}

function getPixelFormat(textureFormat) {
	return normalizeTextureFormat(textureFormat) === "jpg" ? "RGB888" : "RGBA8888";
}

function getBase64Prefix(textureFormat) {
	return BASE64_PREFIX[normalizeTextureFormat(textureFormat)];
}

function isWebpPath(filePath) {
	return /\.webp$/i.test(filePath || "");
}

function isWebpBuffer(buffer) {
	return (
		buffer &&
		buffer.length >= 12 &&
		buffer.toString("ascii", 0, 4) === "RIFF" &&
		buffer.toString("ascii", 8, 12) === "WEBP"
	);
}

function shouldDecodeAsWebp(buffer, filePath) {
	return isWebpPath(filePath) || isWebpBuffer(buffer);
}

async function decodeWebpToJimp(buffer) {
	const { data, info } = await sharp(buffer)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	return Jimp.fromBitmap({
		data,
		width: info.width,
		height: info.height,
	});
}

/**
 * @param {Buffer} buffer
 * @param {string} [filePath]
 */
async function readImage(buffer, filePath) {
	if (shouldDecodeAsWebp(buffer, filePath)) {
		return decodeWebpToJimp(buffer);
	}
	return Jimp.read(buffer);
}

/**
 * @param {import("@jimp/types").JimpInstance} image
 * @param {string} textureFormat
 */
async function encodeTextureBuffer(image, textureFormat) {
	const format = normalizeTextureFormat(textureFormat);

	if (format === "webp") {
		return sharp(image.bitmap.data, {
			raw: {
				width: image.bitmap.width,
				height: image.bitmap.height,
				channels: 4,
			},
		})
			.webp({ quality: 90 })
			.toBuffer();
	}

	return image.getBuffer(MIME[format]);
}

const INPUT_IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

function isSupportedInputPath(filePath) {
	return INPUT_IMAGE_EXT.test(filePath || "");
}

module.exports = {
	TEXTURE_FORMATS,
	normalizeTextureFormat,
	getTextureMime,
	getPixelFormat,
	getBase64Prefix,
	isWebpPath,
	isWebpBuffer,
	readImage,
	encodeTextureBuffer,
	isSupportedInputPath,
	INPUT_IMAGE_EXT,
};

const appInfo = require("../../package.json");

/** Sample packed sprites passed to startExporter (same shape as PackProcessor output). */
const packData = [
	{
		name: "sprites/hero.png",
		frame: { x: 0, y: 0, w: 32, h: 48 },
		spriteSourceSize: { x: 2, y: 4, w: 28, h: 40 },
		sourceSize: { w: 32, h: 48 },
		rotated: false,
		trimmed: true,
	},
	{
		name: "enemy.png",
		frame: { x: 32, y: 0, w: 16, h: 16 },
		spriteSourceSize: { x: 0, y: 0, w: 16, h: 16 },
		sourceSize: { w: 16, h: 16 },
		rotated: true,
		trimmed: false,
	},
];

const exportOptions = {
	imageName: "texture.png",
	imageFile: "texture.png",
	format: "RGBA8888",
	textureFormat: "png",
	imageWidth: 64,
	imageHeight: 64,
	scale: 1,
	removeFileExtension: false,
	prependFolderName: true,
	base64Export: false,
	trimMode: "trim",
	appInfo,
};

module.exports = { packData, exportOptions, appInfo };

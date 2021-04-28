let list = require("./list.json");
let appInfo = require("../package.json");
let mustache = require("mustache");
let fs = require("fs");
let path = require("path");
let wax = require("@jvitela/mustache-wax");

wax(mustache);

mustache.Formatters = {
	add: (v1, v2) => {
		return v1 + v2;
	},
	subtract: (v1, v2) => {
		return v1 - v2;
	},
	multiply: (v1, v2) => {
		return v1 * v2;
	},
	divide: (v1, v2) => {
		return v1 / v2;
	},
	offsetLeft: (start, size1, size2) => {
		let x1 = start + size1 / 2;
		let x2 = size2 / 2;
		return x1 - x2;
	},
	offsetRight: (start, size1, size2) => {
		let x1 = start + size1 / 2;
		let x2 = size2 / 2;
		return x2 - x1;
	},
	mirror: (start, size1, size2) => {
		return size2 - start - size1;
	},
	escapeName: (name) => {
		return name
			.replace(/%/g, "%25")
			.replace(/#/g, "%23")
			.replace(/:/g, "%3A")
			.replace(/;/g, "%3B")
			.replace(/\\/g, "-")
			.replace(/\//g, "-");
	},
};

function getExporterByType(type) {
	type = type.toLowerCase();

	for (let item of list) {
		if (item.type.toLowerCase() == type) {
			return item;
		}
	}
	return null;
}

function prepareData(data, options) {
	let opt = Object.assign({}, options);

	opt.imageName = opt.imageName || "texture.png";
	opt.format = opt.format || "RGBA8888";
	opt.scale = opt.scale || 1;
	opt.base64Prefix =
		options.textureFormat == "png"
			? "data:image/png;base64,"
			: "data:image/jpeg;base64,";

	let ret = data.map((item, index) => {
		let name = item.name;

		if (options.trimSpriteNames) {
			name.trim();
		}

		if (options.removeFileExtension) {
			let parts = name.split(".");
			parts.pop();
			name = parts.join(".");
		}

		if (!options.prependFolderName) {
			name = name.split("/").pop();
		}

		let frame = {
			x: item.frame.x,
			y: item.frame.y,
			w: item.frame.w,
			h: item.frame.h,
			hw: item.frame.w / 2,
			hh: item.frame.h / 2,
		};
		let spriteSourceSize = {
			x: item.spriteSourceSize.x,
			y: item.spriteSourceSize.y,
			w: item.spriteSourceSize.w,
			h: item.spriteSourceSize.h,
		};
		let sourceSize = { w: item.sourceSize.w, h: item.sourceSize.h };

		let trimmed = item.trimmed;

		if (item.trimmed && options.trimMode === "crop") {
			trimmed = false;
			spriteSourceSize.x = 0;
			spriteSourceSize.y = 0;
			sourceSize.w = spriteSourceSize.w;
			sourceSize.h = spriteSourceSize.h;
		}

		if (opt.scale !== 1) {
			frame.x *= opt.scale;
			frame.y *= opt.scale;
			frame.w *= opt.scale;
			frame.h *= opt.scale;
			frame.hw *= opt.scale;
			frame.hh *= opt.scale;

			spriteSourceSize.x *= opt.scale;
			spriteSourceSize.y *= opt.scale;
			spriteSourceSize.w *= opt.scale;
			spriteSourceSize.h *= opt.scale;

			sourceSize.w *= opt.scale;
			sourceSize.h *= opt.scale;
		}

		return {
			name: name,
			frame: frame,
			spriteSourceSize: spriteSourceSize,
			sourceSize: sourceSize,
			index: index,
			first: index === 0,
			last: index === data.length - 1,
			rotated: item.rotated,
			trimmed: trimmed,
		};
	});

	return { rects: ret, config: opt };
}

function startExporter(exporter, data, options) {
	let { rects, config } = prepareData(data, options);
	let renderOptions = {
		rects: rects,
		config: config,
		appInfo: options.appInfo || appInfo,
	};

	if (exporter.content) {
		return finishExporter(exporter, renderOptions);
	}

	let filePath;
	if (exporter.predefined) {
		filePath = path.join(__dirname, exporter.template);
	} else {
		filePath = exporter.template;
	}

	exporter.content = fs.readFileSync(filePath).toString();
	return finishExporter(exporter, renderOptions);
}

function finishExporter(exporter, renderOptions) {
	return mustache.render(exporter.content, renderOptions);
}

module.exports.getExporterByType = getExporterByType;
module.exports.startExporter = startExporter;
module.exports.list = list;

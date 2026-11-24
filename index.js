let getPackerByType = require("./packers/index").getPackerByType;
let getExporterByType = require("./exporters/index").getExporterByType;
let getFilterByType = require("./filters").getFilterByType;
let FilesProcessor = require("./FilesProcessor");
let appInfo = require('./package.json');
const { readImage, normalizeTextureFormat } = require("./utils/imageFormats");

function getErrorDescription(txt) {
    return appInfo.name + ": " + txt;
}

function fixPath(path) {
    return path.split("\\").join("/");
}

/**
 * Decodes one image into `files`. A file that cannot be read is recorded in `failures[index]`
 * (as "name (reason)"), so that the whole run can fail with the full list instead of silently
 * packing an atlas without it.
 */
function loadImage(file, files, failures, index) {
	let name = file && typeof file.path === "string" ? fixPath(file.path) : "image #" + index;

	let reading;
	try {
		reading = readImage(file.contents, file.path);
	}
	catch (e) {
		// e.g. a missing file or contents that are not a Buffer
		reading = Promise.reject(e);
	}

	return reading
		.then(image => {
			image.name = name;
			image._base64 = file.contents.toString("base64");
			image.width = image.bitmap.width;
			image.height = image.bitmap.height;
			files[image.name] = image;
		})
		.catch(e => {
			failures[index] = name + (e && e.message ? " (" + e.message + ")" : "");
		});
}

/**
 * Packs the images. Every problem is reported through the returned promise (and so through the
 * callback of `pack`): invalid input or options never throw synchronously.
 */
function packAsync(images, options) {
    try {
        return startPacking(images, options);
    }
    catch (error) {
        return Promise.reject(error);
    }
}

function startPacking(images, options) {
    if(!Array.isArray(images)) {
        throw new Error(getErrorDescription("images must be an array"));
    }

    if(!images.length) {
        throw new Error(getErrorDescription("No images to pack"));
    }

    options = options || {};
    options = Object.assign({}, options);

    options.textureName = options.textureName === undefined ? "pack-result" : options.textureName;
    options.suffix = options.suffix === undefined ? "-" : options.suffix;
    options.suffixInitialValue = options.suffixInitialValue === undefined ? 0 : options.suffixInitialValue;
    options.width = options.width === undefined ? 2048 : options.width;
    options.height = options.height === undefined ? 2048 : options.height;
    options.powerOfTwo = !!options.powerOfTwo;
    options.fixedSize = options.fixedSize === undefined ? false : options.fixedSize;
    options.padding = options.padding === undefined ? 0 : options.padding;
    options.extrude = options.extrude === undefined ? 0 : options.extrude;
    options.allowRotation = options.allowRotation === undefined ? true : options.allowRotation;
    options.detectIdentical = options.detectIdentical === undefined ? true : options.detectIdentical;
    options.allowTrim = options.allowTrim === undefined ? true : options.allowTrim;
    options.trimMode = options.trimMode === undefined ? "trim" : options.trimMode;
    options.alphaThreshold = options.alphaThreshold === undefined ? 0 : options.alphaThreshold;
    options.removeFileExtension = options.removeFileExtension === undefined ? false : options.removeFileExtension;
    options.prependFolderName = options.prependFolderName === undefined ? true : options.prependFolderName;
    options.textureFormat = options.textureFormat === undefined ? "png" : normalizeTextureFormat(options.textureFormat);
    options.base64Export = options.base64Export === undefined ? false : options.base64Export;
    options.scale = options.scale === undefined ? 1 : options.scale;
    options.scaleMethod = options.scaleMethod === undefined ? "BILINEAR" : options.scaleMethod;
    options.tinify = options.tinify === undefined ? false : options.tinify;
    options.tinifyKey = options.tinifyKey === undefined ? "" : options.tinifyKey;
    options.filter = options.filter === undefined ? "none" : options.filter;

    if(!options.packer) options.packer = "MaxRectsBin";
    if(!options.exporter) options.exporter = "JsonHash";

    let packer = getPackerByType(options.packer);
    if(!packer) {
        throw new Error(getErrorDescription("Unknown packer " + options.packer));
    }

    if(!options.packerMethod) {
        options.packerMethod = packer.defaultMethod;
    }

    let packerMethod = packer.getMethodByType(options.packerMethod);
    if(!packerMethod) {
        throw new Error(getErrorDescription("Unknown packer method " + options.packerMethod));
    }

    let exporter;
    if(typeof options.exporter == "string") {
        exporter = getExporterByType(options.exporter);
    }
    else {
        exporter = options.exporter;
    }

    if(!exporter) {
        throw new Error(getErrorDescription("Unknown exporter " + options.exporter));
    }

	if(!exporter.allowRotation) options.allowRotation = false;
	if(!exporter.allowTrim) options.allowTrim = false;

    let filter = getFilterByType(options.filter);
    if(!filter) {
        throw new Error(getErrorDescription("Unknown filter " + options.filter));
    }

    options.packer = packer;
    options.packerMethod = packerMethod;
    options.exporter = exporter;
    options.filter = filter;

	let files = {};
	let failures = [];
	let p = [];

	images.forEach((file, index) => {
		p.push(loadImage(file, files, failures, index));
	});

    return new Promise((resolve, reject) =>
        Promise.all(p)
            .then(() => {
                let failed = failures.filter(Boolean);
                if(failed.length) {
                    throw new Error(getErrorDescription("Cannot read " + failed.length + (failed.length === 1 ? " image: " : " images: ") + failed.join(", ")));
                }

                FilesProcessor.start(files, options,
                    (res) => resolve(res),
                    (error) => reject(error)
                )
            })
            .catch((error) => reject(error))
    );
}

function pack(images, options, cb) {
    packAsync(images, options)
        .then((result) => cb(result))
        .catch((error) => cb(undefined, error));
}

module.exports = pack;
module.exports.packAsync = packAsync;

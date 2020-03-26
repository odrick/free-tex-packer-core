let Jimp = require("jimp");
let PackProcessor = require("./PackProcessor");
let TextureRenderer = require("./utils/TextureRenderer");
let tinify = require("tinify");
let startExporter = require("./exporters/index").startExporter;

class FilesProcessor {
    
    static start(images, options, callback, errorCallback) {
        PackProcessor.pack(images, options,
            (res) => {
                let packResult = [];
                let resFiles = [];
                let readyParts = 0;

                for(let data of res) {
                    new TextureRenderer(data, options, (renderResult) => {
                        packResult.push({
                            data: renderResult.data,
                            buffer: renderResult.buffer
                        });

                        if(packResult.length >= res.length) {

                            //if this is a multipack
                            if (packResult.length > 1) {
                                //make an array with all the files generated with the corresponding extension
                                options.relatedMultiPacks = packResult.map((_item, index) => ({name:options.textureName + (!options.omitZeroIndex || index > 0 ? "-" + index : "") + "." + options.exporter.fileExt}));
                            }
                            else {
                                //without this I crash when I try to filter out the result
                                options.relatedMultiPacks = [];
                            }

                            let ix = 0;
                            for(let item of packResult) {
                                let fName = options.textureName + (packResult.length > 1  && (!options.omitZeroIndex || ix > 0) ? "-" + ix : "");

                                FilesProcessor.processPackResultItem(fName, item, options, (files) => {
                                    resFiles = resFiles.concat(files);
                                    readyParts++;
                                    if(readyParts >= packResult.length) {
                                        callback(resFiles);
                                    }
                                });

                                ix++;
                            }
                        }
                    });
                }
            },
            (error) => {
                if(errorCallback) errorCallback(error);
            });
    }
    
    static processPackResultItem(fName, item, options, callback) {
        let files = [];

        let pixelFormat = options.textureFormat == "png" ? "RGBA8888" : "RGB888";
        let mime = options.textureFormat == "png" ? Jimp.MIME_PNG : Jimp.MIME_JPEG;

        item.buffer.getBuffer(mime, (err, srcBuffer) => {
            FilesProcessor.tinifyImage(srcBuffer, options, (buffer) => {
                let opts = {
                    imageName: fName + "." + options.textureFormat,
                    imageData: buffer.toString("base64"),
                    format: pixelFormat,
                    textureFormat: options.textureFormat,
                    imageWidth: item.buffer.bitmap.width,
                    imageHeight: item.buffer.bitmap.height,
                    removeFileExtension: options.removeFileExtension,
                    prependFolderName: options.prependFolderName,
                    base64Export: options.base64Export,
                    scale: options.scale,
                    appInfo: options.appInfo,
                    trimMode: options.trimMode,
                    relatedMultiPacks: options.relatedMultiPacks.filter(fileObj => fileObj.name.indexOf(fName + "." + options.exporter.fileExt) === -1) //a file doesn't contain itself in the multipack array
                };
                
                files.push({
                    name: fName + "." + options.exporter.fileExt,
                    buffer: Buffer.from(startExporter(options.exporter, item.data, opts))
                });

                if(!options.base64Export) {
                    files.push({
                        name: fName + "." + options.textureFormat,
                        buffer: buffer
                    });
                }

                callback(files);
            });
        });
    }
    
    static tinifyImage(buffer, options, callback) {
        if(!options.tinify) {
            callback(buffer);
            return;
        }

        tinify.key = options.tinifyKey;

        tinify.fromBuffer(buffer).toBuffer(function(err, result) {
            if (err) throw err;
            callback(result);
        });
    }
}

module.exports = FilesProcessor;
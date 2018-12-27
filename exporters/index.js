let list = require('./list.json');
let appInfo = require('../package.json');
let mustache = require('mustache');
let fs = require('fs');
let path = require('path');

function getExporterByType(type) {
    type = type.toLowerCase();
    
    for(let item of list) {
        if(item.type.toLowerCase() == type) {
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
    opt.base64Prefix = options.textureFormat == "png" ? "data:image/png;base64," : "data:image/jpeg;base64,";

    let ret = [];

    for(let item of data) {

        let name = item.name;

        if(options.trimSpriteNames) {
            name.trim();
        }

        if(options.removeFileExtension) {
            let parts = name.split(".");
            parts.pop();
            name = parts.join(".");
        }

        if(!options.prependFolderName) {
            name = name.split("/").pop();
        }

        let frame = {x: item.frame.x, y: item.frame.y, w: item.frame.w, h: item.frame.h, hw: item.frame.w/2, hh: item.frame.h/2};
        let spriteSourceSize = {x: item.spriteSourceSize.x, y: item.spriteSourceSize.y, w: item.spriteSourceSize.w, h: item.spriteSourceSize.h};
        let sourceSize = {w: item.sourceSize.w, h: item.sourceSize.h};

        ret.push({
            name: name,
            frame: frame,
            spriteSourceSize: spriteSourceSize,
            sourceSize: sourceSize,
            rotated: item.rotated,
            trimmed: item.trimmed
        });

    }

    if(ret.length) {
        ret[0].first = true;
        ret[ret.length-1].last = true;
    }

    return {rects: ret, config: opt};
}

function startExporter(exporter, data, options) {
    let {rects, config} = prepareData(data, options);
    let renderOptions = {
        rects: rects,
        config: config,
        appInfo: appInfo
    };
    
    if(exporter.content) {
        return finishExporter(exporter, renderOptions);
    }
    
    let filePath;
    if(exporter.predefined) {
        filePath = path.join(__dirname, exporter.template);
    }
    else {
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
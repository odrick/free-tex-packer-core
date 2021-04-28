# free-tex-packer-core
[![Stats](https://nodei.co/npm/free-tex-packer-core.png?downloads=true&stars=true)](https://www.npmjs.com/package/free-tex-packer-core) \
Core Free texture packer module

# Install
   
$ npm install free-tex-packer-core
   
# Basic usage
```js
let texturePacker = require("free-tex-packer-core");

let images = [];

images.push({path: "img1.png", contents: fs.readFileSync("./img1.png")});
images.push({path: "img2.png", contents: fs.readFileSync("./img2.png")});
images.push({path: "img3.png", contents: fs.readFileSync("./img3.png")});

texturePacker(images, null, (files, error) => {
    if (error) {
        console.error('Packaging failed', error);
    } else {  
        for(let item of files) {
            console.log(item.name, item.buffer);
        }
    }
});

```

## Asynchronous usage
### Async/await
```js
const { packAsync } = require('free-tex-packer-core');

const images = [
    {path: "img1.png", contents: fs.readFileSync("./img1.png")},
    {path: "img2.png", contents: fs.readFileSync("./img2.png")},
    {path: "img3.png", contents: fs.readFileSync("./img3.png")}
];

async function packImages() {
    try {
        const files = await packAsync(images, null);
        for(let item of files) {
            console.log(item.name, item.buffer);
        }
    }
    catch(error) {
        console.log(error);
    }
}
```
### Promises
```js
function packImages() {
    packAsync(images, null)
        .then((files) => {
            for(let item of files) {
                console.log(item.name, item.buffer);
            }
        })
        .catch((error) => console.log(error));
}
``` 

# Advanced usage

Use packer options object

```js
let texturePacker = require("free-tex-packer-core");

let options = {
    textureName: "my-texture",
    width: 1024,
    height: 1024,
    fixedSize: false,
    padding: 2,
    allowRotation: true,
    detectIdentical: true,
    allowTrim: true,
    exporter: "Pixi",
    removeFileExtension: true,
    prependFolderName: true
};

let images = [];

images.push({path: "img1.png", contents: fs.readFileSync("./img1.png")});
images.push({path: "img2.png", contents: fs.readFileSync("./img2.png")});
images.push({path: "img3.png", contents: fs.readFileSync("./img3.png")});

texturePacker(images, options, (files, error) => {
    if (error) {
        console.error('Packaging failed', error);
    } else {  
        for(let item of files) {
            console.log(item.name, item.buffer);
        }
    }
});
```

# Available options

* `textureName` - name of output files. Default: **pack-result**
* `suffix` - the suffix used for multiple sprites. Default: **-**
* `suffixInitialValue` - the initial value of the suffix. Default: **0**
* `width` - max single texture width. Default: **2048**
* `height` - max single texture height. Default: **2048**
* `fixedSize` - fix texture size. Default: **false**
* `powerOfTwo` - force power of two textures sizes. Default: **false**
* `padding` - spaces in pixels around images. Default: **0**
* `extrude` - extrude border pixels size around images. Default: **0**
* `allowRotation` - allow image rotation. Default: **true**
* `detectIdentical` - allow detect identical images. Default: **true**
* `allowTrim` - allow trim images. Default: **true**
* `trimMode` - trim or crop. Default: **trim**
* `alphaThreshold` - threshold alpha value. Default: **0**
* `removeFileExtension` - remove file extensions from frame names. Default: **false**
* `prependFolderName` - prepend folder name to frame names. Default: **true**
* `textureFormat` - output file format (png or jpg). Default: **png**
* `base64Export` - export texture as base64 string to atlas meta tag. Default: **false**
* `scale` - scale size and positions in atlas. Default: **1**
* `scaleMethod` - texture scaling method (BILINEAR, NEAREST_NEIGHBOR, BICUBIC, HERMITE, BEZIER). Default: **BILINEAR**
* `tinify` - tinify texture using [TinyPNG](https://tinypng.com/). Default: **false**
* `tinifyKey` - [TinyPNG key](https://tinypng.com/developers). Default: **""**
* `packer` - type of packer (MaxRectsBin, MaxRectsPacker or OptimalPacker). Default: **MaxRectsBin**, recommended **OptimalPacker**
* `packerMethod` - name of pack method (MaxRectsBin: BestShortSideFit, BestLongSideFit, BestAreaFit, BottomLeftRule, ContactPointRule. MaxRectsPacker: Smart, Square, SmartSquare, SmartArea). Default: **BestShortSideFit**
* `exporter` - name of predefined exporter (JsonHash, JsonArray, Css, OldCss, Pixi, GodotAtlas, GodotTileset, PhaserHash, PhaserArray, Phaser3, XML, Starling, Cocos2d, Spine, Unreal, UIKit, Unity3D, Egret2D), or custom exporter (see below). Default: **JsonHash**
* `filter` - name of bitmap filter (grayscale, mask or none). Default: **none**
* `appInfo` - external app info. Required fields: url and version. Default: **null**

# Custom exporter

Exporter property can be object. Fields:

* `fileExt` - files extension
* `template` - path to template file or
* `content` - content of template

Free texture packer uses [mustache](http://mustache.github.io/) template engine.

There are 3 objects passed to template:

**rects** (Array) list of sprites for export

| prop             | type    | description                     |
| ---              | ---     | ---                             |
| name             | String  | sprite name                     |
| frame            | Object  | frame info (x, y, w, h, hw, hh) |
| rotated          | Boolean | sprite rotation flag            |
| trimmed          | Boolean | sprite trimmed flag             |
| spriteSourceSize | Object  | sprite source size (x, y, w, h) |
| sourceSize       | Object  | original size (w, h)            |
| first            | Boolean | first element in array flag     |
| last             | Boolean | last element in array flag      |

**config** (Object) current export config

| prop           | type    | description              |
| ---            | ---     | ---                      |
| imageWidth     | Number  | texture width            |
| imageHeight    | Number  | texture height           |
| scale          | Number  | texture scale            |
| format         | String  | texture format           |
| imageName      | String  | texture name             |
| base64Export   | Boolean | base64 export flag       |
| base64Prefix   | String  | prefix for base64 string |
| imageData      | String  | base64 image data        |

**appInfo** (Object) application info

| prop           | type    | description          |
| ---            | ---     | ---                  |
| displayName    | String  | App name             |
| version        | String  | App version          |
| url            | String  | App url              |

**Template example:**
```
{
  "frames": {
    {{#rects}}
    "{{{name}}}": {
      "frame": {
        "x": {{frame.x}},
        "y": {{frame.y}},
        "w": {{frame.w}},
        "h": {{frame.h}}
      },
      "rotated": {{rotated}},
      "trimmed": {{trimmed}},
      "spriteSourceSize": {
        "x": {{spriteSourceSize.x}},
        "y": {{spriteSourceSize.y}},
        "w": {{spriteSourceSize.w}},
        "h": {{spriteSourceSize.h}}
      },
      "sourceSize": {
        "w": {{sourceSize.w}},
        "h": {{sourceSize.h}}
      },
      "pivot": {
        "x": 0.5,
        "y": 0.5
      }
    }{{^last}},{{/last}}
    {{/rects}}
  },
  "meta": {
    "app": "{{{appInfo.url}}}",
    "version": "{{appInfo.version}}",
    "image": "{{config.imageName}}",
    "format": "{{config.format}}",
    "size": {
      "w": {{config.imageWidth}},
      "h": {{config.imageHeight}}
    },
    "scale": {{config.scale}}
  }
}
```

**Custom template usage example**

```js
let texturePacker = require("free-tex-packer-core");

let images = [];

images.push({path: "img1.png", contents: fs.readFileSync("./img1.png")});
images.push({path: "img2.png", contents: fs.readFileSync("./img2.png")});
images.push({path: "img3.png", contents: fs.readFileSync("./img3.png")});

let exporter = {
    fileExt: "json",
    template: "./MyTemplate.mst"
};

texturePacker(images, {exporter: exporter}, (files, error) => {
    if (error) {
        console.error('Packaging failed', error);
    } else {  
        for(let item of files) {
            console.log(item.name, item.buffer);
        }
    }
});
```

# Used libs

* **Jimp** - https://github.com/oliver-moran/jimp
* **mustache.js** - https://github.com/janl/mustache.js/
* **tinify** - https://github.com/tinify/tinify-nodejs
* **MaxRectsPacker** - https://github.com/soimy/maxrects-packer

---
License: MIT

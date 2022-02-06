let Jimp = require("jimp");

class TextureRenderer {
    
    constructor(data, options={}, callback) {
        this.buffer = null;
        this.extrudeBuffer = null;
        this.data = data;

        this.callback = callback;

        this.width = 0;
        this.height = 0;

        new Jimp(1, 1, 0x0, (err, image) => {
          this.extrudeBuffer = image;
          this.render(data, options);
        });
    }

    static getSize(data, options={}) {
        let width = options.width || 0;
        let height = options.height || 0;
        let padding = options.padding || 0;
        let extrude = options.extrude || 0;

        if(!options.fixedSize) {
            width = 0;
            height = 0;

            for (let item of data) {

                let w = item.frame.x + item.frame.w;
                let h = item.frame.y + item.frame.h;

                if(item.rotated) {
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
            let sw = Math.round(Math.log(width)/Math.log(2));
            let sh = Math.round(Math.log(height)/Math.log(2));

            let pw = Math.pow(2, sw);
            let ph = Math.pow(2, sh);

            if(pw < width) pw = Math.pow(2, sw + 1);
            if(ph < height) ph = Math.pow(2, sh + 1);

            width = pw;
            height = ph;
        }

        return { width, height };
    }
    
    render(data, options={}) {
        let { width, height } = TextureRenderer.getSize(data, options);

        this.width = width;
        this.height = height;

        new Jimp(width, height, 0x0, (err, image) => {
            this.buffer = image;

            for(let item of data) {
                this.renderItem(item, options);
            }
            
            let filter = new options.filter();
            filter.apply(image);

            if(options.scale && options.scale !== 1) {
                let scaleMethod = Jimp.RESIZE_BILINEAR;

                if(options.scaleMethod === "NEAREST_NEIGHBOR") scaleMethod = Jimp.RESIZE_NEAREST_NEIGHBOR;
                if(options.scaleMethod === "BICUBIC") scaleMethod = Jimp.RESIZE_BICUBIC;
                if(options.scaleMethod === "HERMITE") scaleMethod = Jimp.RESIZE_HERMITE;
                if(options.scaleMethod === "BEZIER") scaleMethod = Jimp.RESIZE_BEZIER;

                image.resize(Math.round(width * options.scale) || 1, Math.round(height * options.scale) || 1, scaleMethod);
            }

            if(this.callback) this.callback(this);
        });
    }
    
    renderItem(item, options) {
        if(!item.skipRender) {

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
                img.rotate(-90);

                sx = item.sourceSize.h - item.spriteSourceSize.h - item.spriteSourceSize.y;
                sy = item.spriteSourceSize.x;
                sw = item.spriteSourceSize.h;
                sh = item.spriteSourceSize.w;
                ow = item.sourceSize.h;
                oh = item.sourceSize.w;
            }

            if(options.extrude) {
                //Render corners
                this.prepareExtrudeBuffer(1, 1);
                this.extrudeBuffer.blit(img, 0, 0, 0, 0, 1, 1);
                this.extrudeBuffer.resize(options.extrude, options.extrude);
                this.buffer.blit(this.extrudeBuffer, dx - options.extrude, dy - options.extrude, 0, 0, options.extrude, options.extrude);

                this.prepareExtrudeBuffer(1, 1);
                this.extrudeBuffer.blit(img, 0, 0, ow-1, 0, 1, 1);
                this.extrudeBuffer.resize(options.extrude, options.extrude);
                this.buffer.blit(this.extrudeBuffer, dx + sw, dy - options.extrude, 0, 0, options.extrude, options.extrude);

                this.prepareExtrudeBuffer(1, 1);
                this.extrudeBuffer.blit(img, 0, 0, 0, oh-1, 1, 1);
                this.extrudeBuffer.resize(options.extrude, options.extrude);
                this.buffer.blit(this.extrudeBuffer, dx - options.extrude, dy + sh, 0, 0, options.extrude, options.extrude);

                this.prepareExtrudeBuffer(1, 1);
                this.extrudeBuffer.blit(img, 0, 0, ow-1, oh-1, 1, 1);
                this.extrudeBuffer.resize(options.extrude, options.extrude);
                this.buffer.blit(this.extrudeBuffer, dx + sw, dy + sh, 0, 0, options.extrude, options.extrude);

                //Render borders
                this.prepareExtrudeBuffer(1, sh);
                this.extrudeBuffer.blit(img, 0, 0, 0, sy, 1, sh);
                this.extrudeBuffer.resize(options.extrude, sh);
                this.buffer.blit(this.extrudeBuffer, dx - options.extrude, dy, 0, 0, options.extrude, sh);

                this.prepareExtrudeBuffer(1, sh);
                this.extrudeBuffer.blit(img, 0, 0, ow-1, sy, 1, sh);
                this.extrudeBuffer.resize(options.extrude, sh);
                this.buffer.blit(this.extrudeBuffer, dx + sw, dy, 0, 0, options.extrude, sh);

                this.prepareExtrudeBuffer(sw, 1);
                this.extrudeBuffer.blit(img, 0, 0, sx, 0, sw, 1);
                this.extrudeBuffer.resize(sw, options.extrude);
                this.buffer.blit(this.extrudeBuffer, dx, dy - options.extrude, 0, 0, sw, options.extrude);

                this.prepareExtrudeBuffer(sw, 1);
                this.extrudeBuffer.blit(img, 0, 0, sx, oh-1, sw, 1);
                this.extrudeBuffer.resize(sw, options.extrude);
                this.buffer.blit(this.extrudeBuffer, dx, dy + sh, 0, 0, sw, options.extrude);
            }

            this.buffer.blit(img, dx, dy, sx, sy, sw, sh);
        }
    }

    prepareExtrudeBuffer(width, height) {
      this.extrudeBuffer.resize(width, height);
      this.extrudeBuffer.bitmap.data.fill(0);
    }
}

module.exports = TextureRenderer;

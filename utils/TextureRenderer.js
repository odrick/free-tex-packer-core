let Jimp = require("jimp");

class TextureRenderer {
    
    constructor(data, options={}, callback) {
        this.buffer = null;
        this.data = data;

        this.callback = callback;

        this.width = 0;
        this.height = 0;
        
        this.render(data, options);
    }
    
    render(data, options={}) {
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

        this.width = width;
        this.height = height;

        new Jimp(width, height, 0x0, (err, image) => {
            this.buffer = image;

            for(let item of data) {
                this.renderItem(item, options);
            }
            
            let filter = new options.filter();
            filter.apply(image);

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

            if (item.rotated) {
                img = img.clone();
                img.rotate(90);

                sx = item.sourceSize.h - item.spriteSourceSize.h - item.spriteSourceSize.y;
                sy = item.spriteSourceSize.x;
                sw = item.spriteSourceSize.h;
                sh = item.spriteSourceSize.w;
            }

            this.buffer.blit(img, dx, dy, sx, sy, sw, sh);

            if(options.extrude) {
                img = img.clone();

                let rw = sw + options.extrude*2;
                let rh = sh + options.extrude*2;

                img.resize(rw, rh);

                for(let i=1; i<=options.extrude; i++) {
                    this.buffer.blit(img, dx - options.extrude, dy - i, 0, 0, rw, 1);
                    this.buffer.blit(img, dx - options.extrude, dy + sh + i - 1, 0, 0, rw, 1);
                    this.buffer.blit(img, dx - i, dy - options.extrude, 0, 0, 1, rh);
                    this.buffer.blit(img, dx + sw + i - 1, dy - options.extrude, 0, 0, 1, rh);
                }
            }
        }
    }
}

module.exports = TextureRenderer;
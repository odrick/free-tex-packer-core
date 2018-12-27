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

            width += padding;
            height += padding;

        }

        this.width = width;
        this.height = height;

        new Jimp(width, height, 0x0, (err, image) => {
            this.buffer = image;

            for(let item of data) {
                this.renderItem(item);
            }
            
            let filter = new options.filter();
            filter.apply(image);

            if(this.callback) this.callback(this);
        });
    }
    
    renderItem(item) {
        if(!item.skipRender) {

            let img = item.image;

            if (item.rotated) {
                img = img.clone();
                img.rotate(90);
				
                this.buffer.blit(img,
                    item.frame.x,
                    item.frame.y,
                    item.sourceSize.h - item.spriteSourceSize.h - item.spriteSourceSize.y,
                    item.spriteSourceSize.x,
                    item.spriteSourceSize.h,
                    item.spriteSourceSize.w);
            }
            else {
                this.buffer.blit(img,
                    item.frame.x,
                    item.frame.y,
                    item.spriteSourceSize.x,
                    item.spriteSourceSize.y,
                    item.spriteSourceSize.w,
                    item.spriteSourceSize.h);
            }
        }
    }
}

module.exports = TextureRenderer;
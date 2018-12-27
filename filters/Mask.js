let Filter = require('./Filter');

class Mask extends Filter {
    constructor() {
        super();
    }

    apply(image) {
        let imageData = image.bitmap;
        
        for(let i=0; i<imageData.data.length; i+=4) {
            if(imageData.data[i+3] == 0) {
                imageData.data[i] = 0;
                imageData.data[i+1] = 0;
                imageData.data[i+2] = 0;
            }
            else {
                imageData.data[i] = 255;
                imageData.data[i+1] = 255;
                imageData.data[i+2] = 255;
            }
        }
        
        return image;
    }

    static get type() {
        return "mask";
    }
}

module.exports = Mask;
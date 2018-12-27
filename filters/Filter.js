class Filter {
    constructor() {
    }

    apply(image) {
        return image;
    }
    
    static get type() {
        return "none";
    }
}

module.exports = Filter;
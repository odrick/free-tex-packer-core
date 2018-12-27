let Filter = require('./Filter');
let Mask = require('./Mask');
let Grayscale = require('./Grayscale');

const list = [
    Filter,
    Mask,
    Grayscale
];

function getFilterByType(type) {
    type = type.toLowerCase();
    
    for(let item of list) {
        if(item.type.toLowerCase() == type) {
            return item;
        }
    }
    return null;
}

module.exports.getFilterByType = getFilterByType;
module.exports.list = list;
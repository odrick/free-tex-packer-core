let MaxRectsPacker = require("./MaxRectsPacker");
let MaxRectsBin = require("./MaxRectsBin");
let OptimalPacker = require("./OptimalPacker");

const list = [
    MaxRectsBin,
    MaxRectsPacker,
    OptimalPacker
];

function getPackerByType(type) {
    type = type.toLowerCase();
    
    for(let item of list) {
        if(item.type.toLowerCase() === type) {
            return item;
        }
    }
    return null;
}

module.exports.getPackerByType = getPackerByType;
module.exports.list = list;
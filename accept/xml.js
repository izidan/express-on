const camelcase = require('camelcase-keys');
const { toObject } = require('./../regex');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const parser = new XMLParser({
    attrNodeName: false, attributeNamePrefix: '@', textNodeName: '@', cdataTagName: false,
    trimValues: true, parseAttributeValue: false, parseNodeValue: false, parseTrueNumberOnly: true,
    arrayMode: false, ignoreAttributes: false, ignoreNameSpace: false, allowBooleanAttributes: true,
    parseTagValue: false,
})

const builder = new XMLBuilder({
    attrNodeName: false, attributeNamePrefix: '@', textNodeName: '@', cdataTagName: false,
    format: false, ignoreAttributes: false, ignoreNameSpace: false, supressEmptyNode: false,
    //attrValueProcessor: v => v && v.constructor.prototype.toJSON ? v.toJSON() : v,
    //tagValueProcessor: v => v && v.constructor.prototype.toJSON ? v.toJSON() : v
});

const parse = str => {
    let obj = parser.parse(str);
    // force toJSON to handle custom parsing on values independent from the built-in parser
    obj = JSON.parse(JSON.stringify(obj), (k, v) => toObject(v));
    //obj = Object.values(obj['xml'] || obj || {}).pop();
    obj = Object.values(obj).pop() || {};
    let keys = Object.keys(obj)
    if (keys.length === 1 && Array.isArray(obj[keys[0]]))
        obj = obj[keys[0]]
    return obj ? camelcase(obj, { deep: true }) : obj;
};

const stringify = function (obj) {
    // force toJSON and date transformation in arrays
    obj = JSON.parse(JSON.stringify(obj));
    let root = (obj['@xsi:type'] || this.locals.xml || typeof obj).split(':').pop();
    root = root.replace(/^[A-Z]+(?=($|[A-Z][a-z]))/, t => t.toLowerCase());
    if (root === obj['@xsi:type'])
        delete obj['@xsi:type'];
    if (!obj['@id'] && !!obj._id) {
        obj['@id'] = obj._id;
        delete obj._id;
    }
    let str = builder.build({ [root]: obj });
    return str.replace(/<\/?@+>/g, '')
};

module.exports = { parse, stringify };
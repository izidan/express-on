const xml = require('fast-xml-parser');

const x2jOptions = {
    attrNodeName: false, attributeNamePrefix: "@", textNodeName: "@", cdataTagName: false,
    trimValues: true, parseAttributeValue: false, parseNodeValue: true, parseTrueNumberOnly: true,
    arrayMode: false, ignoreAttributes: false, ignoreNameSpace: false, allowBooleanAttributes: true,
};

const j2xOptions = {
    attrNodeName: false, attributeNamePrefix: "@", textNodeName: "@", cdataTagName: false,
    format: false, ignoreAttributes: false, ignoreNameSpace: false, supressEmptyNode: false,
};

describe.skip('xml parser', () => {

    it('correctly formats 0.0', () => {
        let j2x = new xml.j2xParser(j2xOptions);
        expect(j2x.parse({ number: 0.0 })).toEqual("<number>0</number>");
    });

    it('correctly parse "0.0" as a number 0', () => {
        expect(xml.parse("<number>0.0</number>", x2jOptions)).toEqual({ number: 0 });
    });

    it('correctly format date array', () => {
        let j2x = new xml.j2xParser(j2xOptions);
        let dates = [new Date(2018, 1, 1), new Date(2019, 1, 1), new Date(2020, 1, 1)];
        expect(j2x.parse({ dates: dates })).not.toEqual("<dates></dates><dates></dates><dates></dates>");
    });

});
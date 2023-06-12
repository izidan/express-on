const { XMLBuilder, XMLParser } = require('fast-xml-parser');

const x2jOptions = {
    attrNodeName: false, attributeNamePrefix: "@", textNodeName: "@", cdataTagName: false,
    trimValues: true, parseAttributeValue: false, parseNodeValue: true, parseTrueNumberOnly: true,
    arrayMode: false, ignoreAttributes: false, ignoreNameSpace: false, allowBooleanAttributes: true,
};

const j2xOptions = {
    attrNodeName: false, attributeNamePrefix: "@", textNodeName: "@", cdataTagName: false,
    format: false, ignoreAttributes: false, ignoreNameSpace: false, supressEmptyNode: false,
};

describe('xml parser', () => {

    it('correctly format 0.0', () => {
        let j2x = new XMLBuilder(j2xOptions);
        expect(j2x.build({ number: 0.0 })).toEqual("<number>0</number>");
    });

    it('correctly parse "0.0" as a number 0', () => {
        let x2j = new XMLParser(x2jOptions);
        expect(x2j.parse("<number>0.0</number>")).toEqual({ number: 0 });
    });

    xit('correctly format date array', () => {
        let j2x = new XMLBuilder(j2xOptions);
        let dates = [new Date(2018, 1, 1), new Date(2019, 1, 1), new Date(2020, 1, 1)];
        expect(j2x.build({ dates: dates })).not.toEqual("<dates></dates><dates></dates><dates></dates>");
    });

});
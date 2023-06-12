require('mongodb');
const fs = require('fs');
const mongoose = require('mongoose');
const app = require('../..');
const { parser } = require('../../accept/csv');

const Schema = mongoose.Schema;
let server;

mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('debug', (process.env.DEBUG || '').match(/mongoose/));

const Countries = new Schema({
    _id: { type: String, alias: 'iso31661Alpha3' },
    name: { type: String, alias: 'cldrDisplayName' },
    '@xsi:type': { type: String, default: 'Country' },
    names: {
        official: {
            ar: { type: String, alias: 'officialNameAr' },
            cn: { type: String, alias: 'officialNameCn' },
            en: { type: String, alias: 'officialNameEn' },
            es: { type: String, alias: 'officialNameEs' },
            fr: { type: String, alias: 'officialNameFr' },
            ru: { type: String, alias: 'officialNameRu' },
        },
        formal: {
            ar: { type: String, alias: 'untermArabicFormal' },
            cn: { type: String, alias: 'untermChineseFormal' },
            en: { type: String, alias: 'untermEnglishFormal' },
            fr: { type: String, alias: 'untermFrenchFormal' },
            ru: { type: String, alias: 'untermRussianFormal' },
            es: { type: String, alias: 'untermSpanishFormal' },
        },
        short: {
            ar: { type: String, alias: 'untermArabicShort' },
            cn: { type: String, alias: 'untermChineseShort' },
            en: { type: String, alias: 'untermEnglishShort' },
            fr: { type: String, alias: 'untermFrenchShort' },
            ru: { type: String, alias: 'untermRussianShort' },
            es: { type: String, alias: 'untermSpanishShort' },
        }
    },
    capital: String,
    continent: String,
    iso: {
        alpha2: { alias: 'iso31661Alpha2', type: String },
        alpha3: { alias: 'iso31661Alpha3', type: String },
        numeric: { alias: 'iso31661Numeric', type: Number }
    },
    currency: { type: [String], alias: 'iso4217CurrencyAlphabeticCode', set: v => v ? v.toString().split(',') : v },
    languages: { type: [String], set: v => v ? v.toString().split(',') : v },
    independent: { type: Object, alias: 'isIndependent' },
    region: {
        code: { type: Number, alias: 'regionCode' },
        name: { type: String, alias: 'regionName' },
        subCode: { type: Number, alias: 'subRegionCode' },
        subName: { type: String, alias: 'subRegionName' },
        intermediateCode: { type: Number, alias: 'intermediateRegionCode' },
        intermediateName: { type: String, alias: 'intermediateRegionName' },
    }
    /*
    iso4217CurrencyAlphabeticCode: undefined,
    iso4217CurrencyCountryName: undefined,
    iso4217CurrencyMinorUnit: undefined,
    iso4217CurrencyName: undefined,
    iso4217CurrencyNumericCode: undefined,
    m49: 680,
    ds: undefined,
    developedDevelopingCountries: 'Developed',
    dial: undefined,
    edgar: undefined,
    fifa: undefined,
    fips: undefined,
    gaul: undefined,
    geonameId: undefined,
    globalCode: 'True',
    globalName: 'World',
    ioc: undefined,
    itu: undefined,
    landLockedDevelopingCountriesLldc: undefined,
    leastDevelopedCountriesLdc: undefined,
    marc: undefined,
    smallIslandDevelopingStatesSids: undefined,
    tld: undefined,
    wmo: undefined,
    */
}, { strict: false, versionKey: false });

const Country = mongoose.model('country', Countries).findBy('iso31661Alpha3').select('-names');

module.exports = {
    app: () => app,
    server: () => server,
    deinit: async () => {
        await server.close();
        return mongoose.disconnect();
    },
    init: async () => {
        let countries = [];
        server = await app.listen();
        await mongoose.connect(global.__MONGO_URI__);
        return new Promise(resolve => fs.createReadStream('test/data/country-codes.csv').pipe(parser())
            .on('data', row => countries.push(row))
            .on('end', () => Country.deleteMany({}).then(() => Country.insertMany(countries).then(resolve))))
        return mongoose.connect(global.__MONGO_URI__);
    },
};

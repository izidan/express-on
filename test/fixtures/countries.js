import('mongodb');
import fs from 'fs';
import mongoose from 'mongoose';
import app from '../../index.js';
import { parser } from '../../accept/csv.js';

const Schema = mongoose.Schema;
let server;

const Countries = new Schema({
    _id: { type: String, default: function () { return this.iso31661Alpha3 || this.m49 } },
    name: { type: String, alias: 'cldrDisplayName' },
    '@xsi:type': { type: String, default: 'Country' },
    capital: String,
    continent: String,
    currency: { type: [String], default: undefined, alias: 'iso4217CurrencyAlphabeticCode', set: v => v ? v.toString().split(',') : v },
    languages: { type: [String], default: undefined, set: v => v ? v.toString().split(',') : v },
    independent: { type: Object, alias: 'isIndependent' },
    'iso.alpha2': { alias: 'iso31661Alpha2', type: String },
    'iso.alpha3': { alias: 'iso31661Alpha3', type: String },
    'iso.numeric': { alias: 'iso31661Numeric', type: Number },
    'iso.currency.name': { type: String, alias: 'iso4217CurrencyName' },
    'iso.currency.minorUnit': { type: String, alias: 'iso4217CurrencyMinorUnit' },
    'iso.currency.countryName': { type: String, alias: 'iso4217CurrencyCountryName' },
    'iso.currency.numericCode': { type: String, alias: 'iso4217CurrencyNumericCode' },
    'region.code': { type: Number, alias: 'regionCode' },
    'region.name': { type: String, alias: 'regionName' },
    'region.subCode': { type: Number, alias: 'subRegionCode' },
    'region.subName': { type: String, alias: 'subRegionName' },
    'region.intermediateCode': { type: Number, alias: 'intermediateRegionCode' },
    'region.intermediateName': { type: String, alias: 'intermediateRegionName' },
    'names.official.ar': { type: String, alias: 'officialNameAr' },
    'names.official.cn': { type: String, alias: 'officialNameCn' },
    'names.official.en': { type: String, alias: 'officialNameEn' },
    'names.official.es': { type: String, alias: 'officialNameEs' },
    'names.official.fr': { type: String, alias: 'officialNameFr' },
    'names.official.ru': { type: String, alias: 'officialNameRu' },
    'names.formal.ar': { type: String, alias: 'untermArabicFormal' },
    'names.formal.cn': { type: String, alias: 'untermChineseFormal' },
    'names.formal.en': { type: String, alias: 'untermEnglishFormal' },
    'names.formal.fr': { type: String, alias: 'untermFrenchFormal' },
    'names.formal.ru': { type: String, alias: 'untermRussianFormal' },
    'names.formal.es': { type: String, alias: 'untermSpanishFormal' },
    'names.short.ar': { type: String, alias: 'untermArabicShort' },
    'names.short.cn': { type: String, alias: 'untermChineseShort' },
    'names.short.en': { type: String, alias: 'untermEnglishShort' },
    'names.short.fr': { type: String, alias: 'untermFrenchShort' },
    'names.short.ru': { type: String, alias: 'untermRussianShort' },
    'names.short.es': { type: String, alias: 'untermSpanishShort' },
    m49: Number,
    /*
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

const Country = mongoose.model('country', Countries).select('-names');

export default {
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

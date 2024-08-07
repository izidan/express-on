import supertest from 'supertest';
import fixture from './fixtures/countries.js';

describe('GET distinct', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    const request = () => supertest(fixture.app());

    it('get distinct values', () =>
        request().get('/api/countries')
            .query({ distinct: 'continent' })
            .expect(200, ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA']));

    it('get distinct values using alias', () =>
        request().get('/api/countries')
            .query({ distinct: 'regionName' })
            .expect(200, ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']));

    it('get distinct values using dotted field', () =>
        request().get('/api/countries')
            .query({ distinct: 'region.name' })
            .expect(200, ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']));

    it('count distinct values', () =>
        request().get('/api/countries').query({ distinct: 'continent', count: true })
            .expect(200, '7'));

    it('sort distinct values', () =>
        request().get('/api/countries')
            .query({ distinct: 'continent', sort: 'continent' })
            .expect(200, ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA']));

    it('get distinct values filtered by currency', () =>
        request().get('/api/countries')
            .query({ distinct: 'continent', conditions: { currency: 'USD' } })
            .expect(200, ['AS', 'NA', 'OC', 'SA']));

    it('count distinct values filtered by currency', () =>
        request().get('/api/countries')
            .query({ distinct: 'continent', count: true, conditions: { currency: 'USD' } })
            .expect(200, '4'));

    xit('get distinct values with null in last', () =>
        request().put('/api/countries/USA')
            .send({ continent: null })
            .expect(200, '1')
            .then(() => request().get('/api/countries')
                .query({ distinct: 'continent' })
                .expect(200, ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA', null])));

    xit('get distinct values with null in between', () =>
        request().put('/api/countries/ALB')
            .send({ continent: null })
            .expect(200, '1')
            .then(() => request().get('/api/countries')
                .query({ distinct: 'continent' })
                .expect(200, ['AS', null, 'AF', 'OC', 'EU', 'NA', 'AN', 'SA'])));

    it('get distinct values with null in first', () =>
        request().put('/api/countries/TWN')
            .send({ continent: null })
            .expect(200, '1')
            .then(() => request().get('/api/countries')
                .query({ distinct: 'continent' })
                .expect(200, [null, 'AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA'])));

    it('sort distinct values with null', () =>
        request().put('/api/countries/TWN')
            .send({ continent: null })
            .expect(200, '1')
            .then(() => request().get('/api/countries')
                .query({ distinct: 'continent', sort: 'continent' })
                .expect(200, ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA', null])));

    it('count distinct values including null', () =>
        request().put('/api/countries/TWN')
            .send({ continent: null })
            .expect(200, '1')
            .then(() => request().get('/api/countries')
                .query({ distinct: 'continent', count: true })
                .expect(200, '8')));

    it('get distinct by non-existent field should return empty array', () =>
        request().get('/api/countries')
            .query({ distinct: 'non-existent' })
            .expect(200, []));

    it('count distinct by non-existent field should return zero', () =>
        request().get('/api/countries').query({ distinct: 'non-existent', count: true })
            .expect(200, '0'));

    it('get distinct values on single document', () =>
        request().get('/api/countries/EGY')
            .query({ distinct: 'continent' })
            .expect(200, ['AF']));

    it('count distinct values on single document', () =>
        request().get('/api/countries/EGY')
            .query({ distinct: 'continent', count: true })
            .expect(200, '1'));

    it('get distinct values on single document with null value', () =>
        request().put('/api/countries/TWN')
            .send({ continent: null })
            .expect(200, '1')
            .then(() => request().get('/api/countries/TWN')
                .query({ distinct: 'continent' })
                .expect(200, [null])));

    it('count distinct values on single document with null value', () =>
        request().put('/api/countries/TWN')
            .send({ continent: null })
            .expect(200, '1')
            .then(() => request().get('/api/countries/TWN')
                .query({ distinct: 'continent', count: true })
                .expect(200, '1')));

    it('get distinct values on single document with array value', () =>
        request().put('/api/countries/TWN')
            .send({ continents: ['AS', 'AS', 'XX'] })
            .expect(200, '1')
            .then(() => request().get('/api/countries/TWN')
                .query({ distinct: 'continents' })
                .expect(200, ['AS', 'XX'])));

    it('count distinct values on single document with array value', () =>
        request().get('/api/countries/TWN')
            .query({ distinct: 'continents', count: true })
            .expect(200, '2'));

    it('count distinct values on single document with null attribute', () =>
        request().patch('/api/countries/TWN')
            .send({ continents: null })
            .expect(200, '1')
            .then(() => request().get('/api/countries/TWN')
                .query({ distinct: 'continents', count: true })
                .expect(200, '0')));
});
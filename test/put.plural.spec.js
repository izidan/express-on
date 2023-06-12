const fs = require('fs');
const supertest = require('supertest');
const camelcase = require('camelcase-keys');
const fixture = require('./fixtures/countries');

describe('PUT plural', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    const request = () => supertest(fixture.app());

    it('re-create countries from json', () =>
        request().put('/api/countries')
            .set('Content-type', 'application/json')
            .send(camelcase(JSON.parse(fs.readFileSync('./test/data/country-codes.json', 'utf-8'))))
            .expect(201, '250')
            .then(({ headers }) =>
                request().get(headers.location + '&distinct=_id')
                    .then(({ body }) => expect(body).toHaveLength(249))));

    it('re-create countries from csv', () =>
        request().put('/api/countries')
            .set('Content-type', 'text/csv')
            .send(fs.readFileSync('./test/data/country-codes.csv', 'utf-8'))
            .expect(201, '250')
            .then(({ headers }) =>
                request().get(headers.location + '&distinct=_id')
                    .then(({ body }) => expect(body).toHaveLength(249))));

    it('re-create countries from tsv', () =>
        request().put('/api/countries')
            .set('Content-type', 'text/tsv')
            .send(fs.readFileSync('./test/data/country-codes.tsv', 'utf-8'))
            .expect(201, '250')
            .then(({ headers }) =>
                request().get(headers.location + '&distinct=_id')
                    .then(({ body }) => expect(body).toHaveLength(249))));

    it('re-create countries from xml', () =>
        request().put('/api/countries')
            .set('Content-type', 'text/xml')
            .send(fs.readFileSync('./test/data/country-codes.xml', 'utf-8'))
            .expect(201, '250')
            .then(({ headers }) =>
                request().get(headers.location + '&distinct=_id')
                    .then(({ body }) => expect(body).toHaveLength(249))));
})
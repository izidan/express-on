import fs from 'fs';
import supertest from 'supertest';
import camelcase from 'camelcase-keys';
import fixture from './fixtures/countries.js';

describe('PUT plural', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    const request = () => supertest(fixture.app());

    it('re-create countries from json', () =>
        request().put('/api/countries')
            .set('Content-type', 'application/json')
            .send(camelcase(JSON.parse(fs.readFileSync('./test/data/country-codes.json', 'utf-8'))))
            .expect(201)
            .then(({ headers }) =>
                request().get(headers.location + '&distinct=_id')
                    .then(({ body }) => expect(body).toHaveLength(250))));

    it('re-create countries from csv', () =>
        request().put('/api/countries')
            .set('Content-type', 'text/csv')
            .send(fs.readFileSync('./test/data/country-codes.csv', 'utf-8'))
            .expect(201)
            .then(({ headers }) =>
                request().get(headers.location + '&distinct=_id')
                    .then(({ body }) => expect(body).toHaveLength(250))));

    it('re-create countries from tsv', () =>
        request().put('/api/countries')
            .set('Content-type', 'text/tsv')
            .send(fs.readFileSync('./test/data/country-codes.tsv', 'utf-8'))
            .expect(201)
            .then(({ headers }) =>
                request().get(headers.location + '&distinct=_id')
                    .then(({ body }) => expect(body).toHaveLength(250))));

    it('re-create countries from xml', () =>
        request().put('/api/countries')
            .set('Content-type', 'text/xml')
            .send(fs.readFileSync('./test/data/country-codes.xml', 'utf-8'))
            .expect(201)
            .then(({ headers }) =>
                request().get(headers.location + '&distinct=_id')
                    .then(({ body }) => expect(body).toHaveLength(250))));
})
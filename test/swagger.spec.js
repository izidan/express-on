import fs from 'fs';
import supertest from 'supertest';
import fixture from './fixtures/vegetable.js';

describe('GET swagger', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    const request = () => supertest(fixture.app());

    it('redoc.htm returns the correct html', () =>
        request().get('/redoc.htm')
            .expect(200, /redoc.standalone\.js/));

    it('redoc.html returns the correct html', () =>
        request().get('/redoc.html')
            .expect(200, /redoc.standalone\.js/));

    it('swagger.htm returns the correct html', () =>
        request().get('/swagger.htm')
            .expect(200, /swagger-ui-bundle\.js/));

    it('swagger.html returns the correct html', () =>
        request().get('/swagger.html')
            .expect(200, /swagger-ui-bundle\.js/));

    it('swagger.json returns valid swagger specifications', () =>
        new Promise(resolve => fs.unlink('./public/swagger.json', resolve))
            .then(() => request().get('/swagger.json').expect(302)
                .then(({ headers }) => request().get(headers.location)
                    .expect(200)
                    .then(({ body }) => {
                        expect(body).toHaveProperty('swagger', '2.0');
                        expect(body.parameters.date).toEqual({
                            "in": "path",
                            "name": "date",
                            "description": "close of business (YYYY-MM-DD)",
                            "type": "string",
                            "format": "date",
                            "pattern": "^\\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$",
                            "required": true
                        });
                        let { responses } = body.paths['/vegetables'].get;
                        expect(Object.keys(responses)).toEqual(['200', '400', '401', '403', '404', '415', '422', '500']);
                        expect(responses['200'].schema).toEqual({
                            type: 'array',
                            items: {
                                anyOf: [
                                    { '$ref': '#/definitions/Vegetable' },
                                    { '$ref': '#/definitions/Mineral' },
                                    { '$ref': '#/definitions/Animal' }
                                ]
                            },
                            xml: { name: 'xml' }
                        })
                        expect(body.definitions.Vegetable).toHaveProperty('properties');
                        expect(body.definitions.Mineral).toHaveProperty('properties');
                        expect(body.definitions.Animal).toHaveProperty('properties');
                        expect(body.definitions.Vegetable.properties).toHaveProperty('date', { type: 'array', items: { type: 'date' } });

                    }))));
});
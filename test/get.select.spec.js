import supertest from 'supertest';
import fixture from './fixtures/countries.js';

describe('GET select', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    const request = () => supertest(fixture.app());

    it('select an aliased field', () =>
        request().get('/api/countries/USA')
            .query({ select: 'regionName' })
            .expect(200, { region: { name: 'Americas' }, _id: 'USA' }))

    it('deselect an aliased field', () =>
        request().get('/api/countries/USA')
            .query({ select: '-regionName' })
            .expect(200)
            .then(({ body }) => {
                expect(body).not.toHaveProperty('names');
                expect(body).toHaveProperty('region');
                expect(body.region).not.toHaveProperty('name');
            }))

    it('select an aliased field without id', () =>
        request().get('/api/countries/USA')
            .query({ select: '-_id regionName' })
            .expect(200, { region: { name: 'Americas' } }))

    it('deselect an aliased field without id', () =>
        request().get('/api/countries/USA')
            .query({ select: '-_id -regionName' })
            .expect(200)
            .then(({ body }) => {
                expect(body).not.toHaveProperty('names');
                expect(body).toHaveProperty('region');
                expect(body.region).not.toHaveProperty('name');
            }))

    it('select an aliased field with original field', () =>
        request().get('/api/countries/USA')
            .query({ select: '-_id region.name' })
            .expect(200, { region: { name: 'Americas' } }))

    it('deselect an aliased field with original field', () =>
        request().get('/api/countries/USA')
            .query({ select: '-_id -region.name' })
            .expect(200)
            .then(({ body }) => {
                expect(body).not.toHaveProperty('names');
                expect(body).toHaveProperty('region');
                expect(body.region).not.toHaveProperty('name');
            }))

    it('select using an object with numbers', () =>
        request().get('/api/countries/USA')
            .query({ select: { _id: 0, regionName: 1, 'region.name': 1 } })
            .expect(200, { region: { name: 'Americas' } }))

    it('select using an object with booleans', () =>
        request().get('/api/countries/USA')
            .query({ select: { _id: false, regionName: true, 'region.name': true } })
            .expect(200, { region: { name: 'Americas' } }))
});
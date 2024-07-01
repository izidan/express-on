import supertest from 'supertest';
import fixture from './fixtures/countries.js';

describe('GET alias', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    const request = () => supertest(fixture.app());

    it('filter by schema field', () =>
        request().get('/api/countries')
            .query({ select: 'regionName', capital: 'Washington' })
            .expect(200, [{ region: { name: 'Americas' }, _id: 'USA' }]))

    it('filter by schema field', () =>
        request().get('/api/countries/USA')
            .query({ select: 'regionName', capital: 'London' })
            .expect(404))

    it('filter by schema field without id', () =>
        request().get('/api/countries/USA')
            .query({ select: '-_id regionName', capital: 'Washington' })
            .expect(200, { region: { name: 'Americas' } }))

});
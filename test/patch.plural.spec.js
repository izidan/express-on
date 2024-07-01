import supertest from 'supertest';
import fixture from './fixtures/vegetable.js';

describe('PATCH plural', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    beforeEach(fixture.create);
    const request = () => supertest(fixture.app());

    it("should update the addressed objects if exists", () => {
        return request().get('/api/vegetables/')
            .query({ select: '-_id related', related: { $exists: true }, nutrients: { $size: 1 } })
            .expect(200)
            .then(({ body }) => {
                expect(body).toHaveLength(8);
                return request().patch('/api/vegetables/')
                    .query({ related: { $exists: true } })
                    .send({ tasty: true, related: null, nutrients: '$nutrition' })
                    .expect(200, body.length.toString())
                    .then(({ headers }) => {
                        expect(headers).not.toHaveProperty('location');
                        return request().get('/api/vegetables/')
                            .query({
                                nutrients: { $exists: false },
                                related: { $exists: false },
                                nutrition: { $size: 1 },
                                tasty: true,
                                count: true,
                            })
                            .expect(200, body.length.toString());
                    });
            });
    });

    it("should 422 on no document", () => {
        return request().patch('/api/vegetables/')
            .query({ related: { $exists: true } })
            .expect(422, /"message":"The request body must contain exactly one document"/)
    });

    it("should 422 on no query find", () => {
        return request().patch('/api/vegetables/')
            .send({ name: 'Pea Shoot' })
            .expect(403, /"message":"Must specify find criteria for the requested operation"/)
    });

    it("should 422 on multiple documents", () => {
        return request().patch('/api/vegetables/')
            .query({ related: { $exists: true } })
            .send([{ name: 'Pea Shoot' }, { name: 'Bitter Melon' }])
            .expect(422, /"message":"The request body must contain exactly one document"/)
    });
});
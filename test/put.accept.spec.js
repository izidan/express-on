const supertest = require('supertest');
const fixture = require('./fixtures/vegetable');

describe('PUT singular accept', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    beforeEach(fixture.create);
    const request = () => supertest(fixture.app());

    it("should replace the addressed xml object if it exists", () => {
        let radicchio = fixture.vegetables[7];
        return request().get('/api/vegetables/' + radicchio._id)
            .expect(200)
            .then(({ body }) => {
                expect(body).toHaveProperty('name', 'Radicchio');
                // put the leek on the server
                return request().put('/api/vegetables/' + radicchio._id)
                    .set('Content-type', 'application/xml')
                    .send('<object><name>Leek</name></object>')
                    .expect(200, '1')
                    .then(({ headers }) => {
                        expect(headers).not.toHaveProperty('location');
                        return request().get('/api/vegetables/' + radicchio._id)
                            .query({ select: '-_id name' })
                            .accept('text/xml')
                            .expect(200, '<object><name>Leek</name></object>')
                    });
            });
    });

    it("should 422 on multiple xml documents", () => {
        let radicchio = fixture.vegetables[7];
        return request().get('/api/vegetables/' + radicchio._id)
            .expect(200)
            .then(({ body }) => {
                expect(body).toHaveProperty('name', 'Radicchio');
                // Put some veggies on the server
                return request().put('/api/vegetables/' + radicchio._id).accept('text/xml')
                    .set('Content-type', 'application/xml')
                    .send('<xml><object><name>Pea Shoot</name></object><object><name>Bitter Melon</name></object></xml>')
                    .expect(422, /<message>The request body must contain exactly one document<\/message>/)
            });
    });

    it('should only allow xml updates', () => {
        let id = 'badbadbadbadbadbadbadbad';
        // First check it's not there
        return request().get('/api/vegetables/' + id)
            .expect(404)
            .then(() =>
                // Attempt to update non-existant doc
                request().put('/api/vegetables/' + id).accept('text/xml')
                    .set('Content-type', 'application/xml')
                    .send('<object><name>Cucumber</name></object>')
                    .expect(404, /<message>Not Found<\/message>/)
                    // Make sure it wasn't created
                    .then(() => request().get('/api/vegetables/' + id)
                        .expect(404))
            );
    });

});


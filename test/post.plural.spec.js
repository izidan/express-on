const supertest = require('supertest');
const fixture = require('./fixtures/vegetable');

describe('POST plural', () => {
  beforeAll(fixture.init);
  afterAll(fixture.deinit);
  beforeEach(fixture.create);
  const request = () => supertest(fixture.app());

  it('should create a new object and return its id', () =>
    request().post('/api/vegetables/')
      .send({ name: 'Tomato' })
      .expect(201, '1')
      .then(({ headers }) => request().get(headers.location)
        .expect(200)
        .then(({ body }) => expect(body).toHaveProperty('name', 'Tomato'))
      ));

  it('should correctly set location header when there is no trailing slash', () =>
    request().post('/api/vegetables')
      .send({ name: 'Tomato' })
      .expect(201, '1')
      .then(({ headers }) =>
        expect(headers.location).toMatch(/^\/api\/vegetables\/[a-z|\d]{24}/)
      ));

  it('should allow posting multiple documents at once', () =>
    request().post('/api/vegetables/')
      .send([{ name: 'Catnip' }, { name: 'Cattail' }])
      .expect(201, '2')
      .then(({ headers }) => request().get(headers.location)
        .expect(200)
        .then(({ body }) => {
          expect(body).toHaveLength(2);
          expect(body[0]).toHaveProperty('name', 'Catnip');
          expect(body[1]).toHaveProperty('name', 'Cattail');
        })));

  it('should allow posting multiple documents at once and returns count', () =>
    request().post('/api/vegetables/')
      .query({ count: true })
      .send([{ name: 'Banana' }, { name: 'Apple' }])
      .expect(201, '2')
      .then(({ headers }) => request().get(headers.location)
        .expect(200)
        .then(({ body }) => {
          expect(body).toHaveLength(2);
          expect(body[0]).toHaveProperty('name', 'Banana');
          expect(body[1]).toHaveProperty('name', 'Apple');
        })));

  it('should 422 if no document sent', () =>
    request().post('/api/vegetables/')
      .send([])
      .expect(422, /"message":"The request body must contain at least one document"/));

  xit('should fire pre save Mongoose middleware', () => {
    fixture.saveCount = 0;
    return request().post('/api/vegetables/')
      .send({ name: 'Ground Cherry' })
      .then(() => expect(fixture.saveCount).toBe(1));
  });

  it('should provide correct status and informative body for validation errors', () =>
    request().post('/api/vegetables/')
      .send({ score: -1 })
      .expect(422, /"message":.*?Path `name` is required./)
  );

  xit('should handle malformed JSON inside first-level objects but ignore those outside', () =>
    request().post('/api/vegetables/')
      .send('bababa { cacacaca "name": "Garlic Scape" }')
      .set('Content-Type', 'application/json')
      .expect(400, /"message":.*?"Unexpected token [a-z] in JSON at position \d"/));

});

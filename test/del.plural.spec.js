const supertest = require('supertest');
const fixture = require('./fixtures/vegetable');

describe('DEL plural', () => {
  beforeAll(fixture.init);
  afterAll(fixture.deinit);
  beforeEach(fixture.create);
  const request = () => supertest(fixture.app());

  it('should delete all documents in addressed collection', () =>
    request().del('/api/vegetables/')
      .query({ find: { _id: { $exists: true } } })
      .expect(200, '8')
      .then(() =>
        request().get('/api/vegetables/')
          .query({ count: true })
          .expect(200, '0')));

  it('should delete all documents in addressed collection with property filter', () =>
    request().del('/api/minerals/')
      .query({ color: 'Orange,Yellow,Green' })
      .expect(200, '3')
      .then(() =>
        request().get('/api/minerals/')
          .query({ count: true })
          .expect(200, '5')));

  it('should delete all documents in addressed collection with find condition', () =>
    request().del('/api/minerals/')
      .query({ find: { color: { $in: ['Red', 'Blue', 'Green'] } } })
      .expect(200, '3')
  );

  it('should fails to delete all documents in addressed collection without find condition', () =>
    request().del('/api/minerals/')
      .expect(403)
  );

  xit('should invoke "remove" middleware', () =>
    request().del('/api/vegetables/')
      .then(() => expect(fixture).toHaveProperty('removeCount', 8))
  );
});

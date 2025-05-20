import supertest from 'supertest';
import fixture from './fixtures/vegetable.js';

describe('Queries', () => {
  beforeAll(fixture.init);
  afterAll(fixture.deinit);
  beforeEach(fixture.create);
  const request = () => supertest(fixture.app());

  it('should support field=value1,value2,value3', () =>
    request().get('/api/vegetables?name=Pea,Shitake,Carrot&count=true')
      .expect(200, '3'));

  it('should support find={$or:[{key:value1},{key:value2},{key:value3}]}', () =>
    request().get('/api/vegetables?find={"$or":[{"name":"Pea"},{"name":"Shitake"},{"name":"Carrot"}]}&count=true')
      .expect(200, '3'));

  it('should support skip 1', () =>
    request().get('/api/vegetables?skip=1')
      .expect(200)
      .then(({ body }) => expect(body).toHaveLength(fixture.vegetables.length - 1)));

  it('should support skip 2', () =>
    request().get('/api/vegetables?skip=2')
      .expect(200)
      .then(({ body }) => expect(body).toHaveLength(fixture.vegetables.length - 2)));

  it('should support limit 1', () =>
    request().get('/api/minerals?limit=1')
      .expect(200)
      .then(({ body }) => expect(body).toHaveProperty('color', 'Blue')));

  it('should support limit 2', () =>
    request().get('/api/minerals?limit=2')
      .expect(200)
      .then(({ body }) => expect(body).toHaveLength(2)));

  it('disallows selecting deselected fields', () =>
    request().get('/api/vegetables?select=species+lastModified')
      .expect(403, /"message":"Including excluded fields is not permitted"/));

  it('disallows using +fields with select', () =>
    request().get('/api/vegetables?select=%2Bboiler')
      .expect(403, /"message":"Including excluded fields is not permitted"/));

  it('allows query by Id', () =>
    request().get('/api/vegetables/' + fixture.vegetables[0]._id)
      .expect(200)
      .then(({ body }) => expect(body).toHaveProperty('name', 'Turnip')));

  it('allows default express query string format', () =>
    request().get('/api/vegetables?conditions[name]=Radicchio')
      .expect(200)
      .then(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0]).toHaveProperty('name', 'Radicchio');
      }));

  it('allows selecting fields', () =>
    request().get('/api/vegetables?select=-_id lastModified')
      .expect(200)
      .then(({ body }) => {
        expect(body[0]).not.toHaveProperty('_id');
        expect(body[0]).not.toHaveProperty('name');
        expect(body[0]).toHaveProperty('lastModified');
      }));

  it('allows setting default sort', () =>
    request().get('/api/minerals')
      .expect(200)
      .then(({ body }) => {
        let lastMineral;
        body.forEach(mineral => {
          if (lastMineral) expect(mineral.color.localeCompare(lastMineral)).toBe(1);
          lastMineral = mineral.color;
        });
      }));

  it('allows overriding default sort', () =>
    request().get('/api/minerals?sort=-color')
      .expect(200)
      .then(({ body }) => {
        let lastMineral;
        body.forEach(mineral => {
          if (lastMineral) expect(mineral.color.localeCompare(lastMineral)).toBe(-1);
          lastMineral = mineral.color;
        });
      }));

  it('allows deselecting hyphenated field names', () =>
    request().get('/api/vegetables?select=-hyphenated-field-name')
      .expect(200)
      .then(({ body }) => {
        expect(body[0]).toHaveProperty('_id');
        expect(body[0]).toHaveProperty('__v');
        expect(body[0]).not.toHaveProperty('hpyhenated-field-name');
      }));

  it('should send 400 if limit is invalid', () =>
    request().get('/api/minerals?limit=-1')
      .expect(400, /"message":"Limit must be a positive integer if set"/)
    //expect(headers).not.toHaveProperty('link');
  );

  it('should send all if limit is set to 0', () =>
    request().get('/api/minerals?limit=0')
      .expect(200)
      .then(({ body }) => expect(body).toHaveLength(8))
    //expect(headers).not.toHaveProperty('link');
  );

  it('should send 400 if limit is invalid', () =>
    request().get('/api/minerals?limit=3.6')
      .expect(400, /"message":"Limit must be a positive integer if set"/)
    //expect(headers).not.toHaveProperty('link');
  );

  it('should send 400 if limit is invalid', () =>
    request().get('/api/minerals?limit= asd  asd ')
      .expect(400, /"message":"Limit must be a positive integer if set"/)
    //expect(headers).not.toHaveProperty('link');
  );

  it('should send 400 if skip is invalid', () =>
    request().get('/api/minerals?skip=1.1')
      .expect(400, /"message":"Skip must be a non-negative integer if set"/)
    //expect(headers).not.toHaveProperty('link');
  );

  it('should send 400 if count is invalid', () =>
    request().get('/api/minerals?count=1')
      .expect(400, /"message":"Count must be \\"true\\" or \\"false\\" if set"/)
    //expect(headers).not.toHaveProperty('link');
  );

  it('allows retrieving count instead of documents', () =>
    request().get('/api/vegetables?count=true')
      .expect(200, '8'));

  it('should not send count if count is not set to true', () =>
    request().get('/api/vegetables?count=false')
      .expect(200)
      .then(({ body }) => expect(body).not.toBeInstanceOf(Number)));

  it('should ignore query comments if not enabled', () =>
    request().get('/api/fungi?comment=testing testing 123')
      .expect(200)
      .then(({ body }) => expect(body).toHaveLength(1)));

  it('allows querying for distinct values', () =>
    request().get('/api/vegetables?distinct=name&sort=name')
      .expect(200)
      .then(({ body }) => {
        expect(body).toHaveLength(8);
        expect(body[0]).toBe('Carrot');
        expect(body[1]).toBe('Lima Bean');
        expect(body[2]).toBe('Pea');
        expect(body[3]).toBe('Radicchio');
        expect(body[4]).toBe('Shitake');
        expect(body[5]).toBe('Spinach');
        expect(body[6]).toBe('Turnip');
        expect(body[7]).toBe('Zucchini');
      }));

  it('allows counting for distinct values', () =>
    request().get('/api/vegetables?distinct=name&count=true')
      .expect(200, '8'));

  it('allows querying for distinct values restricted by conditions', () =>
    request().get('/api/vegetables?distinct=name&conditions={ "name": "Carrot" }')
      .expect(200, ['Carrot']));

  it('allows counting for distinct values restricted by conditions', () =>
    request().get('/api/vegetables?distinct=name&count=true&conditions={ "name": "Carrot" }')
      .expect(200, '1'));

  it('should not allow querying for distinct values of deselected paths', () =>
    request().get('/api/fungi?distinct=hyphenated-field-name')
      .expect(403, /"message":"You may not find distinct values for the requested path"/));

  it('allows using query operators with _id', () =>
    request().get('/api/vegetables?conditions={ "_id": { "$exists": true } }')
      .expect(200)
      .then(({ body }) => {
        expect(body).toHaveLength(8);
        expect(body[0]).toHaveProperty('name', 'Turnip');
      }));

  it('should give a 400 if the query string is unpar using query operators with _id', () =>
    request().get('/api/vegetables?conditions={ \'_id\': { \'$gt\': \'111111111111111111111111\' } }')
      .expect(400, /"message":"Expected property name or '}' in JSON at position 2/));

  it('allows explain on plurals', () =>
    request().get('/api/vegetables?explain=true')
      .expect(200)
      .then(({ body }) => {
        expect(body).toHaveProperty('serverInfo');
        expect(body).toHaveProperty('queryPlanner');
        expect(body).toHaveProperty('executionStats');
      }));
});

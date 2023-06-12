const supertest = require('supertest');
const fixture = require('./fixtures/vegetable');

describe('POST plural accept', () => {
    beforeAll(fixture.init);
    afterAll(fixture.deinit);
    beforeEach(fixture.create);
    const request = () => supertest(fixture.app());

    it('should create a new xml object with correct data types', () =>
        request().post('/api/vegetables/')
            .set('Content-type', 'application/xml')
            .send(`<object><name>Mango</name>
            <number>1.10</number><number>1000</number><number>1000.1231</number><number>-0.123</number><number>+0.123</number><number>18032882</number>
            <date>Mon Feb 03 2020 10:43:17 GMT+0000 (Greenwich Mean Time)</date><date>Mon Feb 24 2020 10:43:17 GMT+0000</date>
            <!--ISO--><date>2021-11-30T18:00:00</date><date>2021-11-30T18:00:00.381Z</date><date>2004-11-09T00:00:00.000+00:00</date>
            <date>2004-11-09</date><date>2019-04-24</date><date>2019-04-23T23:00:00.000-0100</date>
            <!--YMD--><date>20221130</date><date>2022/11/30</date><date>2022-11-30</date><date>20190424</date><date>2019/05/01</date>
            <!--DMY--><date>30112022</date><date>30/11/2022</date><date>30-11-2022</date><date>24/04/2019</date><date>01052019</date>
            <!--MDY--><date>11302022</date><date>11/30/2022</date><date>11-30-2022</date><date>04-24-2019</date><date>05-01-2019</date>
            <string>0123</string><string>0123.123</string><string>000012300</string><string>-00.123</string><string>+00.123</string>
            <string>Yess</string><string>Noo</string>
            <bool>True</bool><bool>False</bool><bool>TRUE</bool><bool>FALSE</bool><bool>true</bool><bool>false</bool>
            <bool>Yes</bool><bool>No</bool><bool>YES</bool><bool>NO</bool>
            </object>`)
            .expect(201, '1')
            .then(({ headers }) => request().get(headers.location)
                .expect(200)
                .then(({ body }) => {
                    expect(body).toHaveProperty('number', [1.1, 1000, 1000.1231, -0.123, 0.123, 18032882]);
                    expect(body).toHaveProperty('bool', [true, false, true, false, true, false, true, false, true, false]);
                    expect(body).toHaveProperty('string', ['0123', '0123.123', '000012300', '-00.123', '+00.123', 'Yess', 'Noo']);
                    expect(body).toHaveProperty('date', [
                        '2020-02-03T10:43:17.000Z',
                        '2020-02-24T10:43:17.000Z',
                        // ISO
                        '2021-11-30T18:00:00.000Z',
                        '2021-11-30T18:00:00.381Z',
                        '2004-11-09',
                        '2004-11-09',
                        '2019-04-24',
                        '2019-04-24',
                        // YMD
                        '2022-11-30',
                        '2022-11-30',
                        '2022-11-30',
                        '2019-04-24',
                        '2019-05-01',
                        // DMY
                        '2022-11-30',
                        '2022-11-30',
                        '2022-11-30',
                        '2019-04-24',
                        '2019-05-01',
                        // MDY
                        '2022-11-30',
                        '2022-11-30',
                        '2022-11-30',
                        '2019-04-24',
                        '2019-01-05',
                    ]);
                })
            ));

    it('should create a new xml object and return its id', () =>
        request().post('/api/vegetables/')
            .set('Content-type', 'application/xml')
            .send('<object><name>Tomato</name></object>')
            .expect(201, '1')
            .then(({ headers }) => request().get(headers.location)
                .query({ select: '-_id name' })
                .accept('text/xml')
                .expect(200, '<object><name>Tomato</name></object>')
            ));

    it('should allow posting multiple xml documents at once', () =>
        request().post('/api/vegetables/')
            .set('Content-type', 'application/xml')
            .send('<xml><object><name>Catnip</name></object><object><name>Cattail</name></object></xml>')
            .expect(201, '2')
            .then(({ headers }) => request().get(headers.location)
                .query({ select: '-_id name' }).accept('text/xml')
                .expect(200, '<xml><object><name>Catnip</name></object><object><name>Cattail</name></object></xml>')
            ));

    it('should allow posting multiple xml documents at once and returns count', () =>
        request().post('/api/vegetables/')
            .query({ count: true }).accept('text/xml')
            .set('Content-type', 'application/xml')
            .send('<xml><object><name>Banana</name></object><object><name>Apple</name></object></xml>')
            .expect(201, '<number>2</number>')
            .then(({ headers }) => request().get(headers.location)
                .query({ select: '-_id name' }).accept('text/xml')
                .expect(200, '<xml><object><name>Banana</name></object><object><name>Apple</name></object></xml>')
            ));

    it('should 422 if no xml document sent', () =>
        request().post('/api/vegetables/').accept('text/xml')
            .set('Content-type', 'application/xml')
            .send('<xml></xml>')
            .expect(422, /<message>The request body must contain at least one document<\/message>/));

    it('should provide correct status and informative xml body for validation errors', () =>
        request().post('/api/vegetables/').accept('text/xml')
            .set('Content-type', 'application/xml')
            .send('<object><score>-1</score></object>')
            .expect(422, /<message>.*?Path `name` is required\..*?<\/message>/));

    it('should handle malformed xml inside first-level objects but ignore those outside', () =>
        request().post('/api/vegetables/').accept('text/xml')
            .set('Content-type', 'application/xml')
            .send('bababa <object> cacacaca <name>Garlic Scape</name> </object>')
            //.expect(400, /<message>char 'b' is not expected.<\/message>/));
            .expect(201, '<number>1</number>'));

});

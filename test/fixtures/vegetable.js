import('mongodb');
import mongoose from 'mongoose';
import app from '../../index.js';

const Schema = mongoose.Schema;

let server;

const Fungus = new Schema({ 'hyphenated-field-name': String });
const Animal = new Schema({ name: String });
const Mineral = new Schema({ color: String, enables: [{ type: Schema.ObjectId, ref: 'fungus' }] });
const Vegetable = new Schema({
  name: { type: String, required: true },
  lastModified: { type: Date, required: true, default: Date.now },
  diseases: { type: [String], select: false },
  species: { type: String, default: 'n/a', select: false },
  related: { type: Schema.ObjectId, ref: 'vegetable' },
  score: { type: Number, min: 1 },
  nutrients: [{ type: Schema.ObjectId, ref: 'mineral' }],
  date: { type: [Date], default: undefined }
}, { strict: false });

Vegetable.pre('save', function (next) {
  this.set('related', this._id);
  next();
});

Vegetable.pre('save', function (next) {
  this.set('lastModified', new Date());
  next();
});

Vegetable.pre('save', next => {
  fixture.saveCount++;
  next();
});

Vegetable.pre('deleteOne', { document: true, query: false }, next => {
  fixture.removeCount++;
  next();
});

mongoose.model('vegetable', Vegetable).lastModified('lastModified').select('-species');
mongoose.model('fungus', Fungus).plural('fungi').select('-hyphenated-field-name');
mongoose.model('mineral', Mineral).sort('color');
mongoose.model('animal', Animal);

const fixture = {
  app: () => app,
  server: () => server,
  deinit: async () => {
    await server.close();
    return mongoose.disconnect();
  },
  init: async () => {
    server = await app.listen();
    fixture.saveCount = 0;
    fixture.removeCount = 0;
    return mongoose.connect(global.__MONGO_URI__);
  },
  create: async () => {
    let Vegetable = mongoose.model('vegetable');
    let Mineral = mongoose.model('mineral');
    let Fungus = mongoose.model('fungus');
    let mineralColors = ['Blue', 'Green', 'Pearlescent', 'Red', 'Orange', 'Yellow', 'Indigo', 'Violet'];
    let vegetableNames = ['Turnip', 'Spinach', 'Pea', 'Shitake', 'Lima Bean', 'Carrot', 'Zucchini', 'Radicchio'];
    let fungus = new Fungus();
    let minerals = mineralColors.map(color => new Mineral({ color: color, enables: fungus._id }));
    let vegetables = vegetableNames.map(name => new Vegetable({ name: name, nutrients: [minerals[0]._id] }));
    fixture.vegetables = vegetables;
    return Vegetable.deleteMany({})
      .then(() => Mineral.deleteMany({}))
      .then(() => Fungus.deleteMany({}))
      .then(() => {
        fixture.saveCount = 0;
        fixture.removeCount = 0;
        return Promise.all(vegetables.concat(minerals).concat([fungus]).map(d => d.save()));
      });
  }
};

export default fixture;
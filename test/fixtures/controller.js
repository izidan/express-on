require('mongodb');
const app = require('../..');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
let server;

mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('debug', (process.env.DEBUG || '').match(/mongoose/));

const Stores = new Schema({
  name: { type: String, required: true, unique: true },
  mercoledi: Boolean,
  voltaic: { type: Boolean, default: true },
  'hyphenated-field-name': { type: Boolean, default: true }
});

const Cheese = new Schema({
  name: { type: String, required: true, unique: true },
  color: { type: String, required: true, select: false },
  bother: { type: Number, required: true, default: 5 },
  molds: [String],
  life: { type: Number, default: 42 },
  arbitrary: [{
    goat: Boolean,
    champagne: String,
    llama: [Number]
  }]
});

const Beans = new Schema({ koji: Boolean });
const Deans = new Schema({ room: { type: Number, unique: true } });
const Liens = new Schema({ title: { type: String, default: 'Babrius' } });
const Fiends = new Schema({ average: Number });
const Unmades = new Schema({ mode: Number });

mongoose.model('store', Stores).findBy('name').select('-hyphenated-field-name -voltaic');
mongoose.model('cheese', Cheese).select('-_id color name').findBy('name');
mongoose.model('bean', Beans);
mongoose.model('dean', Deans).findBy('room');
mongoose.model('lien', Liens).select('-title');
mongoose.model('fiend', Fiends);
mongoose.model('unmade', Unmades);
mongoose.model('timeentry', Cheese, 'cheeses').plural('timeentries').findBy('name').select('color');
mongoose.model('mean', Fiends, 'fiends').locking(true);
mongoose.model('bal', Stores, 'stores').plural('baloo').findBy('name');

module.exports = {
  app: () => app,
  server: () => server,
  deinit: async () => {
    await server.close();
    return mongoose.disconnect();
  },
  init: async () => {
    server = await app.listen();
    return mongoose.connect(global.__MONGO_URI__);
  },
  create: () =>
    // clear all first
    mongoose.model('store').deleteMany({})
      .then(() => mongoose.model('cheese').deleteMany({}))
      .then(() => mongoose.model('store').create(['Westlake', 'Corner'].map(name => ({ name: name }))))
      .then(() => mongoose.model('lien').create({ title: 'Heraclitus' }))
      .then(() => mongoose.model('cheese').create([
        { name: 'Cheddar', color: 'Yellow' },
        { name: 'Huntsman', color: 'Yellow, Blue, White' },
        {
          name: 'Camembert', color: 'White',
          arbitrary: [{ goat: true, llama: [3, 4] }, { goat: false, llama: [1, 2] }]
        }
      ]))
};

const { Controller, Router } = require('express');
const mongoose = require('mongoose');

const controllers = {};
const router = Router();
const controller = plural => controllers[plural] = controllers[plural] || overrides.call(
    new Controller(Object.values(mongoose.models).filter(m => m.plural() === plural).pop() || plural), plural);

const overrides = function (plural) {
    switch (plural) {
        case 'beans': this.find = (req, res) =>
            res.status(405).set('allow', 'HEAD,POST,PUT,DELETE')
                .json({ message: 'The requested method has been disabled for this resource' });
            break;
        case 'liens': this.deleteMany = (req, res) =>
            res.status(405).set('allow', 'HEAD,GET,POST,PUT')
                .json({ message: 'The requested method has been disabled for this resource' });
            break;
    }
    return this;
}

// custom routes
router.use('/api/stores', (req, res, nxt) => { res.set('X-Poncho', 'Poncho!'); nxt(); });
router.get('/api/stores/:id/arbitrary', (req, res) => res.json(req.params.id));
router.use('/api/stores/binfo', (req, res) => res.json('Poncho!'));
router.get('/api/stores/info', (req, res) => res.json('OK!'));
router.get('/api/linseed.oil', (req, res) => res.json(['linseed', 'oil']));
router.get('/', (req, res) => res.send({ [res.app.get('env')]: res.app.get('port') || null }));

// singular routes
router.delete('/:route/:plural/:id', (req, res) => controller(req.params.plural).findByIdAndDelete(req, res));
router.patch('/:route/:plural/:id', (req, res) => controller(req.params.plural).findByIdAndUpdate(req, res));
router.put('/:route/:plural/:id', (req, res) => controller(req.params.plural).findByIdAndReplace(req, res));
router.get('/:route/:plural/:id', (req, res) => controller(req.params.plural).findById(req, res));

// plural routes
router.delete('/:route/:plural', (req, res) => controller(req.params.plural).deleteMany(req, res));
router.patch('/:route/:plural', (req, res) => controller(req.params.plural).updateMany(req, res));
router.post('/:route/:plural', (req, res) => controller(req.params.plural).insertMany(req, res));
router.put('/:route/:plural', (req, res) => controller(req.params.plural).replaceMany(req, res));
router.get('/:route/:plural', (req, res) => controller(req.params.plural).find(req, res));

module.exports = router;
// Lets tsx tests import modules that require() PNGs (the sticker catalog): a PNG becomes its path.
const Module = require('module'); const orig = Module._load;
Module._load = function (req, parent, isMain) { return req.endsWith('.png') ? req : orig.apply(this, arguments); };

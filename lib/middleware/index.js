'use strict';

let app = module.exports = exports = require('express')();

app.use(require('./bodyparser'));
app.use(require('./auth.js'));

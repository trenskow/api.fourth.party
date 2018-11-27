'use strict';

let app = module.exports = exports = require('express')();

app.use(require('./cors'));
app.use(require('./bodyparser'));
app.use(require('./authed.js'));

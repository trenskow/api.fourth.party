'use strict';

const app = module.exports = exports = require('express')();

app.use('/applications/', require('./applications'));

'use strict';

const bodyParser = require('body-parser');

let app = module.exports = exports = require('express')();

app.use(bodyParser.json());

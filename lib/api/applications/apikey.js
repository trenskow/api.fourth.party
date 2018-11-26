'use strict';

const app = module.exports = exports = require('express')();

app.get(
	'/',
	app.async(async (req, res) => {
		res.json({ 'api-key': await req.application.generateKey() });
	})
);

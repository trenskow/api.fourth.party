'use strict';

const User = require('../../../model/user'),
	validate = require('isvalid').validate,
	ApiError = require('../../../model/apierror');

const app = module.exports = exports = require('express')();

app.post(
	'/',
	validate.body({
		'identifier': { type: String, required: true }
	}),
	app.async(async (req, res) => {
		res.json(await User.create(req.application, {
			identifier: req.body.identifier
		}));
	})
);

app.param(
	'user',
	app.async(async (req) => {
		req.user = await User.get(req.application, req.params.user);
		if (!req.user) throw new ApiError('not-found', 'User not found', 404);
	})
);

app.get(
	'/:user/',
	app.async(async (req, res) => {
		res.json(req.user);
	})
);

app.put(
	'/:user/',
	validate.body({
		'identifier': { type: String, required: true }
	}),
	app.async(async (req, res) => {
		await req.user.update(req.body);
		res.sendStatus(204);
	})
);

app.use('/:user/tokens/', require('./tokens'));
app.use('/:user/qr/', require('./qr'));
app.use('/:user/recovery-codes', require('./recovery-codes'));

'use strict';

const ApiError = require('../../../model/apierror');

const app = module.exports = exports = require('express')();

app.param(
	'token',
	app.async(async (req) => {
		if (!/^[0-9]{6}$/.test(req.params.token)) {
			throw new ApiError('not-found', 'Token is not found.', 404);
		}
	})
);

app.get(
	'/:token/',
	app.async(async (req, res) => {

		if (!await req.user.verify(req.params.token)) {
			throw new ApiError('not-found', 'Token is not found.', 404);
		}

		res.sendStatus(204);

	})
);

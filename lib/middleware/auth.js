'use strict';

const Application = require('../model/application'),
	ApiError = require('../model/apierror'),
	keyd = require('keyd');

const app = module.exports = exports = require('express')();

app.use(
	app.async(async (req) => {

		if (process.env.DISABLE_AUTH !== undefined) return;

		const token = req.query.apikey || req.headers['x-api-key'];

		delete req.query.apikey;

		if (!token) throw new ApiError('not-authorized', 'API key is missing.', 401);

		req.authed = await Application.auth(token);

		if (!req.authed) throw new ApiError('not-authorized', 'API key is not authorized.', 401);

	})
);

app.must = (options) => {
	return app.async(async (req) => {
		if (process.env.DISABLE_AUTH !== undefined) return;
		options = options || {};
		if (req.authed.role === 'system') return;
		if (keyd({ req: req }).get(options.be).identifier !== req.authed.identifier) {
			throw new ApiError('not-found', 'Resource not found', 404);
		}
	});
};

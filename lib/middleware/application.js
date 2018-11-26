'use strict';

const Application = require('../model/application'),
	ApiError = require('../model/apierror'),
	keyd = require('keyd');

const app = module.exports = exports = require('express')();

app.use(
	app.async(async (req) => {

		if (process.env.DISABLE_APPLICATION_CHECK !== undefined) return;

		const token = req.query.apikey || req.headers['x-api-key'];

		delete req.query.apikey;

		if (!token) throw new ApiError('not-authorized', 'API key is missing.', 401);

		req.authedApplication = await Application.application(token);

		if (!req.authedApplication) throw new ApiError('not-authorized', 'API key is not authorized.', 401);

	})
);

app.must = app.must || {};

app.must.be = (options) => {
	return app.async(async (req) => {

		if (process.env.DISABLE_APPLICATION_CHECK !== undefined) return;

		options = options || {};

		if (options.role && options.role !== req.authedApplication.role) {
			throw new ApiError('not-authorized', 'Application is not authorized.', 401);
		}

		if (options.application && keyd({ req: req }).get(options.application).identifier !== req.authedApplication.identifier) {
			throw new ApiError('not-authorized', 'Application is not authorized.', 401);
		}
		
	});
};

'use strict';

const Application = require('../../model/application'),
	validate = require('isvalid').validate,
	application = require('../../middleware/application.js'),
	ApiError = require('../../model/apierror');

const app = module.exports = exports = require('express')();

app.post(
	'/',
	application.must.be({
		role: 'system'
	}),
	validate.body({
		contact: {
			name: {
				type: String,
				required: true,
				match: [/^.{5,}$/, 'Must be at least five characters long.']
			},
			email: {
				type: String,
				required: true,
				match: [/[^@]+@[^.]+\..+/, 'Must be an e-mail address.']
			}
		}
	}),
	app.async(async (req, res) => {
		res.json(await Application.create(req.body));
	})
);

app.param(
	'application',
	app.async(async (req) => {
		req.application = await Application.get(req.params.application);
		if (!req.application) throw new ApiError('not-found', 'Application not found', 404);
	})
);

app.get(
	'/:application/',
	application.must.be({
		application: 'req.application'
	}),
	app.async(async (req, res) => {
		res.json(req.application);
	})
);

app.put(
	'/:application/',
	validate.body({
		contact: {
			name: {
				type: String,
				required: true,
				match: [/^.{5,}$/, 'Must be at least five characters long.']
			},
			email: {
				type: String,
				required: true,
				match: [/[^@]+@[^.]+\..+/, 'Must be an e-mail address.']
			}
		}
	}),
	app.async(async (req, res) => {
		res.json(await req.application.update(req.body));
	})
);

app.use(
	'/:application/apikey',
	application.must.be({
		application: 'req.application'
	}),
	require('./apikey')
);

app.use(
	'/:application/users',
	application.must.be({
		application: 'req.application'
	}),
	require('./users')
);

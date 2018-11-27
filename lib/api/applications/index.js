'use strict';

const Application = require('../../model/application'),
	validate = require('isvalid').validate,
	authed = require('../../middleware/authed.js'),
	ApiError = require('../../model/apierror');

const app = module.exports = exports = require('express')();

app.post(
	'/',
	authed.application.must.be({
		role: 'system'
	}),
	validate.body({
		name: {
			type: String,
			required: [true, 'Is required.'],
			match: [/^.{5,}$/, 'Must be at least five characters long.']
		},
		contact: {
			name: {
				type: String,
				required: [true, 'Is required.'],
				match: [/^.{5,}$/, 'Must be at least five characters long.']
			},
			email: {
				type: String,
				required: [true, 'Is required.'],
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
	authed.application.must.be({
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
				required: [true, 'Is required.'],
				match: [/^.{5,}$/, 'Must be at least five characters long.']
			},
			email: {
				type: String,
				required: [true, 'Is required.'],
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
	authed.application.must.be({
		application: 'req.application'
	}),
	require('./apikey')
);

app.use(
	'/:application/users',
	authed.application.must.be({
		application: 'req.application'
	}),
	require('./users')
);

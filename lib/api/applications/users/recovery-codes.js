'use strict';

const merge = require('merge'),
	validate = require('isvalid').validate;

const ApiError = require('../../../model/apierror');

const app = module.exports = exports = require('express')();

app.get(
	'/',
	app.async(async (req, res) => {
		res.json(req.user.toJSON().recovery);
	})
);

app.put(
	'/',
	validate.query({
		'authorization': { type: String, required: true }
	}),
	app.async(async (req) => {
		if (!await req.user.verify(req.query.authorization) && !await req.user.recover(req.query.authorization)) {
			throw new ApiError('not-authorized', 'Not authorized for operation.', 401);
		}
	}),
	app.async(async (req, res) => {
		let recoveryCodes = await req.user.regenerateRecovery();
		res.json(merge(req.user.toJSON().recovery, {
			codes: recoveryCodes
		}));
	})
);

app.param(
	'recoveryCode',
	app.async(async (req) => {
		if (await req.user.recover(req.params.recoveryCode) !== true) {
			throw new ApiError('not-found', 'Recovery code not found.', 404);
		}
	})
);

app.get(
	'/:recoveryCode/',
	app.async(async (req, res) => {
		res.sendStatus(204);
	})
);

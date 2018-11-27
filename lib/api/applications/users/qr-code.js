'use strict';

const qr = require('qr-image'),
	validate = require('isvalid').validate,
	mime = require('mime-types'),
	ApiError = require('../../../model/apierror');

const app = module.exports = exports = require('express')();

app.get(
	'/',
	validate.query({
		format: {
			type: String,
			required: [true, 'Is required.'],
			enum: ['png', 'svg', 'eps', 'pdf'],
			default: 'png'
		},
		authorization: {
			type: String,
			required: [true, 'Is required.']
		}
	}),
	app.async(async (req) => {
		if (!await req.user.verify(req.query.authorization) && !await req.user.recover(req.query.authorization)) {
			throw new ApiError('not-authorized', 'Not authorized for operation.', 401);
		}
	}),
	app.async(async (req, res) => {

		res.header('Content-Type', mime.lookup(req.query.format));

		qr.image(await req.user.uri(), {
			type: req.query.format
		}).pipe(res);

		await res.untilEnd();

	})
);

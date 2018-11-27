'use strict';

const mongoose = require('mongoose'),
	express = require('express'),
	jsonerr = require('jsonerr'),
	ApiError = require('./lib/model/apierror');

mongoose.Promise = Promise;

// We extend the express application to support promises (async functions).
express.application.async = function(fn) {
	return function(req, res, next) {
		fn.apply(null, arguments)
			.then(() => {
				if (!res.headersSent) next();
			})
			.catch(next);
	};
};

express.response.untilEnd =  function() {
	return new Promise((resolv, reject) => {
		this.on('end', resolv);
		this.on('error', reject);
	});
};

mongoose.connect(process.env.MONGODB || 'mongodb://localhost/fourthparty', {
	useNewUrlParser: true,
	useCreateIndex: true
}).catch((err) => {
	console.error(`Could not connect to MongoDB: ${err.message}`);
	process.exit(1);
}).then(() => {

	const app = express();

	app.use(app.async(async (req) => {
		req.entities = {};
	}));

	app.get(
		'/.well-known/acme-challenge/5ZNOQ-1kdXVU7wQagPYzh4vBaIqhZrz4ybpA-uqzB0c',
		app.async(async (req, res) => {
			res.header('Content-Type', 'text/plain');
			res.send('5ZNOQ-1kdXVU7wQagPYzh4vBaIqhZrz4ybpA-uqzB0c.L6gGKzYokAOkGX6skL8ZPVIyHqt-8VGhda9QfSkvQtk');
		})
	);

	app.use(require('./lib/middleware'));
	app.use('/', require('./lib/api'));

	app.set('trust proxy', 1);

	// Not found handler.
	app.use(app.async(() => {
		throw new ApiError('not-found', 'Resource not found', 404);
	}));

	app.use((err, req, res, next_ignoreUnused) => {

		res.error = err;

		if (err.constructor.name == 'ValidationError' && typeof err.keyPath !== 'undefined') {
			err.name = 'validation-error';
			err.statusCode = 400;
			err.keyPath = err.keyPath.join('.');
		}

		console.error(err);

		if (err.name == 'Error') err.name = 'internal-server-error';

		res.status(err.statusCode || 500).json(jsonerr(err, {
			enumerables: ['keyPath'],
			stack: process.env.NODE_ENV !== 'production'
		}));

	});

	app.listen(process.env.PORT || 3000);

});

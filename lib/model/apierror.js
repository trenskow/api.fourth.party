'use strict';

module.exports = exports = class ApiError extends Error {

	constructor(name, message, statusCode = 500) {
		super();

		this.name = name;
		this.message = message;
		this.statusCode = statusCode;

	}

};

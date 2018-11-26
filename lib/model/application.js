'use strict';

const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	hat = require('hat'),
	ApiError = require('./apierror'),
	jws = require('jws'),
	moment = require('moment'),
	merge = require('merge');

const schema = new Schema({
	identifier: { type: String, required: true, default: hat, index: { unique: true } },
	role: { type: String, required: true, enum: ['regular', 'system'], default: 'regular' },
	contact: {
		name: { type: String, required: true },
		name_lc: { type: String, required: true, index: true },
		email: { type: String, required: true, match: /[^@]+@[^.]+\..+/, index: true },
		verified: { type: Boolean, required: true, default: false }
	},
	access: {
		whitelist: { type: Date, required: true, default: () => moment.utc().toDate() }
	}
}, {
	toJSON: {
		transform: function(doc, ret) {
			delete ret._id;
			delete ret.__v;
			delete ret.access;
			delete ret.role;
			delete ret.contact.name_lc;
		}
	}
});

schema.pre('validate', function() {
	if (this.isModified('contact.email')) this.contact.verified = false;
	if (this.isModified('contact.name')) this.contact.name_lc = this.contact.name.toLowerCase();
});

schema.methods.generateKey = function() {
	return new Promise((resolv, reject) => {
		jws.createSign({
			header: { alg: 'HS256' },
			secret: process.env.SECRET || 'secret',
			payload: {
				identifier: this.identifier,
				iat: moment.utc().toDate()
			}
		}).on('done', resolv).on('error', reject);
	});
};

schema.methods.update = async function(update) {
	let existing = await Application.get(update.contact.email);
	if (!existing._id.equals(this._id)) {
		throw new ApiError('already-exists', 'Application already exists', 409);
	}
	return await merge(this, update).save();
};

let Application = module.exports = exports = mongoose.model('application', schema);

Application.get = async (identifier) => {
	return await Application.findOne({ $or: [ { identifier: identifier }, { 'contact.email': identifier } ] });
};

Application.auth = (key) => {
	return new Promise((resolv, reject) => {
		jws.createVerify({
			algorithm: 'HS256',
			secret: process.env.SECRET || 'secret',
			signature: key
		}).on('done', (verified, obj) => {
			if (!verified) return reject(new ApiError('not-valid', 'API key is not valid.', 401));
			obj.payload = JSON.parse(obj.payload);
			obj.payload.iat = new Date(obj.payload.iat);
			resolv(obj);
		}).on('error', reject);
	}).then((obj) => {
		return Application.get(obj.payload.identifier)
			.then((application) => {
				return { iat: obj.payload.iat, application: application };
			});
	}).then((res) => {
		if (!res.application) throw new ApiError('not-valid', 'API key is not valid', 401);
		if (res.iat < res.application.access.whitelist) {
			throw new ApiError('expired', 'API key has expired.', 400);
		}
		return res.application;
	});
};

Application.create = async (application) => {
	if (await Application.get(application.contact.email)) {
		throw new ApiError('already-exists', 'Application already exists', 409);
	}
	return await (new Application(application)).save();
};

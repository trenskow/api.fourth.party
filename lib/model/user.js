'use strict';

const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	hat = require('hat'),
	otplib = require('otplib'),
	bcrypt = require('bcrypt'),
	merge = require('merge'),
	ApiError = require('./apierror');

const schema = new Schema({
	'identifier': { type: String, required: true, default: hat, index: { unique: true } },
	'owner': {
		'application': { type: Schema.Types.ObjectId, ref: 'Application', required: true },
		'identifier': { type: String, required: true, index: true }
	},
	'secret': { type: String, required: true, default: () => otplib.authenticator.generateSecret() },
	'recoveryCodes': [{ type: String }]
}, {
	toJSON: {
		transform: function(doc) {
			return {
				identifier: doc.owner.identifier,
				recovery: {
					left: doc.recoveryCodes.length
				}
			};
		}
	}
});

schema.methods.uri = async function() {
	await this.populate('owner.application');
	return otplib.authenticator.keyuri(
		this.owner.identifier,
		this.owner.application.name,
		this.secret
	);
};

schema.methods.verify = async function(token) {
	return otplib.authenticator.check(token, this.secret);
};

schema.methods.recover = async function(recoveryCode) {

	let resolved = await Promise.all(this.recoveryCodes.map((code) => {
		return bcrypt.compare(recoveryCode, code);
	}));

	const idx = resolved.indexOf(true);

	if (idx == -1) return false;

	this.recoveryCodes.splice(idx, 1);

	await this.save();

	return true;

};

schema.methods.regenerateRecovery = async function(additional = 0) {

	const allowed = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

	let recoveryCodes = (new Array(30 + additional)).fill(0).map(() => {
		return (new Array(2)).fill(0).map(() => {
			return (new Array(4)).fill(0).map(() => {
				return allowed[Math.floor(Math.random() * allowed.length)];
			}).join('');
		}).join('-');
	});

	this.recoveryCodes = await Promise.all(recoveryCodes.map((password) => {
		return bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS) || 10);
	}));

	await this.save();

	return recoveryCodes;

};

schema.methods.update = async function(update) {

	const existing = await User.get(this.owner.application, update.identifier);

	if (existing && !existing._id.equals(this._id)) {
		throw new ApiError('already-exists', 'User already exists.', 409);
	}

	merge(this.owner, {
		identifier: update.identifier
	});

	return await this.save();

};

let User = module.exports = exports = mongoose.model('user', schema);

User.create = async (application, user) => {

	if (await User.get(application, user.identifier)) {
		throw new ApiError('already-exists', 'User already exists.', 409);
	}

	let newUser = new User({
		owner: {
			application: application,
			identifier: user.identifier
		}
	});

	const recoveryCodes = await newUser.regenerateRecovery(1);

	await newUser.save();

	return merge.recursive(newUser.toJSON(), {
		recovery: {
			codes: recoveryCodes
		}
	});

};

User.get = async (application, identifier) => {
	return await User.findOne({ 'owner.application': application._id || application, 'owner.identifier': identifier });
};

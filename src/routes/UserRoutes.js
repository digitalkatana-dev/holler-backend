const { Router } = require('express');
const { model } = require('mongoose');
const { sign } = require('jsonwebtoken');
const { genSalt, hash } = require('bcrypt');
const { createHash } = require('crypto');
const { config } = require('dotenv');
const { validateRegistration, validateLogin } = require('../util/validators');
const requireAuth = require('../middleware/requireAuth');

const User = model('User');
const router = Router();
config();

//Register
router.post('/users/register', async (req, res) => {
	const { valid, errors } = validateRegistration(req?.body);

	if (!valid) return res.status(400).json(errors);

	const user = await User.findOne({
		$or: [{ username: req?.body?.username }, { email: req?.body?.email }],
	}).catch((err) => {
		errors.message = 'Something went wrong!';
		return res.status(400).json(errors);
	});

	if (user) {
		if (req?.body?.email == user.email) {
			errors.email = 'Email already in use.';
		} else {
			errors.username = 'Username already in use.';
		}
		return res.status(400).json(errors);
	}

	try {
		const newUser = new User(req?.body);
		await newUser?.save();
		const token = sign({ userId: newUser?._id }, process.env.DB_SECRET_KEY, {
			expiresIn: '10d',
		});

		const userData = {
			_id: newUser?._id,
			firstName: newUser?.firstName,
			lastName: newUser?.lastName,
			username: newUser?.username,
			email: newUser?.email,
			profilePic: newUser?.profilePic,
			createdAt: newUser?.createdAt,
			updatedAt: newUser?.updatedAt,
		};

		res.json({ userData, token });
	} catch (err) {
		console.log(err);
		errors.message = 'Error registering user!';
		return res.status(400).json(errors);
	}
});

// Login
router.post('/users/login', async (req, res) => {
	const { valid, errors } = validateLogin(req?.body);

	if (!valid) return res.status(400).json(errors);

	const { login, password } = req?.body;

	const user = await User.findOne({
		$or: [{ username: login }, { email: login }],
	});
	if (!user) {
		errors.message = 'Error, user not found!';
		return res.status(404).json(errors);
	}

	try {
		await user?.comparePassword(password);
		const token = sign({ userId: user?._id }, process.env.DB_SECRET_KEY, {
			expiresIn: '10d',
		});

		const userData = {
			_id: user?._id,
			firstName: user?.firstName,
			lastName: user?.lastName,
			username: user?.username,
			email: user?.email,
			profilePic: user?.profilePic,
			createdAt: user?.createdAt,
			updatedAt: user?.updatedAt,
		};

		res.json({ userData, token });
	} catch (err) {
		console.log(err);
		errors.message = 'Something went wrong, try again!';
		return res.status(400).json(errors);
	}
});

module.exports = router;

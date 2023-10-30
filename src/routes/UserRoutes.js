const { Router } = require('express');
const { model } = require('mongoose');
const { sign } = require('jsonwebtoken');
const { genSalt, hash } = require('bcrypt');
const { createHash } = require('crypto');
const { config } = require('dotenv');
const { validateRegistration } = require('../util/validators');
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
		console.log(err);
		errors.message = 'Something went wrong!';
		return res.status(400).json(errors);
	});

	if (user) {
		if (req?.body?.email == user.email) {
			errors.message = 'Email already in use.';
		} else {
			errors.message = 'Username already in use.';
		}
		return res.status(400).json(errors);
	}

	try {
		const newUser = new User(req?.body);
		await newUser?.save();
		const token = sign(
			{
				userId: newUser?._id,
			},
			process.env.DB_SECRET_KEY,
			{
				expiresIn: '10d',
			}
		);

		res.json({ newUser, token });
	} catch (err) {
		errors.message = 'Error registering user!';
		return res.status(400).json(errors);
	}
});

module.exports = router;

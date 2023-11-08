const { Router } = require('express');
const { model } = require('mongoose');
const { sign } = require('jsonwebtoken');
const { genSalt, hash } = require('bcrypt');
const { createHash } = require('crypto');
const { config } = require('dotenv');
const { validateRegistration, validateLogin } = require('../util/validators');
const requireAuth = require('../middleware/requireAuth');

const Post = model('Post');
const User = model('User');
const router = Router();
config();

//Register
router.post('/users/register', async (req, res) => {
	const { valid, errors } = validateRegistration(req?.body);

	if (!valid) return res.status(400).json(errors);

	const user = await User.findOne({
		$or: [{ username: req?.body?.username }, { email: req?.body?.email }],
	})
		.populate('posts')
		.populate('likes')
		.populate('reposts')
		.catch((err) => {
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
			posts: newUser?.posts,
			likes: newUser?.likes,
			reposts: newUser?.reposts,
			createdAt: newUser?.createdAt,
			updatedAt: newUser?.updatedAt,
		};

		res.status(201).json({ userData, token });
	} catch (err) {
		console.log(err);
		errors.message = 'Error registering user!';
		return res.status(400).json(errors);
	}
});

// Login
router.post('/users/login', async (req, res) => {
	const { login, password } = req?.body;

	const { valid, errors } = validateLogin(req?.body);

	if (!valid) return res.status(400).json(errors);

	const user = await User.findOne({
		$or: [{ username: login }, { email: login }],
	})
		.populate('likes')
		.populate('reposts');
	if (!user) {
		errors.message = 'Error, user not found!';
		return res.status(404).json(errors);
	}

	try {
		user.posts = await getPosts({ postedBy: user._id });
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
			likes: user?.likes,
			posts: user?.posts,
			reposts: user?.reposts,
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

// Get User
router.get('/users', requireAuth, async (req, res) => {
	let errors = {};
	const hasId = req?.query?.id;
	const hasUsername = req?.query?.username;

	try {
		let users;
		let userData;

		if (hasId) {
			users = await User.findById(hasId).populate('likes').populate('reposts');
			users.posts = await getPosts({ postedBy: users._id });
			userData = {
				_id: users?._id,
				firstName: users?.firstName,
				lastName: users?.lastName,
				username: users?.username,
				email: users?.email,
				profilePic: users?.profilePic,
				posts: users?.posts,
				likes: users?.likes,
				reposts: users?.reposts,
				createdAt: users?.createdAt,
				updatedAt: users?.updatedAt,
			};
		} else if (hasUsername) {
			users = await User.findOne({ username: hasUsername })
				.populate('likes')
				.populate('reposts');
			users.posts = await getPosts({ postedBy: users._id });
			userData = {
				_id: users?._id,
				firstName: users?.firstName,
				lastName: users?.lastName,
				username: users?.username,
				email: users?.email,
				profilePic: users?.profilePic,
				posts: users?.posts,
				likes: users?.likes,
				reposts: users?.reposts,
				createdAt: users?.createdAt,
				updatedAt: users?.updatedAt,
			};
		} else {
			userData = [];
			users = await User.find({})
				.populate('posts')
				.populate('likes')
				.populate('reposts');
			users.forEach((user) => {
				userData.push({
					_id: user?._id,
					firstName: user?.firstName,
					lastName: user?.lastName,
					username: user?.username,
					email: user?.email,
					profilePic: user?.profilePic,
					posts: user?.posts,
					likes: user?.likes,
					reposts: user?.reposts,
					createdAt: user?.createdAt,
					updatedAt: user?.updatedAt,
				});
			});
		}

		res.json(userData);
	} catch (err) {
		console.log(err);
		errors.message = 'Error getting users!';
		return res.status(400).json(errors);
	}
});

async function getPosts(filter) {
	let results = await Post.find(filter)
		.populate('postedBy')
		.populate('reposts')
		.populate('repostData')
		.populate('replyTo')
		.sort('-createdAt');
	results.forEach(async (result) => {
		let { postedBy } = result;
		result.postedBy = {
			_id: postedBy._id,
			firstName: postedBy.firstName,
			lastName: postedBy.lastName,
			username: postedBy.username,
			email: postedBy.email,
			profilePic: postedBy.profilePic,
		};
	});
	results = await User.populate(results, { path: 'replyTo.postedBy' });
	return results;
}

module.exports = router;

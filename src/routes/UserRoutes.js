const { Router } = require('express');
const { model } = require('mongoose');
const { sign } = require('jsonwebtoken');
const { genSalt, hash } = require('bcrypt');
const { createHash } = require('crypto');
const { config } = require('dotenv');
const { validateRegistration, validateLogin } = require('../util/validators');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');

const Post = model('Post');
const User = model('User');
const router = Router();
config();

const storage = multer.diskStorage({
	destination: 'uploads/',
	filename: function (req, file, cb) {
		cb(null, file.originalname); // Use the original name as the filename
	},
});
const filter = (req, file, cb) => {
	file.mimetype.startsWith('image')
		? cb(null, true)
		: cb({ message: 'Unsupported file format.' }, false);
};
const upload = multer({
	storage: storage,
	fileFilter: filter,
	limits: { fileSize: 6000000000, fieldSize: 25 * 1024 * 1024 },
});

//Register
router.post('/users/register', async (req, res) => {
	const { valid, errors } = validateRegistration(req?.body);

	if (!valid) return res.status(400).json(errors);

	const user = await User.findOne({
		$or: [{ username: req?.body?.username }, { email: req?.body?.email }],
	})
		.populate('posts')
		.populate('replies')
		.populate('likes')
		.populate('repostUsers')
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
			dob: newUser?.dob,
			username: newUser?.username,
			email: newUser?.email,
			profilePic: newUser?.profilePic,
			coverPhoto: user?.coverPhoto,
			posts: newUser?.posts,
			replies: newUser?.replies,
			likes: newUser?.likes,
			repostUsers: newUser?.repostUsers,
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
		.populate('posts')
		.populate('replies')
		.populate('likes')
		.populate('following')
		.populate('followers')
		.populate('repostUsers');
	if (!user) {
		errors.message = 'Error, user not found!';
		return res.status(404).json(errors);
	}

	try {
		user.posts = await getPosts({
			postedBy: user._id,
			replyTo: { $exists: false },
		});
		user.replies = await getPosts({
			postedBy: user._id,
			replyTo: { $exists: true },
		});
		await user?.comparePassword(password);
		const token = sign({ userId: user?._id }, process.env.DB_SECRET_KEY, {
			expiresIn: '10d',
		});

		const userData = {
			_id: user?._id,
			firstName: user?.firstName,
			lastName: user?.lastName,
			dob: user?.dob,
			username: user?.username,
			email: user?.email,
			profilePic: user?.profilePic,
			coverPhoto: user?.coverPhoto,
			likes: user?.likes,
			following: user?.following,
			followers: user?.followers,
			posts: user?.posts,
			replies: user?.replies,
			repostUsers: user?.repostUsers,
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
	const hasSearch = req?.query?.search;

	try {
		let users;
		let userData;

		if (hasId) {
			users = await User.findById(hasId)
				.populate('likes')
				.populate('following')
				.populate('followers')
				.populate('repostUsers');
			users.posts = await getPosts({
				postedBy: users._id,
				replyTo: { $exists: false },
			});
			users.replies = await getPosts({
				postedBy: users._id,
				replyTo: { $exists: true },
			});
			userData = {
				_id: users?._id,
				firstName: users?.firstName,
				lastName: users?.lastName,
				dob: users?.dob,
				username: users?.username,
				email: users?.email,
				profilePic: users?.profilePic,
				coverPhoto: users?.coverPhoto,
				posts: users?.posts,
				replies: users?.replies,
				likes: users?.likes,
				following: users?.following,
				followers: users?.followers,
				repostUsers: users?.repostUsers,
				createdAt: users?.createdAt,
				updatedAt: users?.updatedAt,
			};
		} else if (hasUsername) {
			users = await User.findOne({ username: hasUsername })
				.populate('likes')
				.populate('following')
				.populate('followers')
				.populate('repostUsers');
			users.posts = await getPosts({
				postedBy: users._id,
				replyTo: { $exists: false },
			});
			users.replies = await getPosts({
				postedBy: users._id,
				replyTo: { $exists: true },
			});
			userData = {
				_id: users?._id,
				firstName: users?.firstName,
				lastName: users?.lastName,
				dob: users?.dob,
				username: users?.username,
				email: users?.email,
				profilePic: users?.profilePic,
				coverPhoto: users?.coverPhoto,
				posts: users?.posts,
				replies: users?.replies,
				likes: users?.likes,
				following: users?.following,
				followers: users?.followers,
				repostUsers: users?.repostUsers,
				createdAt: users?.createdAt,
				updatedAt: users?.updatedAt,
			};
		} else if (hasSearch) {
			userData = [];
			users = await User.find({
				$or: [
					{ firstName: { $regex: hasSearch, $options: 'i' } },
					{ lastName: { $regex: hasSearch, $options: 'i' } },
					{ username: { $regex: hasSearch, $options: 'i' } },
				],
			})
				.populate('posts')
				.populate('replies')
				.populate('likes')
				.populate('following')
				.populate('followers')
				.populate('repostUsers');
			users.forEach((user) => {
				userData.push({
					_id: user?._id,
					firstName: user?.firstName,
					lastName: user?.lastName,
					dob: user?.dob,
					username: user?.username,
					email: user?.email,
					profilePic: user?.profilePic,
					coverPhoto: user?.coverPhoto,
					posts: user?.posts,
					replies: user?.replies,
					likes: user?.likes,
					following: user?.following,
					followers: user?.followers,
					repostUsers: user?.repostUsers,
					createdAt: user?.createdAt,
					updatedAt: user?.updatedAt,
				});
			});
		} else {
			userData = [];
			users = await User.find({})
				.populate('posts')
				.populate('replies')
				.populate('likes')
				.populate('following')
				.populate('followers')
				.populate('repostUsers');
			users.forEach((user) => {
				userData.push({
					_id: user?._id,
					firstName: user?.firstName,
					lastName: user?.lastName,
					dob: user?.dob,
					username: user?.username,
					email: user?.email,
					profilePic: user?.profilePic,
					coverPhoto: user?.coverPhoto,
					posts: user?.posts,
					replies: user?.replies,
					likes: user?.likes,
					following: user?.following,
					followers: user?.followers,
					repostUsers: user?.repostUsers,
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

// Follow/Unfollow User
router.put('/users/:id/follow', requireAuth, async (req, res) => {
	let errors = {};
	const { id } = req?.params;

	const user = req?.user;
	const profile = await User.findById(id);
	if (!profile) {
		errors.message = 'Error, user not found!';
		return res.status(404).json(errors);
	}

	const following = user.following;
	const isFollowing = following.includes(id);
	const option = isFollowing ? '$pull' : '$push';

	try {
		await User.findByIdAndUpdate(
			user._id,
			{ [option]: { following: id } },
			{ new: true }
		);

		res.json({
			success: { message: 'User followed/unfollowed successfully!' },
		});
	} catch (err) {
		console.log(err);
		errors.message = 'Error following user!';
		return res.status(400).json(errors);
	}
});

// Upload Profile Pic
router.post(
	'/users/profile-pic',
	requireAuth,
	upload.single('profilePic'),
	async (req, res) => {
		let errors = {};

		const filePath = `/uploads/images/${req?.file?.filename}.png`;
		const tempPath = req?.file?.path;
		const targetPath = path.join(__dirname, `../../${filePath}`);

		try {
			fs.rename(tempPath, targetPath, (error) => error && console.log(error));
			const user = await User.findByIdAndUpdate(
				req?.user?._id,
				{
					$set: {
						profilePic: `http://localhost:3005${filePath}`,
					},
				},
				{
					new: true,
				}
			)
				.populate('posts')
				.populate('replies')
				.populate('likes')
				.populate('following')
				.populate('followers')
				.populate('repostUsers');

			const userData = {
				_id: user?._id,
				firstName: user?.firstName,
				lastName: user?.lastName,
				dob: user?.dob,
				username: user?.username,
				email: user?.email,
				profilePic: user?.profilePic,
				coverPhoto: user?.coverPhoto,
				likes: user?.likes,
				following: user?.following,
				followers: user?.followers,
				posts: user?.posts,
				replies: user?.replies,
				repostUsers: user?.repostUsers,
				createdAt: user?.createdAt,
				updatedAt: user?.updatedAt,
			};

			res.json({
				userData,
				success: { message: 'Profile pic uploaded successfully!' },
			});
		} catch (err) {
			console.log(err);
			errors.message = 'Error uploading profile pic!';
			return res.status(400).json(errors);
		}
	}
);

// Upload Cover Photo
router.post(
	'/users/cover-photo',
	requireAuth,
	upload.single('coverPhoto'),
	async (req, res) => {
		let errors = {};

		const filePath = `/uploads/images/${req?.file?.filename}.png`;
		const tempPath = req?.file?.path;
		const targetPath = path.join(__dirname, `../../${filePath}`);

		try {
			fs.rename(tempPath, targetPath, (error) => error && console.log(error));
			const user = await User.findByIdAndUpdate(
				req?.user?._id,
				{
					$set: {
						coverPhoto: `http://localhost:3005${filePath}`,
					},
				},
				{
					new: true,
				}
			)
				.populate('posts')
				.populate('replies')
				.populate('likes')
				.populate('following')
				.populate('followers')
				.populate('repostUsers');

			const userData = {
				_id: user?._id,
				firstName: user?.firstName,
				lastName: user?.lastName,
				dob: user?.dob,
				username: user?.username,
				email: user?.email,
				profilePic: user?.profilePic,
				coverPhoto: user?.coverPhoto,
				likes: user?.likes,
				following: user?.following,
				followers: user?.followers,
				posts: user?.posts,
				replies: user?.replies,
				repostUsers: user?.repostUsers,
				createdAt: user?.createdAt,
				updatedAt: user?.updatedAt,
			};

			res.json({
				userData,
				success: { message: 'Cover photo uploaded successfully!' },
			});
		} catch (err) {
			console.log(err);
			errors.message = 'Error uploading cover photo!';
			return res.status(400).json(errors);
		}
	}
);

async function getPosts(filter) {
	let results = await Post.find(filter)
		.populate('postedBy')
		.populate('replies')
		.populate('repostData')
		.populate('replyTo')
		.sort('-createdAt');
	results.forEach(async (result) => {
		let { postedBy } = result;
		result.postedBy = {
			_id: postedBy._id,
			firstName: postedBy.firstName,
			lastName: postedBy.lastName,
			dob: postedBy.dob,
			username: postedBy.username,
			email: postedBy.email,
			profilePic: postedBy.profilePic,
		};
	});
	results = await User.populate(results, { path: 'replyTo.postedBy' });
	return await User.populate(results, { path: 'repostData.postedBy' });
}

module.exports = router;

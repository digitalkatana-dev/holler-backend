const { Router } = require('express');
const { model } = require('mongoose');
const requireAuth = require('../middleware/requireAuth');

const Post = model('Post');
const router = Router();

// Create Post
router.post('/posts', requireAuth, async (req, res) => {
	let errors = {};
	const { _id } = req?.user;

	try {
		const postData = {
			...req?.body,
			postedBy: _id,
		};
		const newPost = new Post(postData);
		await newPost?.save();

		res
			.status(201)
			.json({ newPost, success: { message: 'Post created successfully!' } });
	} catch (err) {
		console.log(err);
		errors.message = 'Error creating post!';
		return res.status(400).json(errors);
	}
});

// Get Posts
router.get('/posts', requireAuth, async (req, res) => {
	let errors = {};

	try {
		const posts = await Post.find({}).populate('postedBy').sort('-createdAt');
		posts.forEach((post) => {
			const { postedBy } = post;
			post.postedBy = {
				_id: postedBy._id,
				firstName: postedBy.firstName,
				lastName: postedBy.lastName,
				username: postedBy.username,
				email: postedBy.email,
				profilePic: postedBy.profilePic,
			};
		});

		res.json(posts);
	} catch (err) {
		console.log(err);
		errors.message = 'Error getting posts';
		return res.status(400).json(errors);
	}
});

// Like/Unlike Post
router.put('/posts/:id/like', requireAuth, async (req, res) => {
	let errors = {};
	const { id } = req?.params;

	const post = await Post.findById(id);
	if (!post) {
		errors.message = 'Error, post not found!';
		return res.status(404).json(errors);
	}

	const likes = post.likes;
	const isLiked = likes.includes(req?.user?._id);
	const option = isLiked ? '$pull' : '$push';

	try {
		const updated = await Post.findByIdAndUpdate(
			id,
			{ [option]: { likes: req?.user?._id } },
			{ new: true }
		);

		res.json({
			updated,
			success: { message: 'Post liked/disliked successfully!' },
		});
	} catch (err) {
		console.log(err);
		errors.message = 'Error likeing post!';
		return res.status(400).json(errors);
	}
});

module.exports = router;

const { Router } = require('express');
const { model } = require('mongoose');
const requireAuth = require('../middleware/requireAuth');

const Post = model('Post');
const User = model('User');
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
	const hasId = req?.query?.id;
	const hasSearch = req?.query?.search;
	const followingOnly = req?.query?.following;
	let posts;

	try {
		if (hasId) {
			posts = await getPosts({ _id: hasId });
			posts = posts[0];
			posts.replies = await getPosts({ replyTo: hasId });
		} else if (hasSearch) {
			posts = await getPosts({ content: { $regex: hasSearch, $options: 'i' } });
		} else if (followingOnly) {
			let followingIds = req?.user?.following;
			followingIds.push(req?.user?._id);

			posts = await getPosts({ postedBy: { $in: followingIds } });
		} else {
			posts = await getPosts({});
		}

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
	const isLiked = likes.includes(req?.user?._id); // Check if user is in liked array
	const option = isLiked ? '$pull' : '$push';

	try {
		await Post.findByIdAndUpdate(
			id,
			{ [option]: { likes: req?.user?._id } },
			{ new: true }
		);

		res.json({ success: { message: 'Post liked/disliked successfully!' } });
	} catch (err) {
		console.log(err);
		errors.message = 'Error likeing post!';
		return res.status(400).json(errors);
	}
});

// Repost/Remove Repost
router.post('/posts/:id/repost', requireAuth, async (req, res) => {
	let errors = {};
	const { id } = req?.params;

	const deletedPost = await Post.findOneAndDelete({
		postedBy: req?.user?._id,
		repostData: id,
	});
	let repost = deletedPost;
	if (!repost)
		repost = await Post.create({ postedBy: req?.user?._id, repostData: id });
	const option = deletedPost ? '$pull' : '$push';

	try {
		await Post.findByIdAndUpdate(
			id,
			{ [option]: { repostUsers: req?.user?._id } },
			{ new: true }
		);

		res.json({ success: { message: 'Reposted successfully!' } });
	} catch (err) {
		console.log(err);
		errors.message = 'Error reposting!';
		return res.status(400).json(errors);
	}
});

// Pin/Unpin Post
router.put('/posts/:id/pin', requireAuth, async (req, res) => {
	let errors = {};
	const { id } = req?.params;

	const post = await Post.findById(id);

	try {
		await Post.updateMany({ postedBy: req?.user?._id }, { pinned: false });

		await Post.findByIdAndUpdate(
			id,
			{
				$set: {
					pinned: !post.pinned,
				},
			},
			{
				new: true,
			}
		);

		res.json({ success: { message: 'Post pinned/unpinned successfully!' } });
	} catch (err) {
		console.log(err);
		errors.message = 'Error pinning post!';
		return res.status(400).json(errors);
	}
});

// Delete Post
router.delete('/posts/:id/delete', requireAuth, async (req, res) => {
	let errors = {};
	const { id } = req?.params;

	try {
		const deletedPost = await Post.findByIdAndDelete(id);

		if (!deletedPost) {
			errors.message = 'Error, post not found!';
			return res.status(404).json(errors);
		}

		res.json({
			deletedPost,
			success: { message: 'Post deleted successfully!' },
		});
	} catch (err) {
		console.log(err);
		errors.message = 'Error deleting post!';
		return res.status(400).json(errors);
	}
});

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

const { Router } = require('express');
const { model } = require('mongoose');
const { validateCreateChat } = require('../util/validators');
const requireAuth = require('../middleware/requireAuth');

const Chat = model('Chat');
const User = model('User');
const router = Router();

// Create
router.post('/chats', requireAuth, async (req, res) => {
	const { valid, errors } = validateCreateChat(req?.body);

	if (!valid) return res.status(400).json(errors);
	const { users } = req?.body;

	const raw = await User.findById(req?.user?._id)
		.populate('posts')
		.populate('replies')
		.populate('likes')
		.populate('following')
		.populate('followers')
		.populate('repostUsers');

	const user = {
		_id: raw?._id,
		firstName: raw?.firstName,
		lastName: raw?.lastName,
		dob: raw?.dob,
		username: raw?.username,
		email: raw?.email,
		profilePic: raw?.profilePic,
		coverPhoto: raw?.coverPhoto,
		likes: raw?.likes,
		following: raw?.following,
		followers: raw?.followers,
		posts: raw?.posts,
		replies: raw?.replies,
		repostUsers: raw?.repostUsers,
		createdAt: raw?.createdAt,
		updatedAt: raw?.updatedAt,
	};

	let recipients = users;
	recipients.push(user);

	try {
		const chatData = {
			users: recipients,
			isGroupChat: true,
		};
		const newChat = new Chat(chatData);
		await newChat?.save();

		res.json({ newChat, success: { message: 'Chat created successfully!' } });
	} catch (err) {
		console.log(err);
		errors.message = 'Error creating chat!';
		return res.status(400).json(errors);
	}
});

// Read
router.get('/chats', requireAuth, async (req, res) => {
	let errors = {};

	try {
		const chats = await Chat.find({
			users: { $elemMatch: { $eq: req?.user?._id } },
		})
			.populate('users')
			.sort('createdAt');
		res.json(chats);
	} catch (err) {
		console.log(err);
		errors.message = 'Error getting chat list!';
		return res.status(400).json(errors);
	}
});

module.exports = router;

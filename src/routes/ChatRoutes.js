const { Router } = require('express');
const { model, isValidObjectId } = require('mongoose');
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
	const hasId = req?.query?.id;
	let chats;

	try {
		if (hasId) {
			const isValid = isValidObjectId(hasId);
			if (!isValid) {
				errors.message =
					'Error, chat does not exist or you do not have permission to view it.';
				return res.status(404).json(errors);
			}

			chats = await Chat.findOne({
				_id: hasId,
				users: { $elemMatch: { $eq: req?.user?._id } },
			}).populate('users');

			if (!chats) {
				const userFound = await User.findById(hasId);
				if (userFound) {
					chats = await Chat.findOneAndUpdate(
						{
							isGroupChat: false,
							users: {
								$size: 2,
								$all: [
									{
										$elemMatch: {
											$eq: req?.user?._id,
										},
									},
									{
										$elemMatch: { $eq: userFound._id },
									},
								],
							},
						},
						{
							$setOnInsert: {
								users: [req?.user?._id, userFound._id],
							},
						},
						{
							new: true,
							upsert: true,
						}
					).populate('users');
				}
			}
		} else {
			chats = await Chat.find({
				users: { $elemMatch: { $eq: req?.user?._id } },
			})
				.populate('users')
				.sort('-updatedAt');
		}

		res.json(chats);
	} catch (err) {
		console.log(err);
		errors.message = 'Error getting chat list!';
		return res.status(400).json(errors);
	}
});

// Update
router.put('/chats/:id', requireAuth, async (req, res) => {});
module.exports = router;

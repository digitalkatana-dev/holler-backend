const { Router } = require('express');
const { model } = require('mongoose');
const { validateMessage } = require('../util/validators');
const requireAuth = require('../middleware/requireAuth');

const Chat = model('Chat');
const Message = model('Message');
const router = Router();

// Create
router.post('/messages', requireAuth, async (req, res) => {
	const { valid, errors } = validateMessage(req?.body);

	if (!valid) return res.status(400).json(errors);
	const { _id, firstName, lastName, dob, username, profilePic } = req?.user;
	const { chatId, content } = req?.body;

	const sender = {
		_id,
		firstName,
		lastName,
		dob,
		username,
		profilePic,
	};

	try {
		const messageData = {
			sender,
			content,
			chat: chatId,
		};

		const newMessage = new Message(messageData);
		await newMessage?.save();

		await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage });

		res.status(201).json({
			newMessage,
			success: { message: 'Message created successfully!' },
		});
	} catch (err) {
		console.log(err);
		errors.message = 'Error creating message!';
		return res.status(400).json(errors);
	}
});

module.exports = router;

const { Router } = require('express');
const { model } = require('mongoose');
const requireAuth = require('../middleware/requireAuth');

const Message = model('Message');
const router = Router();

// Create
router.post('/messages', requireAuth, async (req, res) => {
	let errors = {};

	try {
	} catch (err) {}
});

module.exports = router;

const { Router } = require('express');
const { model } = require('mongoose');
const requireAuth = require('../middleware/requireAuth');

const Notification = model('Notification');
const router = Router();

// Create
router.post('/notifications', requireAuth, async (req, res) => {});

// Read
router.get('/notifications', requireAuth, async (req, res) => {
	let errors = {};

	try {
		const myNotifications = await Notification.find({
			userTo: req?.user?._id,
			notificationType: { $ne: 'newMessage' },
		})
			.populate('userTo')
			.populate('userFrom')
			.sort('createdAt');

		if (!myNotifications) {
			errors.message = 'Error, notifications not found!';
			return res.status(404).json(errors);
		}

		res.json({
			myNotifications,
			success: { message: 'Notifications retrieved  successfully!' },
		});
	} catch (err) {
		console.log(err);
		errors.message = 'Error getting notifications!';
		return res.status(400).json(errors);
	}
});

// Update
router.put('/notifications/:id/toggle', requireAuth, async (req, res) => {
	let errors = {};
	const { id } = req?.params;

	const notification = await Notification.findById(id);
	const wasOpened = notification.opened;
	const option = wasOpened ? false : true;

	try {
		const updatedNotification = await Notification.findByIdAndUpdate(
			id,
			{
				$set: { opened: option },
			},
			{
				new: true,
			}
		);

		if (!updatedNotification) {
			errors.message = 'Error, notification not found!';
			return res.status(404).json(errors);
		}

		res.json({
			updatedNotification,
			success: { message: 'Notification marked as read.' },
		});
	} catch (err) {
		console.log(err);
		errors.message = 'Error updating notification!';
		return res.status(400).json(errors);
	}
});

router.put('/notifications/mark-all-read', requireAuth, async (req, res) => {
	const errors = {};

	try {
		let notifications = await Notification.find({
			userTo: req?.user?._id,
			notificationType: { $ne: 'newMessage' },
		});

		notifications.forEach(async (item) => {
			if (item.opened === false) {
				await Notification.findByIdAndUpdate(
					item._id,
					{
						$set: { opened: true },
					},
					{
						new: true,
					}
				);
			}
		});

		res.json({ success: { message: 'Notifications marked as read!' } });
	} catch (err) {
		console.log(err);
		errors.message = 'Error marking notifications as read';
		return res.status(400).json(errors);
	}
});

// Delete
router.delete('/notifications/:id/delete', requireAuth, async (req, res) => {
	let errors = {};
	const { id } = req?.params;

	try {
		const deletedNotification = await Notification.findByIdAndDelete(id);

		if (!deletedNotification) {
			errors.message = 'Error, notification not found!';
			return res.status(404).json(errors);
		}

		res.json({
			deletedNotification,
			success: { message: 'Notification deleted successfully!' },
		});
	} catch (err) {
		console.log(err);
		errors.message = 'Error deleting notification!';
		return res.status(400).json(errors);
	}
});

module.exports = router;

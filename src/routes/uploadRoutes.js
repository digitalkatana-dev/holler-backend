const { Router } = require('express');
const path = require('path');
const router = Router();

// Get uploads
router.get('/uploads/images/:path', async (req, res) => {
	try {
		res.sendFile(path.join(__dirname, `uploads/images/${req?.params?.path}`));
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;

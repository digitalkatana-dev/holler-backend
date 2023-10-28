const { Router } = require('express');
const { model } = require('mongoose');
const { sign } = require('jsonwebtoken');
const { genSalt, hash } = require('bcrypt');
const { createHash } = require('crypto');
const { config } = require('dotenv');
const requireAuth = require('../middleware/requireAuth');

const User = model('User');
const router = Router();
config();

//Register
router.post('/users/register', async (req, res) => {});
module.exports = router;

const { Schema, model } = require('mongoose');
const { genSalt, hash, compare } = require('bcrypt');
const { randomBytes, createHash } = require('crypto');

const userSchema = new Schema(
	{
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
		},
		dob: {
			type: String,
			required: true,
		},
		username: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
		profilePic: {
			type: String,
			default: 'https://holler-backend.onrender.com/uploads/images/no-user.png',
		},
		coverPhoto: {
			type: String,
		},
		following: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		passwordChangeAt: {
			type: Date,
		},
		passwordResetToken: {
			type: String,
		},
		passwordResetTokenExpires: {
			type: Date,
		},
	},
	{
		toJSON: {
			virtuals: true,
		},
		toObject: {
			virtuals: true,
		},
		timestamps: true,
	}
);

userSchema.virtual('posts', {
	ref: 'Post',
	localField: '_id',
	foreignField: 'postedBy',
	options: { match: { replyTo: { $exists: false } } },
});

userSchema.virtual('replies', {
	ref: 'Post',
	localField: '_id',
	foreignField: 'postedBy',
	options: { match: { replyTo: { $exists: true } } },
});

userSchema.virtual('likes', {
	ref: 'Post',
	localField: '_id',
	foreignField: 'likes',
	justOne: false,
	// options: { match: { likes: '$$localField' } },
});

userSchema.virtual('followers', {
	ref: 'User',
	localField: '_id',
	foreignField: 'following',
});

userSchema.virtual('repostUsers', {
	ref: 'Post',
	localField: '_id',
	foreignField: 'repostUsers',
	justOne: false,
});

userSchema.pre('save', function (next) {
	const user = this;
	if (!user.isModified('password')) {
		return next();
	}

	genSalt(10, (err, salt) => {
		if (err) {
			return next(err);
		}

		hash(user.password, salt, (err, _hash) => {
			if (err) {
				return next(err);
			}
			user.password = _hash;
			next();
		});
	});
});

userSchema.methods.comparePassword = function (candidatePassword) {
	const user = this;

	return new Promise((resolve, reject) => {
		compare(candidatePassword, user.password, (err, isMatch) => {
			if (err) {
				return reject(err);
			}

			if (!isMatch) {
				return reject(false);
			}

			resolve(true);
		});
	});
};

userSchema.methods.createPasswordResetToken = function () {
	const resetToken = randomBytes(32).toString('hex');
	this.passwordResetToken = createHash('sha256')
		.update(resetToken)
		.digest('hex');
	this.passwordResetTokenExpires = Date.now() + 30 * 60 * 1000;
	return resetToken;
};

model('User', userSchema);

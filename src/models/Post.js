const { Schema, model } = require('mongoose');

const postSchema = new Schema(
	{
		content: {
			type: String,
			trim: true,
		},
		postedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		pinned: {
			type: Boolean,
		},
		replies: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Post',
			},
		],
		likes: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		reposts: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		repostData: {
			type: Schema.Types.ObjectId,
			ref: 'Post',
		},
		replyTo: {
			type: Schema.Types.ObjectId,
			ref: 'Post',
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

model('Post', postSchema);

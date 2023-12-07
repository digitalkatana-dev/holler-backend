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
		nsfw: {
			type: Boolean,
			default: false,
		},
		pinned: {
			type: Boolean,
		},
		likes: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		repostUsers: [
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

postSchema.virtual('replies', {
	ref: 'Post',
	localField: '_id',
	foreignField: 'replyTo',
});

model('Post', postSchema);

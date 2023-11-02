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
		likes: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
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

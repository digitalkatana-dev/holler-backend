const { Schema, model } = require('mongoose');

const chatSchema = new Schema(
	{
		chatName: {
			type: String,
			trim: true,
		},
		isGroupChat: {
			type: Boolean,
			default: false,
		},
		users: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		latestMessage: {
			type: Schema.Types.ObjectId,
			ref: 'Messages',
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

model('Chat', chatSchema);

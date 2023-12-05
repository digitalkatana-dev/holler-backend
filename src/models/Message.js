const { Schema, model } = require('mongoose');

const messageSchema = new Schema(
	{
		sender: {
			type: Object,
		},
		content: {
			type: String,
			trim: true,
		},
		chat: {
			type: Schema.Types.ObjectId,
			ref: 'Chat',
		},
		readBy: [
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

model('Message', messageSchema);

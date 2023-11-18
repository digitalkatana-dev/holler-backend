const { Schema, model } = require('mongoose');

const messageSchema = new Schema(
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
				ref: 'Users',
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

model('Message', messageSchema);

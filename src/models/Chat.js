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
			ref: 'Message',
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

chatSchema.virtual('messages', {
	ref: 'Message',
	localField: '_id',
	foreignField: 'chat',
});

model('Chat', chatSchema);

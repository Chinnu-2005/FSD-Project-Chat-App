const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupChatSchema = new Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    groupImage: {
      type: String,
    },
    description: {
      type: String,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    admins: [
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
  { timestamps: true }
);

module.exports = mongoose.model('GroupChat', groupChatSchema);

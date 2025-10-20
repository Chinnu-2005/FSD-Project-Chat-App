const mongoose = require('mongoose');
const { Schema } = mongoose;

const privateChatSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    latestMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

// Ensure only two participants
privateChatSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('Private chat must have exactly 2 participants.'));
  }
  next();
});

module.exports = mongoose.model('PrivateChat', privateChatSchema);

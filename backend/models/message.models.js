const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    fileUrl: {
      type: String,
    },
    
    privateChat: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateChat',
    },
    groupChat: {
      type: Schema.Types.ObjectId,
      ref: 'GroupChat',
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);


messageSchema.pre('save', function (next) {
  if (!this.privateChat && !this.groupChat) {
    return next(new Error('Message must belong to either a private or group chat.'));
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);

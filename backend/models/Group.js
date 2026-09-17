import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  // The user who created this group
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);
export default Group;

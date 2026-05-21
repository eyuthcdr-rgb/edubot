import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username:   { type: String, default: '' },
  firstName:  { type: String, default: '' },
  lastName:   { type: String, default: '' },
  role:       { type: String, enum: ['student', 'admin'], default: 'student' },
  status:     { type: String, enum: ['pending', 'approved', 'blocked'], default: 'pending' },
  joinedGroup: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('User', userSchema);

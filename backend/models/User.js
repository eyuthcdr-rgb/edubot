import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  text:     { type: String, default: '' },
  fileUrl:  { type: String, default: '' },
  fileType: { type: String, default: '' },
  createdAt:{ type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  telegramId:      { type: Number, required: true, unique: true },
  username:        { type: String, default: '' },
  firstName:       { type: String, default: '' },
  lastName:        { type: String, default: '' },
  role:            { type: String, enum: ['student','admin'], default: 'student' },
  status:          { type: String, enum: ['pending','approved','blocked'], default: 'pending' },
  joinedGroup:     { type: Boolean, default: false },
  fullName:        { type: String, default: '' },
  profilePicUrl:   { type: String, default: '' },
  academicLevel:   { type: String, default: '' },
  bio:             { type: String, default: '' },
  lastSeen:        { type: Date, default: Date.now },
  regStep:         { type: String, enum: ['done','awaiting_name','awaiting_level','awaiting_photo'], default: 'awaiting_name' },
  feedbackHistory: [feedbackSchema],
  enrolledSubjects:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);

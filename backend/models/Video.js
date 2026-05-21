import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  subject:     { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  url:         { type: String, required: true },  // YouTube or direct link
  thumbnail:   { type: String, default: '' },
  duration:    { type: String, default: '' },      // e.g. "12:34"
  addedBy:     { type: Number },
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);

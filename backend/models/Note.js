import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  subject:     { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title:       { type: String, required: true },
  content:     { type: String, required: true },
  fileUrl:     { type: String, default: '' },   // PDF upload via Cloudinary
  fileType:    { type: String, default: '' },   // 'pdf' | 'image'
  addedBy:     { type: Number },                // Telegram ID of uploader
  pinned:      { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Note', noteSchema);

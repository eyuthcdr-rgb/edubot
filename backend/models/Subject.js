import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  icon:        { type: String, default: '📚' },
  color:       { type: String, default: '#4F8EF7' },
  order:       { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);

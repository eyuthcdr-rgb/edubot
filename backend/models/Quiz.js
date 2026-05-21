import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options:  [{ type: String }],          // 4 choices
  answer:   { type: Number, required: true }, // index of correct option (0-3)
  explanation: { type: String, default: '' },
});

const quizSchema = new mongoose.Schema({
  subject:   { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title:     { type: String, required: true },
  questions: [questionSchema],
  addedBy:   { type: Number },
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);

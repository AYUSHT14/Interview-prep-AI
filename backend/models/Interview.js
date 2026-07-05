const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, required: true },
  type: { type: String, required: true }, // Technical, Behavioral, System Design
  format: { type: String, default: 'open-ended' }, // open-ended, mcq
  difficulty: { type: String, required: true }, // Easy, Medium, Hard
  status: { type: String, default: 'active' }, // active, completed
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: String,
    userAnswer: String,
    feedback: {
      score: Number,
      comments: String,
      betterAnswer: String
    }
  }],
  overallScore: { type: Number, default: 0 },
  overallFeedback: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let MongoInterview;
try {
  MongoInterview = mongoose.model('Interview', InterviewSchema);
} catch (e) {
  MongoInterview = mongoose.model('Interview');
}

const InterviewModel = {
  create: async (data) => MongoInterview.create(data),
  findById: async (id) => MongoInterview.findById(id),
  find: async (query) => MongoInterview.find(query).sort({ createdAt: -1 }),
  findByIdAndUpdate: async (id, update) => MongoInterview.findByIdAndUpdate(id, update, { new: true }),
  findByIdAndDelete: async (id) => MongoInterview.findByIdAndDelete(id)
};

module.exports = InterviewModel;

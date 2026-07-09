const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { isFallback } = require('../config/db');

const INTERVIEWS_FILE = path.join(__dirname, '../data/interviews.json');

const readInterviews = async () => {
  try {
    const data = await fs.readFile(INTERVIEWS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
};

const writeInterviews = async (interviews) => {
  await fs.writeFile(INTERVIEWS_FILE, JSON.stringify(interviews, null, 2), 'utf8');
};

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
  create: async (data) => {
    if (isFallback()) {
      const interviews = await readInterviews();
      const newInterview = {
        _id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: [],
        overallScore: 0,
        overallFeedback: '',
        ...data
      };
      interviews.push(newInterview);
      await writeInterviews(interviews);
      return newInterview;
    }
    return MongoInterview.create(data);
  },

  findById: async (id) => {
    if (isFallback()) {
      const interviews = await readInterviews();
      return interviews.find(i => i._id === id || i.id === id) || null;
    }
    return MongoInterview.findById(id);
  },

  find: async (query) => {
    if (isFallback()) {
      const interviews = await readInterviews();
      const results = interviews.filter(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return results;
    }
    return MongoInterview.find(query).sort({ createdAt: -1 });
  },

  findByIdAndUpdate: async (id, update) => {
    if (isFallback()) {
      const interviews = await readInterviews();
      const index = interviews.findIndex(i => i._id === id || i.id === id);
      if (index === -1) return null;
      
      const updatedFields = typeof update.toObject === 'function' ? update.toObject() : update;
      
      interviews[index] = {
        ...interviews[index],
        ...updatedFields,
        updatedAt: new Date().toISOString()
      };
      
      await writeInterviews(interviews);
      return interviews[index];
    }
    return MongoInterview.findByIdAndUpdate(id, update, { new: true });
  },

  findByIdAndDelete: async (id) => {
    if (isFallback()) {
      const interviews = await readInterviews();
      const index = interviews.findIndex(i => i._id === id || i.id === id);
      if (index === -1) return null;
      const deleted = interviews.splice(index, 1)[0];
      await writeInterviews(interviews);
      return deleted;
    }
    return MongoInterview.findByIdAndDelete(id);
  }
};

module.exports = InterviewModel;

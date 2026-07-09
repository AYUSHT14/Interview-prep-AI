const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { isFallback } = require('../config/db');

const USERS_FILE = path.join(__dirname, '../data/users.json');

const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
};

const writeUsers = async (users) => {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
};

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

let MongoUser;
try {
  MongoUser = mongoose.model('User', UserSchema);
} catch (e) {
  MongoUser = mongoose.model('User');
}

const UserModel = {
  findOne: async (query) => {
    if (isFallback()) {
      const users = await readUsers();
      return users.find(u => {
        for (let key in query) {
          if (u[key] !== query[key]) return false;
        }
        return true;
      }) || null;
    }
    return MongoUser.findOne(query);
  },

  findById: async (id) => {
    if (isFallback()) {
      const users = await readUsers();
      return users.find(u => u._id === id || u.id === id) || null;
    }
    return MongoUser.findById(id);
  },

  create: async (userData) => {
    if (isFallback()) {
      const users = await readUsers();
      const newUser = {
        _id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
        ...userData
      };
      users.push(newUser);
      await writeUsers(users);
      return newUser;
    }
    return MongoUser.create(userData);
  }
};

module.exports = UserModel;

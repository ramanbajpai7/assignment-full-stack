const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/codesDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const codeSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, default: () => Date.now() + 60000 }, // 60 seconds expiration
});

const Code = mongoose.model('Code', codeSchema);

function generateCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }

  return code;
}

app.get('/api/codes', async (req, res) => {
  try {
    const newCode = await Code.create({ code: generateCode(6) });
    res.json({ code: newCode.code });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/codes/use', async (req, res) => {
  const userCode = req.body.code;

  try {
    const code = await Code.findOne({ code: userCode, used: false, expiresAt: { $gt: new Date() } });

    if (!code) {
      res.status(400).json({ error: 'Enter a valid code' });
    } else {
      // Mark the code as used
      code.used = true;
      await code.save();
      res.json({ message: 'Code is correct' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

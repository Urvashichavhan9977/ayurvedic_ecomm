require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node checkUser.js <email>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) {
    console.log('NOT_FOUND');
  } else {
    console.log('FOUND');
    console.log(JSON.stringify({ email: user.email, name: user.name, role: user.role, isActive: user.isActive }, null, 2));
  }
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => { console.error('ERROR', err.message); process.exit(1); });

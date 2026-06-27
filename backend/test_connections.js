require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

let log = '';
function print(msg) {
  console.log(msg);
  log += msg + '\n';
}

async function testMongo() {
  print('Testing MongoDB connection...');
  const uri = process.env.MONGODB_URI;
  print('URI: ' + (uri ? uri.replace(/:([^@]+)@/, ':****@') : 'undefined'));
  try {
    await mongoose.connect(uri);
    print('MongoDB connection SUCCESSFUL!');
    await mongoose.disconnect();
  } catch (err) {
    print('MongoDB connection FAILED: ' + err.message + '\n' + err.stack);
  }
}

async function testGemini() {
  print('\nTesting Gemini connection...');
  const apiKey = process.env.GEMINI_API_KEY;
  print('API Key: ' + (apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined'));
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say Hello');
    print('Gemini API SUCCESSFUL! Response: ' + result.response.text());
  } catch (err) {
    print('Gemini API FAILED: ' + err.message + '\n' + err.stack);
  }
}

async function main() {
  await testMongo();
  await testGemini();
  fs.writeFileSync('connections_test_results.txt', log);
  print('\nResults saved to connections_test_results.txt');
}

main();

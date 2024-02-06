const mongoose = require('mongoose');
const userSchema = require('./schema')

mongoose.connect('mongodb://127.0.0.1:27017/chat-bot-user')
.then(() => console.log('mongodb connected'))
.catch((err) => console.log("Mongo error",err))

const User = mongoose.model('users', userSchema);
module.exports = User;
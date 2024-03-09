const mongoose = require('mongoose');
const JoinSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    email: { type: String, required: true },
    date: { type: Date, required: true },
    state: { type: String, required: true}
});
module.exports = mongoose.model('Join', JoinSchema);

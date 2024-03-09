const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  
  batchNumber: {
    type: String,
  },
  courseName: {
    type: String,
  },
  recordings: [
    {
      name: {
        type: String,
      },
      url: {
        type: String,
      }
    }
  ],
  product:{type:String}
});

const Recording = mongoose.model('Recording', recordingSchema);

module.exports = Recording;

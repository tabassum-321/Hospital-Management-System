const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization:{ type: String, required: true },
  department:    { type: String, required: true },
  qualifications:{ type: String },
  experience:    { type: Number }, // years
  consultFee:    { type: Number, default: 100 },
  bio:           { type: String },
  schedule: [{
    day:       { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
    startTime: { type: String },
    endTime:   { type: String },
    isAvailable:{ type: Boolean, default: true }
  }],
  rating:        { type: Number, default: 0 },
  reviewCount:   { type: Number, default: 0 },
  isAvailable:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
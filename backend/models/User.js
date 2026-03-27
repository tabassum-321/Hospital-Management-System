// ===== models/User.js =====
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName:        { type: String, required: true, trim: true },
  lastName:         { type: String, required: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String, required: true, minlength: 6 },
  phone:            { type: String },
  dob:              { type: Date },
  gender:           { type: String, enum: ['Male','Female','Other'] },
  address:          { type: String },
  bloodGroup:       { type: String },
  emergencyContact: { type: String },
  role:             { type: String, enum: ['patient','doctor','admin'], default: 'patient' },
  isActive:         { type: Boolean, default: true },
  profilePic:       { type: String },
  medicalHistory:   [{ condition: String, year: Number, notes: String }],
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
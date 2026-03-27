/**
 * ============================================
 * MEDICARE HOSPITAL — SEED SCRIPT
 * ============================================
 * Run this ONCE to create:
 *  - 1 default Super Admin
 *  - 3 sample Doctors
 *
 * HOW TO RUN:
 *   cd backend
 *   node seed.js
 * ============================================
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

// Load User model
const bcrypt   = require('bcryptjs');
const mongoose2 = require('mongoose');

// ── Inline User Schema (to avoid circular deps) ──────────────
const userSchema = new mongoose2.Schema({
  firstName:        { type: String, required: true },
  lastName:         { type: String, required: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String, required: true },
  phone:            { type: String },
  gender:           { type: String },
  role:             { type: String, enum: ['patient','doctor','admin'], default: 'patient' },
  specialization:   { type: String },
  department:       { type: String },
  experience:       { type: Number },
  qualifications:   { type: String },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose2.model('User', userSchema);

// ── Seed Data ─────────────────────────────────────────────────
const seedData = {

  // ✅ Super Admin — only ONE needed
  admin: {
    firstName:  'Super',
    lastName:   'Admin',
    email:      'admin@medicare.com',
    password:   'Admin@1234',       // ← Change this after first login!
    phone:      '+1-800-123-4567',
    gender:     'Male',
    role:       'admin',
  },

  // ✅ Doctors — add as many as you need
  doctors: [
    {
      firstName:      'Sarah',
      lastName:       'Johnson',
      email:          'sarah.johnson@medicare.com',
      password:       'Doctor@1234',
      phone:          '+1-555-001-0001',
      gender:         'Female',
      role:           'doctor',
      specialization: 'Cardiologist',
      department:     'Cardiology',
      experience:     12,
      qualifications: 'MD, FACC',
    },
    {
      firstName:      'Michael',
      lastName:       'Chen',
      email:          'michael.chen@medicare.com',
      password:       'Doctor@1234',
      phone:          '+1-555-001-0002',
      gender:         'Male',
      role:           'doctor',
      specialization: 'Neurologist',
      department:     'Neurology',
      experience:     15,
      qualifications: 'MD, FAAN',
    },
    {
      firstName:      'Emily',
      lastName:       'Davis',
      email:          'emily.davis@medicare.com',
      password:       'Doctor@1234',
      phone:          '+1-555-001-0003',
      gender:         'Female',
      role:           'doctor',
      specialization: 'Pediatrician',
      department:     'Pediatrics',
      experience:     9,
      qualifications: 'MD, FAAP',
    },
  ],
};

// ── Main Seed Function ────────────────────────────────────────
async function seed() {
  try {
    // Connect to MongoDB
    await mongoose2.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicare_hospital');
    console.log('✅  MongoDB connected\n');

    let created = 0;
    let skipped = 0;

    // ── Create Admin ──────────────────────────────────────────
    console.log('👤  Creating Admin account...');
    const adminExists = await User.findOne({ email: seedData.admin.email });
    if (adminExists) {
      console.log(`   ⚠️  Admin already exists → ${seedData.admin.email} (skipped)\n`);
      skipped++;
    } else {
      const hashedPw = await bcrypt.hash(seedData.admin.password, 12);
      await User.create({ ...seedData.admin, password: hashedPw });
      console.log(`   ✅  Admin created!\n`);
      created++;
    }

    // ── Create Doctors ────────────────────────────────────────
    console.log('👨‍⚕️  Creating Doctor accounts...');
    for (const doc of seedData.doctors) {
      const exists = await User.findOne({ email: doc.email });
      if (exists) {
        console.log(`   ⚠️  ${doc.firstName} ${doc.lastName} already exists (skipped)`);
        skipped++;
      } else {
        const hashedPw = await bcrypt.hash(doc.password, 12);
        await User.create({ ...doc, password: hashedPw });
        console.log(`   ✅  Dr. ${doc.firstName} ${doc.lastName} created (${doc.department})`);
        created++;
      }
    }

    // ── Summary ───────────────────────────────────────────────
    console.log('\n============================================');
    console.log('🏥  SEED COMPLETE');
    console.log('============================================');
    console.log(`   Created : ${created} account(s)`);
    console.log(`   Skipped : ${skipped} (already existed)`);
    console.log('\n📋  LOGIN CREDENTIALS:');
    console.log('--------------------------------------------');
    console.log('🔐  ADMIN');
    console.log(`    Email    : ${seedData.admin.email}`);
    console.log(`    Password : ${seedData.admin.password}`);
    console.log(`    URL      : http://localhost:5000/frontend/pages/admin-login.html`);
    console.log('\n👨‍⚕️  DOCTORS (all use same password)');
    seedData.doctors.forEach(d => {
      console.log(`    ${d.firstName} ${d.lastName} (${d.department})`);
      console.log(`    Email    : ${d.email}`);
    });
    console.log(`    Password : ${seedData.doctors[0].password}`);
    console.log(`    URL      : http://localhost:5000/frontend/pages/admin-login.html`);
    console.log('--------------------------------------------');
    console.log('\n⚠️  IMPORTANT: Change passwords after first login!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
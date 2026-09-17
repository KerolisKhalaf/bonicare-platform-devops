import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  passwordHash: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  fcmToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

userSchema.post('save', async function (doc, next) {
  if (process.env.NODE_ENV === 'test') return next();

  try {
    if (doc.role === 'doctor') {
      const DoctorProfile = (await import('./DoctorProfile.js')).default;
      await DoctorProfile.findOneAndUpdate(
        { userId: doc._id },
        {
          userId: doc._id,
          licenseNumber: `PENDING-${doc._id.toString()}`,
        },
        { upsert: true, new: true }
      );
    } else if (doc.role === 'patient') {
      const Patient = (await import('./patient.js')).default;
      await Patient.findOneAndUpdate(
        { user: doc._id },
        { user: doc._id },
        { upsert: true, new: true }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.models.User || mongoose.model('User', userSchema);

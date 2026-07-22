import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, 
    },
    organization: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      index: true, // tells MongoDB to index this field, making queries like "Find all users in Organization X" much faster.
    },
    role: { 
      type: String, 
      enum: ['teacher', 'admin'], 
      default: 'teacher' 
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

// Encrypt password before saving
// This is Mongoose middleware. It acts as an interceptor that runs automatically right before a user document is saved to the database.
userSchema.pre('save', async function() {
  // If we are just updating a token (like during login), skip the password hashing!
  if (!this.isModified('password')) {
    return; // Notice: No next() needed! Just return.
  }

  // Only hash if the password is brand new or was just changed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
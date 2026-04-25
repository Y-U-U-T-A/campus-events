const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    studentId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        enum: ['csit', 'mechanical', 'cultural', 'sports', 'business', 'other'],
        lowercase: true
    },
    interests: [{
        type: String,
        enum: ['tech', 'social', 'sports', 'career', 'arts', 'academic'],
        lowercase: true
    }],
    role: {
        type: String,
        enum: ['student', 'admin', 'organizer'],
        default: 'student'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    savedEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    reminders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    profileImage: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to save event
userSchema.methods.saveEvent = function(eventId) {
    if (!this.savedEvents.includes(eventId)) {
        this.savedEvents.push(eventId);
        return this.save();
    }
    return this;
};

// Method to unsave event
userSchema.methods.unsaveEvent = function(eventId) {
    this.savedEvents = this.savedEvents.filter(id => !id.equals(eventId));
    return this.save();
};

// Method to add reminder
userSchema.methods.addReminder = function(eventId) {
    if (!this.reminders.includes(eventId)) {
        this.reminders.push(eventId);
        return this.save();
    }
    return this;
};

// Method to remove reminder
userSchema.methods.removeReminder = function(eventId) {
    this.reminders = this.reminders.filter(id => !id.equals(eventId));
    return this.save();
};

module.exports = mongoose.model('User', userSchema);

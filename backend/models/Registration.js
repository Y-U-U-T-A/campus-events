const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Event is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        enum: ['csit', 'mechanical', 'business', 'arts', 'cultural', 'sports', 'other'],
        lowercase: true
    },
    specialRequests: {
        type: String,
        maxlength: [500, 'Special requests cannot exceed 500 characters']
    },
    ticketId: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled', 'attended', 'no-show'],
        default: 'confirmed'
    },
    checkInTime: {
        type: Date
    },
    rating: {
        type: Number,
        min: 0,
        max: 5
    },
    feedback: {
        type: String,
        maxlength: [1000, 'Feedback cannot exceed 1000 characters']
    },
    registrationDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate registrations
registrationSchema.index({ event: 1, email: 1 }, { unique: true });

// Indexes for queries
registrationSchema.index({ ticketId: 1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ createdAt: -1 });

// Static method to generate ticket ID
registrationSchema.statics.generateTicketId = function() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `EVT-${timestamp}-${random}`.toUpperCase();
};

// Method to check in
registrationSchema.methods.checkIn = function() {
    this.status = 'attended';
    this.checkInTime = new Date();
    return this.save();
};

// Method to cancel registration
registrationSchema.methods.cancel = function() {
    this.status = 'cancelled';
    return this.save();
};

// Method to add rating and feedback
registrationSchema.methods.addFeedback = function(rating, feedback) {
    this.rating = rating;
    this.feedback = feedback;
    return this.save();
};

module.exports = mongoose.model('Registration', registrationSchema);

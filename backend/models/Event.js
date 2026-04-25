const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['tech', 'social', 'sports', 'career', 'arts', 'academic'],
        lowercase: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['csit', 'mechanical', 'cultural', 'sports', 'business'],
        lowercase: true
    },
    difficulty: {
        type: String,
        required: [true, 'Difficulty level is required'],
        enum: ['beginner', 'intermediate', 'advanced'],
        lowercase: true
    },
    date: {
        type: Date,
        required: [true, 'Event date is required']
    },
    time: {
        type: String,
        required: [true, 'Event time is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [1, 'Capacity must be at least 1']
    },
    registered: {
        type: Number,
        default: 0,
        min: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    ratingCount: {
        type: Number,
        default: 0,
        min: 0
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    organizer: {
        type: String,
        required: [true, 'Organizer is required'],
        trim: true
    },
    price: {
        type: String,
        default: 'Free'
    },
    image: {
        type: String,
        default: '🎉'
    },
    popularity: {
        type: String,
        enum: ['trending', 'most-registered', 'new', ''],
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ department: 1 });
eventSchema.index({ popularity: 1 });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
    return this.capacity - this.registered;
});

// Virtual for isFull
eventSchema.virtual('isFull').get(function() {
    return this.registered >= this.capacity;
});

// Method to add rating
eventSchema.methods.addRating = function(rating) {
    const totalRating = (this.rating * this.ratingCount) + rating;
    this.ratingCount += 1;
    this.rating = totalRating / this.ratingCount;
    return this.save();
};

// Method to increment registered count
eventSchema.methods.incrementRegistered = function() {
    if (this.registered < this.capacity) {
        this.registered += 1;
        return this.save();
    }
    throw new Error('Event is full');
};

// Static method to get upcoming events
eventSchema.statics.getUpcoming = function() {
    return this.find({
        date: { $gte: new Date() },
        isActive: true
    }).sort({ date: 1 });
};

// Static method to get trending events
eventSchema.statics.getTrending = function() {
    return this.find({
        popularity: 'trending',
        isActive: true,
        date: { $gte: new Date() }
    }).sort({ registered: -1 }).limit(10);
};

module.exports = mongoose.model('Event', eventSchema);

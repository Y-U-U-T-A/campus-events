const mongoose = require('mongoose');

async function testDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/campus-events');
        console.log('✅ Connected to MongoDB');
        
        const Event = mongoose.model('Event', new mongoose.Schema({}, { strict: false }));
        const count = await Event.countDocuments();
        console.log(`📊 Events in database: ${count}`);
        
        const events = await Event.find().limit(2);
        console.log('📋 Sample events:', JSON.stringify(events, null, 2));
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testDB();

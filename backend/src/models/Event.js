import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    trim: true,
    lowercase: true,
    enum: ['academic', 'cultural', 'sports', 'workshop', 'seminar', 'conference', 'social', 'other']
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Event location is required']
  },
  dateTime: {
    type: Date,
    required: [true, 'Event date and time is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  capacity: {
    type: Number,
    min: [1, 'Capacity must be at least 1'],
    default: 50
  },
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  organizer: {
    type: String,
    required: [true, 'Event organizer is required'],
    trim: true,
    maxlength: [100, 'Organizer name cannot exceed 100 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event creator is required'],
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
eventSchema.index({ category: 1, dateTime: 1 });
eventSchema.index({ locationId: 1, dateTime: 1 });
eventSchema.index({ dateTime: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  return this.capacity - this.attendees.length;
});

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
  return this.attendees.length >= this.capacity;
});

// Method to register user for event
eventSchema.methods.registerUser = function(userId) {
  // Check if user is already registered
  const isAlreadyRegistered = this.attendees.some(
    attendee => attendee.userId.toString() === userId.toString()
  );
  
  if (isAlreadyRegistered) {
    throw new Error('User is already registered for this event');
  }
  
  if (this.isFull) {
    throw new Error('Event is full');
  }
  
  this.attendees.push({ userId });
  return this.save();
};

// Method to unregister user from event
eventSchema.methods.unregisterUser = function(userId) {
  this.attendees = this.attendees.filter(
    attendee => attendee.userId.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to find events by date range
eventSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    dateTime: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('locationId', 'name coordinates type');
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function(limit = 10) {
  return this.find({
    dateTime: { $gte: new Date() }
  })
  .sort({ dateTime: 1 })
  .limit(limit)
  .populate('locationId', 'name coordinates type');
};

// Static method to get recommended events based on user interests
eventSchema.statics.getRecommendations = function(userInterests, limit = 5) {
  const query = userInterests.length > 0 
    ? { tags: { $in: userInterests }, dateTime: { $gte: new Date() } }
    : { dateTime: { $gte: new Date() } };
  
  return this.find(query)
    .sort({ dateTime: 1, createdAt: -1 })
    .limit(limit)
    .populate('locationId', 'name coordinates type');
};

// Static method to find events by creator (for organizer dashboard)
eventSchema.statics.findByCreator = function(userId, options = {}) {
  const query = { createdBy: userId };
  
  // Optionally filter by upcoming events only
  if (options.upcomingOnly) {
    query.dateTime = { $gte: new Date() };
  }
  
  // Build the query chain
  let queryChain = this.find(query);
  
  // Apply custom sort if provided, otherwise default sort
  if (options.sort) {
    queryChain = queryChain.sort(options.sort);
  } else {
    queryChain = queryChain.sort({ dateTime: options.upcomingOnly ? 1 : -1 });
  }
  
  // Apply populate if provided
  if (options.populate) {
    if (Array.isArray(options.populate)) {
      options.populate.forEach(pop => queryChain = queryChain.populate(pop));
    } else {
      queryChain = queryChain.populate(options.populate);
    }
  } else {
    // Default populate
    queryChain = queryChain.populate('locationId', 'name coordinates type');
  }
  
  return queryChain;
};

// Instance method to check if user is the creator of the event
eventSchema.methods.isCreatedBy = function(userId) {
  return this.createdBy.toString() === userId.toString();
};

// Ensure virtuals are included in JSON output
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export default mongoose.model('Event', eventSchema);

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ES module equivalents of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
import User from '../src/models/User.js';
import Location from '../src/models/Location.js';
import Event from '../src/models/Event.js';

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Sample locations around Thapar campus
const sampleLocations = [
  {
    name: "Main Gate",
    description: "Primary entrance to Thapar Institute",
    type: "poi",
    coordinates: { lat: 30.3568, lng: 76.3619 },
    tags: ["entrance", "main", "gate", "security"]
  },
  {
    name: "Central Library",
    description: "Main library building with extensive collection",
    type: "building",
    coordinates: { lat: 30.3573, lng: 76.3631 },
    tags: ["library", "books", "study", "academic"]
  },
  {
    name: "Sports Complex",
    description: "Multi-purpose sports and recreation facility",
    type: "building",
    coordinates: { lat: 30.3549, lng: 76.3615 },
    tags: ["sports", "gym", "recreation", "fitness"]
  },
  {
    name: "Academic Block A",
    description: "Main academic building for engineering departments",
    type: "building",
    coordinates: { lat: 30.3561, lng: 76.3628 },
    tags: ["academic", "engineering", "classrooms"]
  },
  {
    name: "Academic Block B",
    description: "Secondary academic building",
    type: "building",
    coordinates: { lat: 30.3559, lng: 76.3623 },
    tags: ["academic", "classrooms", "labs"]
  },
  {
    name: "Student Center",
    description: "Hub for student activities and services",
    type: "building",
    coordinates: { lat: 30.3566, lng: 76.3621 },
    tags: ["student", "activities", "services", "food"]
  },
  {
    name: "Hostel Block 1",
    description: "Boys hostel accommodation",
    type: "building",
    coordinates: { lat: 30.3555, lng: 76.3635 },
    tags: ["hostel", "accommodation", "boys"]
  },
  {
    name: "Hostel Block 2",
    description: "Girls hostel accommodation",
    type: "building",
    coordinates: { lat: 30.3557, lng: 76.3638 },
    tags: ["hostel", "accommodation", "girls"]
  },
  {
    name: "Hostel H1",
    description: "Boys hostel H1",
    type: "building",
    coordinates: { lat: 30.3552, lng: 76.3641 },
    tags: ["hostel", "boys", "residence"]
  },
  {
    name: "Hostel H2",
    description: "Boys hostel H2",
    type: "building",
    coordinates: { lat: 30.3550, lng: 76.3646 },
    tags: ["hostel", "boys", "residence"]
  },
  {
    name: "Hostel GH1",
    description: "Girls hostel GH1",
    type: "building",
    coordinates: { lat: 30.3561, lng: 76.3642 },
    tags: ["hostel", "girls", "residence"]
  },
  {
    name: "NIE Library Lawn",
    description: "Green lawn area near the library for sitting and events",
    type: "poi",
    coordinates: { lat: 30.3570, lng: 76.3634 },
    tags: ["park", "lawn", "outdoor", "green"]
  },
  {
    name: "Old Admin Block",
    description: "Administrative offices",
    type: "building",
    coordinates: { lat: 30.3569, lng: 76.3616 },
    tags: ["administration", "office", "admin"]
  },
  {
    name: "New Admin Block",
    description: "New administrative offices",
    type: "building",
    coordinates: { lat: 30.3574, lng: 76.3619 },
    tags: ["administration", "office", "admin"]
  },
  {
    name: "Auditorium",
    description: "Main auditorium for cultural events",
    type: "building",
    coordinates: { lat: 30.3572, lng: 76.3629 },
    tags: ["auditorium", "cultural", "events", "stage"]
  },
  {
    name: "Central Park",
    description: "Central green park area inside campus",
    type: "poi",
    coordinates: { lat: 30.3560, lng: 76.3630 },
    tags: ["park", "garden", "outdoor", "green"]
  },
  {
    name: "Food Court",
    description: "Food court with multiple outlets",
    type: "poi",
    coordinates: { lat: 30.3567, lng: 76.3624 },
    tags: ["food", "dining", "canteen", "cafeteria"]
  },
  {
    name: "Medical Center",
    description: "Campus health and medical facility",
    type: "poi",
    coordinates: { lat: 30.3571, lng: 76.3626 },
    tags: ["medical", "health", "emergency"]
  },
  {
    name: "Cafeteria",
    description: "Main dining facility for students",
    type: "poi",
    coordinates: { lat: 30.3563, lng: 76.3622 },
    tags: ["food", "dining", "cafeteria", "meals"]
  },
  {
    name: "Computer Lab 1",
    description: "Main computer laboratory in Academic Block A",
    type: "room",
    coordinates: { lat: 30.3561, lng: 76.3628 },
    floor: "2",
    tags: ["computer", "lab", "programming", "academic"]
  },
  {
    name: "Lecture Hall 101",
    description: "Large lecture hall in Academic Block A",
    type: "room",
    coordinates: { lat: 30.3561, lng: 76.3628 },
    floor: "1",
    tags: ["lecture", "hall", "presentations", "academic"]
  }
];

// Sample events
const createSampleEvents = async (locations, users) => {
  const academicBlock = locations.find(loc => loc.name === "Academic Block A");
  const library = locations.find(loc => loc.name === "Central Library");
  const sportsComplex = locations.find(loc => loc.name === "Sports Complex");
  const studentCenter = locations.find(loc => loc.name === "Student Center");
  const lectureHall = locations.find(loc => loc.name === "Lecture Hall 101");
  
  // Find organizer users to assign as event creators
  const techClubOrganizer = users.find(u => u.email === "tech.club@student.thapar.edu");
  const culturalOrganizer = users.find(u => u.email === "cultural.society@student.thapar.edu");
  const sportsOrganizer = users.find(u => u.email === "sports.committee@student.thapar.edu");

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return [
    {
      title: "AI & Machine Learning Workshop",
      description: "Hands-on workshop covering fundamentals of AI and ML with practical examples",
      category: "workshop",
      locationId: academicBlock._id,
      dateTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
      capacity: 50,
      organizer: "Tech Club President",
      createdBy: techClubOrganizer._id,
      tags: ["ai", "machine-learning", "technology", "programming"]
    },
    {
      title: "Annual Tech Fest 2025",
      description: "Three-day technology festival featuring competitions, exhibitions, and guest speakers",
      category: "cultural",
      locationId: studentCenter._id,
      dateTime: new Date(nextWeek.setHours(9, 0, 0, 0)),
      capacity: 500,
      organizer: "Tech Club President",
      createdBy: techClubOrganizer._id,
      tags: ["technology", "competition", "exhibition", "fest"]
    },
    {
      title: "Inter-College Basketball Tournament",
      description: "Annual basketball tournament between engineering colleges",
      category: "sports",
      locationId: sportsComplex._id,
      dateTime: new Date(nextWeek.setHours(16, 0, 0, 0)),
      capacity: 200,
      organizer: "Sports Committee Lead",
      createdBy: sportsOrganizer._id,
      tags: ["basketball", "tournament", "sports", "competition"]
    },
    {
      title: "Career Guidance Seminar",
      description: "Seminar on career opportunities in emerging technologies",
      category: "seminar",
      locationId: lectureHall._id,
      dateTime: new Date(nextMonth.setHours(11, 0, 0, 0)),
      capacity: 100,
      organizer: "Tech Club President",
      createdBy: techClubOrganizer._id,
      tags: ["career", "guidance", "placement", "professional"]
    },
    {
      title: "Research Paper Writing Workshop",
      description: "Learn effective techniques for academic research and paper writing",
      category: "academic",
      locationId: library._id,
      dateTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
      capacity: 30,
      organizer: "Tech Club President",
      createdBy: techClubOrganizer._id,
      tags: ["research", "writing", "academic", "skills"]
    },
    {
      title: "Cultural Night 2025",
      description: "Evening of music, dance, and cultural performances by students",
      category: "cultural",
      locationId: studentCenter._id,
      dateTime: new Date(nextWeek.setHours(19, 0, 0, 0)),
      capacity: 300,
      organizer: "Cultural Society Head",
      createdBy: culturalOrganizer._id,
      tags: ["music", "dance", "culture", "performance"]
    }
  ];
};

// Sample users
const sampleUsers = [
  {
    name: "Admin User",
    email: "admin@thapar.edu",
    password: "Admin123",
    role: "admin",
    interests: ["technology", "management", "education"]
  },
  {
    name: "Tech Club President",
    email: "tech.club@student.thapar.edu",
    password: "Organizer123",
    role: "organizer",
    interests: ["technology", "ai", "hackathon", "events"]
  },
  {
    name: "Cultural Society Head",
    email: "cultural.society@student.thapar.edu",
    password: "Organizer123",
    role: "organizer",
    interests: ["culture", "music", "dance", "events"]
  },
  {
    name: "Sports Committee Lead",
    email: "sports.committee@student.thapar.edu",
    password: "Organizer123",
    role: "organizer",
    interests: ["sports", "fitness", "competition", "events"]
  },
  {
    name: "Rahul Sharma",
    email: "rahul.sharma@student.thapar.edu",
    password: "Student123",
    role: "user",
    interests: ["ai", "machine-learning", "programming", "technology"]
  },
  {
    name: "Priya Patel",
    email: "priya.patel@student.thapar.edu",
    password: "Student123",
    role: "user",
    interests: ["research", "academic", "writing", "career"]
  },
  {
    name: "Arjun Singh",
    email: "arjun.singh@student.thapar.edu",
    password: "Student123",
    role: "user",
    interests: ["sports", "basketball", "fitness", "competition"]
  },
  {
    name: "Sneha Gupta",
    email: "sneha.gupta@student.thapar.edu",
    password: "Student123",
    role: "user",
    interests: ["culture", "music", "dance", "performance"]
  }
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Location.deleteMany({});
    await Event.deleteMany({});
    
    console.log('Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      users.push({
        ...userData,
        password: hashedPassword
      });
    }
    
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create locations
    const createdLocations = await Location.insertMany(sampleLocations);
    console.log(`Created ${createdLocations.length} locations`);

    // Update room locations to reference their building
    const academicBlockA = createdLocations.find(loc => loc.name === "Academic Block A");
    
    await Location.updateMany(
      { 
        type: "room",
        "coordinates.lat": academicBlockA.coordinates.lat,
        "coordinates.lng": academicBlockA.coordinates.lng
      },
      { buildingId: academicBlockA._id }
    );

    // Create events (pass users for createdBy assignment)
    const sampleEvents = await createSampleEvents(createdLocations, createdUsers);
    const createdEvents = await Event.insertMany(sampleEvents);
    console.log(`Created ${createdEvents.length} events`);

    // Register some students for events (sample registrations)
    const studentUsers = createdUsers.filter(user => user.role === 'student');
    
    // Register first student for AI workshop
    const aiWorkshop = createdEvents.find(event => event.title.includes('AI'));
    if (aiWorkshop && studentUsers[0]) {
      aiWorkshop.attendees.push({ userId: studentUsers[0]._id });
      await aiWorkshop.save();
    }

    // Register second student for career seminar
    const careerSeminar = createdEvents.find(event => event.title.includes('Career'));
    if (careerSeminar && studentUsers[1]) {
      careerSeminar.attendees.push({ userId: studentUsers[1]._id });
      await careerSeminar.save();
    }

    console.log('Database seeding completed successfully!');
    console.log('\nSample Data Created:');
    console.log(`- ${createdUsers.length} users (including 1 admin)`);
    console.log(`- ${createdLocations.length} locations`);
    console.log(`- ${createdEvents.length} events`);
    console.log('\nSample Login Credentials:');
    console.log('Admin: admin@thapar.edu / Admin123');
    console.log('Student: rahul.sharma@student.thapar.edu / Student123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding
connectDB().then(() => {
  seedDatabase();
});

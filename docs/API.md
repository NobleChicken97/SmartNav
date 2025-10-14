# API Documentation

Smart Navigator Backend API Reference

## 🌐 Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

## 🔐 Authentication

All protected routes require JWT token in HTTP-only cookie `smart_navigator_token`.

### Auth Endpoints

#### POST `/auth/login`
Login user and set authentication cookie.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "userId",
    "email": "user@example.com",
    "role": "student"
  }
}
```

#### POST `/auth/register`
Register new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

#### POST `/auth/logout`
Logout user and clear authentication cookie.

---

## 📍 Locations API

### GET `/locations`
Get all campus locations with optional filtering.

**Query Parameters:**
- `category` - Filter by location category
- `search` - Search locations by name
- `limit` - Number of results to return
- `page` - Page number for pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "locationId",
      "name": "Library",
      "description": "Main campus library",
      "category": "academic",
      "coordinates": {
        "latitude": 30.3568,
        "longitude": 76.3647
      },
      "amenities": ["wifi", "study_rooms"],
      "isActive": true
    }
  ],
  "pagination": {
    "current": 1,
    "total": 5,
    "hasNext": false
  }
}
```

### GET `/locations/:id`
Get specific location details.

### POST `/locations` 🔒 *Admin Only*
Create new campus location.

**Request:**
```json
{
  "name": "New Building",
  "description": "Description of the location",
  "category": "academic",
  "coordinates": {
    "latitude": 30.3568,
    "longitude": 76.3647
  },
  "amenities": ["wifi", "parking"]
}
```

### PUT `/locations/:id` 🔒 *Admin Only*
Update existing location.

### DELETE `/locations/:id` 🔒 *Admin Only*
Delete location.

---

## 🎉 Events API

### GET `/events`
Get all campus events with optional filtering.

**Query Parameters:**
- `category` - Filter by event category
- `date` - Filter by date (YYYY-MM-DD)
- `location` - Filter by location ID
- `upcoming` - Show only upcoming events (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "eventId",
      "title": "Tech Fest 2024",
      "description": "Annual technology festival",
      "category": "cultural",
      "date": "2024-03-15T10:00:00Z",
      "location": {
        "id": "locationId",
        "name": "Main Auditorium"
      },
      "organizer": "Computer Science Department",
      "registrationRequired": true,
      "maxCapacity": 500,
      "currentRegistrations": 245
    }
  ]
}
```

### POST `/events` 🔒 *Admin Only*
Create new event.

### PUT `/events/:id` 🔒 *Admin Only*
Update existing event.

### DELETE `/events/:id` 🔒 *Admin Only*
Delete event.

### POST `/events/:id/register` 🔒 *Authentication Required*
Register user for an event.

---

## 👥 Users API

### GET `/users/profile` 🔒 *Authentication Required*
Get current user profile.

### PUT `/users/profile` 🔒 *Authentication Required*
Update user profile.

**Request:**
```json
{
  "name": "Updated Name",
  "preferences": {
    "notifications": true,
    "theme": "dark"
  }
}
```

### GET `/users` 🔒 *Admin Only*
Get all users (admin only).

---

## 🔒 Role-Based Access Control

### Roles:
- **Student**: Basic user with read access and event registration
- **Admin**: Can manage locations, events, and has elevated privileges

### Protected Route Examples:
- 🟢 **Public**: `/locations`, `/events` (GET only)
- 🔒 **Authentication Required**: User profile, event registration
- 👮 **Admin Only**: Create/Update/Delete locations and events, user management

---

## 📊 Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🗺️ Geographic Data Format

Coordinates use standard geographic format:
```json
{
  "coordinates": {
    "latitude": 30.3568,  // North/South position
    "longitude": 76.3647  // East/West position
  }
}
```

Campus bounds (Thapar Institute):
- **Latitude**: 30.354° to 30.359°N
- **Longitude**: 76.362° to 76.367°E

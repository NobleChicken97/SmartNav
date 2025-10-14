# 🔐 RBAC Implementation Plan - Smart Navigator

## 📋 Overview
Implementation of Role-Based Access Control (RBAC) with 3 roles:
- **👤 Student** (default) - View events, register, favorite locations
- **📋 Organizer** - Create/manage own events + student permissions
- **👑 Admin** - Full system access

**Total Estimated Time**: 10-12 hours across 5 steps  
**Confidence Level**: 95%+ (Fully analyzed, low risk)

---

## 🎯 Implementation Strategy

### Why This Approach?
✅ **Backward Compatible** - Existing features keep working  
✅ **Progressive** - Can implement & test step-by-step  
✅ **Minimal Breaking Changes** - Only affects admin routes  
✅ **Type Safe** - Full TypeScript support  
✅ **Secure by Default** - Fail-closed permission model

### Key Design Decisions

1. **Keep `authorize()` middleware** - Already exists, just extend roles
2. **Add `createdBy` to Events** - Track event ownership (critical for organizers)
3. **JWT includes role** - Fast permission checks, no DB lookup
4. **Owner-based permissions** - Organizers can only edit their own events
5. **Admin override** - Admins can manage anything (safety net)

---

## 📊 Current State Analysis

### ✅ What We Already Have (Good!)
```javascript
// backend/src/middleware/auth.js
- authenticate() ✅ - Verifies JWT tokens
- authorize(...roles) ✅ - Checks user roles
- optionalAuth() ✅ - Non-blocking auth

// backend/src/models/User.js
- role: ['student', 'admin'] ✅ - Needs 'organizer' added
- JWT generation ✅ - Already includes user ID

// backend/src/routes/events.js
- Admin-only routes ✅ - Currently POST/PUT/DELETE restricted
- Public routes ✅ - GET routes open
```

### ⚠️ What's Missing (Need to Build)
```javascript
❌ 'organizer' role in User model
❌ createdBy field in Event model
❌ isEventOwner() middleware (check if user created event)
❌ Permission matrix config
❌ Frontend role types ('organizer')
❌ Role-based UI components
❌ Organizer dashboard
❌ Admin dashboard
```

---

## 🚀 5-Step Implementation Plan

---

### **STEP 1: Backend Models & Database Schema** 
**Time**: 1.5-2 hours | **Risk**: Low | **Priority**: CRITICAL

#### What We'll Do:
1. Update `User` model to add 'organizer' role
2. Update `Event` model to add `createdBy` field
3. Add helper methods for ownership checking
4. Update indexes for performance

#### Files to Modify:
```
📁 backend/src/models/
  ├── User.js         - Add 'organizer' to enum
  └── Event.js        - Add createdBy ObjectId field
```

#### Changes Preview:

**User.js**:
```javascript
role: {
  type: String,
  enum: ['student', 'organizer', 'admin'], // ← ADD 'organizer'
  default: 'student'
}
```

**Event.js**:
```javascript
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: [true, 'Event creator is required'],
  index: true // ← For fast queries
},
// Keep organizer string for display name
organizer: {
  type: String,
  required: true
}
```

#### Why This Order?
- Models are foundation - everything else depends on them
- Database changes are easiest to rollback if needed
- No API changes yet, so frontend keeps working

#### Success Criteria:
✅ User model accepts 'organizer' role  
✅ Event model requires createdBy field  
✅ No TypeScript/ESLint errors  
✅ Existing tests still pass

---

### **STEP 2: Backend RBAC Middleware & Permissions**
**Time**: 2-2.5 hours | **Risk**: Medium | **Priority**: CRITICAL

#### What We'll Do:
1. Create permission matrix config
2. Build `isEventOwner()` middleware
3. Extend `authorize()` to handle organizer permissions
4. Add permission helper utilities

#### Files to Create/Modify:
```
📁 backend/src/
  ├── config/
  │   └── permissions.js    - NEW: Permission definitions
  └── middleware/
      ├── auth.js            - MODIFY: Add ownership checking
      └── rbac.js            - NEW: RBAC utilities
```

#### Changes Preview:

**config/permissions.js** (NEW):
```javascript
export const ROLES = {
  STUDENT: 'student',
  ORGANIZER: 'organizer',
  ADMIN: 'admin'
};

export const PERMISSIONS = {
  // Events
  EVENT_VIEW: ['student', 'organizer', 'admin'],
  EVENT_CREATE: ['organizer', 'admin'],
  EVENT_EDIT_OWN: ['organizer', 'admin'],
  EVENT_EDIT_ANY: ['admin'],
  EVENT_DELETE_OWN: ['organizer', 'admin'],
  EVENT_DELETE_ANY: ['admin'],
  
  // Locations
  LOCATION_VIEW: ['student', 'organizer', 'admin'],
  LOCATION_CREATE: ['admin'],
  LOCATION_EDIT: ['admin'],
  LOCATION_DELETE: ['admin'],
  
  // Users
  USER_VIEW_ALL: ['admin'],
  USER_EDIT_ANY: ['admin'],
  USER_DELETE_ANY: ['admin']
};
```

**middleware/rbac.js** (NEW):
```javascript
import Event from '../models/Event.js';

// Check if user owns the event
export const isEventOwner = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Admin can do anything
    if (req.user.role === 'admin') {
      req.event = event;
      return next();
    }
    
    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify events you created'
      });
    }
    
    req.event = event; // Attach to request
    next();
  } catch (error) {
    next(error);
  }
};
```

#### Why This Order?
- Permission matrix documents what each role can do
- Middleware enforces permissions at API level
- Can test permissions without UI changes

#### Success Criteria:
✅ Permission matrix defined clearly  
✅ isEventOwner() middleware works correctly  
✅ Admin can bypass ownership checks  
✅ Non-owners get 403 Forbidden

---

### **STEP 3: Backend Routes & Controller Updates**
**Time**: 2-2.5 hours | **Risk**: Medium | **Priority**: HIGH

#### What We'll Do:
1. Update event routes with new RBAC middleware
2. Modify event controller to set `createdBy` on creation
3. Add organizer-specific endpoints
4. Update validation to include createdBy

#### Files to Modify:
```
📁 backend/src/
  ├── routes/
  │   ├── events.js           - MODIFY: Add RBAC middleware
  │   └── locations.js        - MODIFY: Restrict to admin
  └── controllers/
      └── eventController.js  - MODIFY: Set createdBy on create
```

#### Changes Preview:

**routes/events.js**:
```javascript
import { isEventOwner } from '../middleware/rbac.js';

// Public routes
router.get('/', optionalAuth, getEvents);
router.get('/:id', getEvent);

// Authenticated routes
router.use(authenticate);
router.post('/:id/register', registerForEvent);

// Organizer routes (create events)
router.post('/', 
  authorize('organizer', 'admin'), 
  validateEvent, 
  createEvent
);

// Owner or admin only (edit/delete own events)
router.put('/:id', 
  authorize('organizer', 'admin'),
  isEventOwner, // ← Checks ownership
  validateEvent,
  updateEvent
);

router.delete('/:id',
  authorize('organizer', 'admin'),
  isEventOwner, // ← Checks ownership
  deleteEvent
);
```

**controllers/eventController.js**:
```javascript
export const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({
      ...req.body,
      createdBy: req.user._id, // ← Set creator
      organizer: req.user.name  // ← Display name
    });
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};
```

#### Why This Order?
- Routes use middleware from Step 2
- Controllers implement business logic
- Can test entire backend before touching frontend

#### Success Criteria:
✅ Students can view events  
✅ Organizers can create events  
✅ Organizers can only edit own events  
✅ Admins can edit any event  
✅ Location routes admin-only

---

### **STEP 4: Frontend Types, Store & Auth Updates**
**Time**: 2-3 hours | **Risk**: Low | **Priority**: HIGH

#### What We'll Do:
1. Update TypeScript types to include 'organizer' role
2. Update auth store to handle roles
3. Create role-based route guards
4. Add role utilities (hasRole, canManageEvent)

#### Files to Modify/Create:
```
📁 frontend/src/
  ├── types/
  │   └── index.ts              - MODIFY: Add 'organizer' role
  ├── stores/
  │   └── authStore.ts          - MODIFY: Add role helpers
  ├── components/
  │   ├── OrganizerRoute.tsx    - NEW: Route guard
  │   └── AdminRoute.tsx        - MODIFY: Use new types
  └── utils/
      └── permissions.ts        - NEW: Role utilities
```

#### Changes Preview:

**types/index.ts**:
```typescript
export interface User {
  _id: string;
  name: string;
  email: string;
  interests: string[];
  role: 'student' | 'organizer' | 'admin'; // ← ADD 'organizer'
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  locationId: Location | string;
  dateTime: string;
  capacity: number;
  attendees: EventAttendee[];
  tags: string[];
  organizer: string;
  createdBy: string; // ← NEW: Creator user ID
  createdAt: string;
  updatedAt: string;
}
```

**utils/permissions.ts** (NEW):
```typescript
import { User } from '../types';

export const ROLES = {
  STUDENT: 'student' as const,
  ORGANIZER: 'organizer' as const,
  ADMIN: 'admin' as const
};

export const hasRole = (user: User | null, ...roles: string[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, ROLES.ADMIN);
};

export const isOrganizer = (user: User | null): boolean => {
  return hasRole(user, ROLES.ORGANIZER, ROLES.ADMIN);
};

export const canCreateEvent = (user: User | null): boolean => {
  return isOrganizer(user);
};

export const canEditEvent = (user: User | null, event: Event): boolean => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return event.createdBy === user._id;
};
```

**components/OrganizerRoute.tsx** (NEW):
```tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isOrganizer } from '../utils/permissions';

export const OrganizerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isOrganizer(user)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};
```

#### Why This Order?
- Types must be updated before components
- Store changes affect all authenticated features
- Route guards prevent unauthorized access

#### Success Criteria:
✅ TypeScript types include 'organizer'  
✅ Auth store exposes role helpers  
✅ Route guards work correctly  
✅ No TypeScript compilation errors

---

### **STEP 5: Frontend UI - Dashboards & Role-Based Features**
**Time**: 3-4 hours | **Risk**: Low | **Priority**: MEDIUM

#### What We'll Do:
1. Create Organizer Dashboard page
2. Create Admin Dashboard page
3. Add role-based UI elements (buttons, menus)
4. Update routing to include new pages
5. Add conditional rendering based on roles

#### Files to Create/Modify:
```
📁 frontend/src/
  ├── pages/
  │   ├── OrganizerDashboard.tsx  - NEW: Manage own events
  │   └── AdminDashboard.tsx      - NEW: Manage everything
  ├── components/
  │   ├── EventCard.tsx           - MODIFY: Show edit/delete if owner
  │   └── Header.tsx              - MODIFY: Show dashboard links
  └── App.tsx                     - MODIFY: Add new routes
```

#### Changes Preview:

**pages/OrganizerDashboard.tsx** (NEW):
```tsx
export const OrganizerDashboard = () => {
  const { user } = useAuthStore();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  
  useEffect(() => {
    // Fetch events where createdBy === user._id
    fetchMyEvents();
  }, []);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📋 Organizer Dashboard</h1>
      
      <div className="grid gap-6">
        {/* Create Event Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">➕ Create New Event</h2>
          <button className="btn-primary">Create Event</button>
        </section>
        
        {/* My Events Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📅 My Events ({myEvents.length})</h2>
          <div className="space-y-4">
            {myEvents.map(event => (
              <EventCard 
                key={event._id} 
                event={event}
                showActions={true} // Edit/Delete buttons
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
```

**pages/AdminDashboard.tsx** (NEW):
```tsx
export const AdminDashboard = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">👑 Admin Dashboard</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <StatCard title="Total Users" value={userCount} icon="👥" />
        <StatCard title="Total Events" value={eventCount} icon="📅" />
        <StatCard title="Total Locations" value={locationCount} icon="📍" />
        
        {/* Management Sections */}
        <section className="col-span-3 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">👥 User Management</h2>
          <UserTable users={users} onEdit={handleEdit} onDelete={handleDelete} />
        </section>
        
        <section className="col-span-3 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📅 Event Management</h2>
          <EventTable events={events} onEdit={handleEdit} onDelete={handleDelete} />
        </section>
        
        <section className="col-span-3 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📍 Location Management</h2>
          <LocationTable locations={locations} onEdit={handleEdit} onDelete={handleDelete} />
        </section>
      </div>
    </div>
  );
};
```

**App.tsx routing**:
```tsx
<Routes>
  {/* Public routes */}
  <Route path="/" element={<MapPage />} />
  <Route path="/login" element={<LoginPage />} />
  
  {/* Student routes (authenticated) */}
  <Route path="/events" element={
    <PrivateRoute><EventsPage /></PrivateRoute>
  } />
  
  {/* Organizer routes */}
  <Route path="/organizer/dashboard" element={
    <OrganizerRoute><OrganizerDashboard /></OrganizerRoute>
  } />
  
  {/* Admin routes */}
  <Route path="/admin/dashboard" element={
    <AdminRoute><AdminDashboard /></AdminRoute>
  } />
</Routes>
```

**Header.tsx** (conditional links):
```tsx
export const Header = () => {
  const { user, isAuthenticated } = useAuthStore();
  
  return (
    <header>
      {/* ... existing header ... */}
      
      {isAuthenticated && (
        <nav>
          {/* All users */}
          <Link to="/">🗺️ Map</Link>
          
          {/* Organizers and admins */}
          {isOrganizer(user) && (
            <Link to="/organizer/dashboard">📋 My Events</Link>
          )}
          
          {/* Admins only */}
          {isAdmin(user) && (
            <Link to="/admin/dashboard">👑 Admin</Link>
          )}
        </nav>
      )}
    </header>
  );
};
```

#### Why This Order?
- Backend is fully functional before UI changes
- UI changes are safest (no data corruption risk)
- Can deploy backend-only and add UI gradually

#### Success Criteria:
✅ Organizer can see their dashboard  
✅ Organizer can create events  
✅ Organizer sees edit/delete on own events only  
✅ Admin sees all management options  
✅ Students don't see organizer/admin features

---

## 🧪 Testing Checklist (After All Steps)

### Role-Based Tests:

**Student Role:**
- [ ] Can view all events
- [ ] Can register for events
- [ ] Cannot create events
- [ ] Cannot edit any events
- [ ] Cannot delete any events
- [ ] Cannot access organizer dashboard
- [ ] Cannot access admin dashboard

**Organizer Role:**
- [ ] Can view all events
- [ ] Can register for events
- [ ] Can create new events
- [ ] Can edit own events only
- [ ] Can delete own events only
- [ ] Cannot edit others' events
- [ ] Can access organizer dashboard
- [ ] Cannot access admin dashboard

**Admin Role:**
- [ ] Can view all events
- [ ] Can create events
- [ ] Can edit any event
- [ ] Can delete any event
- [ ] Can manage users
- [ ] Can manage locations
- [ ] Can access admin dashboard
- [ ] Has full system access

### Security Tests:
- [ ] JWT tokens include role
- [ ] Cannot fake role in API requests
- [ ] Organizer cannot delete admin's event
- [ ] Student gets 403 when trying to create event
- [ ] Direct URL navigation to admin page blocked for non-admins

---

## 📦 Post-Implementation Tasks

### Required:
1. **Update Seed Data** - Add organizer users, assign createdBy to events
2. **Update Documentation** - Document RBAC in API.md and README
3. **Test Thoroughly** - Run all test cases above
4. **Deploy** - Backend first, then frontend

### Optional (Future Enhancements):
- Custom permissions per organizer
- Event approval workflow
- Role assignment UI in admin panel
- Audit logs (who did what when)
- Email notifications for role changes

---

## 🎯 Success Metrics

### Functional:
✅ All 3 roles work as designed  
✅ No unauthorized access possible  
✅ Existing features still work

### Technical:
✅ No breaking changes to public API  
✅ Type-safe throughout  
✅ Well-documented code

### User Experience:
✅ Clear role-based UI  
✅ Intuitive dashboards  
✅ Helpful error messages

---

## 🚀 Ready to Begin?

**Start with STEP 1**: Backend Models & Database Schema

When you're ready, say:
- "Start Step 1" - I'll implement User and Event model changes
- "Review Step X" - I'll explain a specific step in more detail
- "Show me alternatives" - I'll present different approaches

**Remember**: Each step is fully tested before moving to the next!

---

## 📝 Notes & Decisions

### Why Not Use a Package?
- **spatie/laravel-permission**: PHP/Laravel only, won't work with Node.js
- **node-acl**: Outdated, overcomplicated for our needs
- **casbin**: Too heavy, learning curve too steep
- **accesscontrol**: Good, but we already have 80% of functionality

### Why This Design?
- **Minimal dependencies**: Use what we already have
- **Type-safe**: Full TypeScript support
- **Testable**: Clear boundaries for testing
- **Maintainable**: Simple to understand and extend
- **Scalable**: Easy to add new roles/permissions later

### Migration Strategy:
- **Existing users**: Remain as 'student' by default
- **Existing events**: Need createdBy assigned (one-time script)
- **No data loss**: All existing data preserved
- **Backward compatible**: Old API calls still work

---

**Confidence Level**: 🟢 **95%+**  
**Risk Level**: 🟡 **Low-Medium** (Mostly safe, some API changes)  
**Implementation Time**: ⏱️ **10-12 hours total**

---

_Last Updated: October 14, 2025_  
_Ready for Implementation: ✅ YES_

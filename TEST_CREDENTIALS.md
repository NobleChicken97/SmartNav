# 🔐 Smart Navigator - Test Credentials

**Frontend URL**: http://localhost:5173/  
**Backend API**: http://localhost:5000/api  
**Date**: October 16, 2025

---

## 👥 All Test Users

### 1. 👨‍💼 ADMIN (Full Access)
```
Email:    admin@thapar.edu
Password: Admin123
Role:     admin
```
**Permissions**: 
- ✅ Full access to everything
- ✅ Can create/edit/delete ANY event (even others' events)
- ✅ Access to admin dashboard
- ✅ Can manage all users and locations

---

### 2. 🎯 ORGANIZER #1 (Tech Club)
```
Email:    tech.club@student.thapar.edu
Password: Organizer123
Role:     organizer
```
**Permissions**:
- ✅ Can create new events
- ✅ Can edit/delete OWN events only
- ✅ Access to organizer dashboard
- ❌ Cannot edit other organizers' events

---

### 3. 🎨 ORGANIZER #2 (Cultural Society)
```
Email:    cultural.society@student.thapar.edu
Password: Organizer123
Role:     organizer
```
**Permissions**:
- ✅ Can create new events
- ✅ Can edit/delete OWN events only
- ✅ Access to organizer dashboard
- ❌ Cannot edit other organizers' events

---

### 4. 🏃 ORGANIZER #3 (Sports Committee)
```
Email:    sports.committee@student.thapar.edu
Password: Organizer123
Role:     organizer
```
**Permissions**:
- ✅ Can create new events
- ✅ Can edit/delete OWN events only
- ✅ Access to organizer dashboard
- ❌ Cannot edit other organizers' events

---

### 5. 👤 REGULAR USER #1 (Rahul Sharma)
```
Email:    rahul.sharma@student.thapar.edu
Password: Student123
Role:     user
```
**Permissions**:
- ✅ Can view events and locations
- ✅ Can register for events
- ✅ Can use navigation
- ❌ CANNOT create/edit events
- ❌ CANNOT access /events/create
- ❌ CANNOT access /events/:id/edit

---

### 6. 👤 REGULAR USER #2 (Priya Patel)
```
Email:    priya.patel@student.thapar.edu
Password: Student123
Role:     user
```
**Permissions**: Same as User #1

---

### 7. 👤 REGULAR USER #3 (Arjun Singh)
```
Email:    arjun.singh@student.thapar.edu
Password: Student123
Role:     user
```
**Permissions**: Same as User #1

---

### 8. 👤 REGULAR USER #4 (Sneha Gupta)
```
Email:    sneha.gupta@student.thapar.edu
Password: Student123
Role:     user
```
**Permissions**: Same as User #1

---

## 🧪 Quick Test Scenarios

### Scenario 1: Event Creation ✅
**Login as**: tech.club@student.thapar.edu / Organizer123
1. Should see "Organizer Dashboard"
2. Click "Create Event" button
3. Fill form and submit
4. Event appears on dashboard

---

### Scenario 2: Route Protection 🚫
**Login as**: rahul.sharma@student.thapar.edu / Student123
1. Should see regular "Dashboard"
2. Manually go to: http://localhost:5173/events/create
3. **Should be BLOCKED** → redirect to /dashboard

---

### Scenario 3: Ownership Check 🔒
**Step 1**: Login as tech.club@student.thapar.edu
- Create an event
- Note the event ID from URL (e.g., /events/67123abc/edit)

**Step 2**: Logout and login as cultural.society@student.thapar.edu
- Try to access: http://localhost:5173/events/{that-event-id}/edit
- **Should see error**: "You do not have permission to edit this event"

---

### Scenario 4: Admin Override 👑
**Login as**: admin@thapar.edu / Admin123
1. Go to any event edit page
2. **Should work** even if you didn't create it
3. Admin can edit ANY event

---

## 📊 Database Contents

After seeding, you have:
- **8 Users** (1 admin, 3 organizers, 4 regular users)
- **21 Locations** (Thapar campus buildings)
- **6 Sample Events** (various categories)

---

## 🎯 Testing Checklist

- [ ] Login as admin → Access admin dashboard
- [ ] Login as organizer → Create event successfully
- [ ] Login as organizer → Edit own event
- [ ] Login as organizer → Try to edit another organizer's event (should fail)
- [ ] Login as user → Try to access /events/create (should block)
- [ ] Login as admin → Edit any event (should work)
- [ ] Test event status badges (draft/published/cancelled)
- [ ] Test form validation (empty fields should show errors)
- [ ] Test location dropdown loads correctly
- [ ] Test date validation (past dates should fail)

---

## 🚀 Quick Access Links

After logging in as organizer:
- **Dashboard**: http://localhost:5173/organizer/dashboard
- **Create Event**: http://localhost:5173/events/create
- **Edit Event**: http://localhost:5173/events/{eventId}/edit

After logging in as admin:
- **Admin Dashboard**: http://localhost:5173/admin/dashboard

After logging in as user:
- **Dashboard**: http://localhost:5173/dashboard

---

**Happy Testing! 🎉**

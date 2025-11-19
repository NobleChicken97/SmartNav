# Backend Scripts

This directory contains utility scripts for the Smart Navigator backend.

## 🔐 Security Model

**PUBLIC REGISTRATION**: Only creates `student` role accounts  
**PRIVILEGED ACCOUNTS**: Must be created via backend scripts

- ✅ Students: Self-register at `/register` endpoint
- ⚠️ Organizers: Created by `createOrganizers.js` only
- 🔒 Admins: Created by `createOrganizers.js` only

---

## Available Scripts

### `deleteAllUsers.js` ⚠️ DESTRUCTIVE

**WARNING:** Permanently deletes all users from Firebase Auth and Firestore.

```bash
node scripts/deleteAllUsers.js
```

Use when: Starting fresh, clearing test data

### `verifyUserCreation.js` ✅ SAFE

Verifies user creation sets custom claims correctly. Creates test user, checks claims, then deletes.

```bash
node scripts/verifyUserCreation.js
```

Use when: Testing user creation flow, debugging role issues

### `checkUserRoles.js` ✅ READ-ONLY

Checks custom claims and Firestore roles for specific users.

```bash
node scripts/checkUserRoles.js
```

Use when: Debugging role/claims mismatches

### `createOrganizers.js`

Creates sample organizer users in Firebase for testing event management.

```bash
node scripts/createOrganizers.js
```

### `seedThaparLocations.js`

Seeds Firestore with Thapar University campus locations (buildings, facilities, etc.).

```bash
node scripts/seedThaparLocations.js
```

## Requirements

- Firebase Admin SDK initialized
- Environment variables configured (.env file)
- Node.js 18+

## Usage

Run any script from the backend directory:

```bash
cd backend
node scripts/scriptName.js
```

2. **Configure Firebase** - Complete Firebase project setup (see `../FIREBASE_MIGRATION_GUIDE.md`)
3. **Set Environment Variables** - Add Firebase credentials to `../.env`

## Available Scripts

### 1. Full Migration (Recommended)

```bash
node runFullMigration.js
```

Runs complete migration in order: Users → Locations → Events

**Output:**

- `migration-users-{timestamp}.json`
- `migration-locations-{timestamp}.json`
- `migration-events-{timestamp}.json`
- `migration-complete-{timestamp}.json`

### 2. Individual Migrations

Run these in order if you prefer step-by-step migration:

```bash
# Step 1: Migrate users first (required for events)
node migrateUsersToFirebase.js

# Step 2: Migrate locations
node migrateLocationsToFirestore.js

# Step 3: Migrate events (requires users to be migrated)
node migrateEventsToFirestore.js
```

## Migration Order Importance

⚠️ **MUST migrate in this order:**

1. **Users first** - Events reference users via `createdBy` and `attendees`
2. **Locations second** - Events reference locations via `locationId`
3. **Events last** - Depends on both users and locations being migrated

## What Gets Migrated

### Users

- ✅ Email, name, role, interests
- ✅ Creates Firebase Auth account
- ✅ Sets custom claims for roles
- ✅ Stores `legacyMongoId` for reference
- ⚠️ Generates temporary passwords (users must reset)

### Locations

- ✅ All location data (name, coordinates, type, tags, etc.)
- ✅ Preserves MongoDB `_id` as Firestore document ID
- ✅ Stores `legacyMongoId` for reference

### Events

- ✅ All event data (title, description, dates, capacity, etc.)
- ✅ Maps creator and attendees to Firebase UIDs
- ✅ Preserves MongoDB `_id` as Firestore document ID
- ⚠️ Skips events where creator wasn't migrated

## After Migration

1. **Review Result Files** - Check JSON files for failures
2. **Verify in Firebase Console** - Check data in Firestore Database
3. **Send Password Resets** - All migrated users need to reset passwords
4. **Create Firestore Indexes** - For optimal query performance

See `../FIREBASE_MIGRATION_GUIDE.md` for complete post-migration steps.

## Troubleshooting

### "Missing required Firebase environment variables"

Add to `../.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### "Event creator not found"

Some events won't migrate if their creator's migration failed. Review user migration results first.

### Rate Limiting

Scripts include delays to avoid Firebase rate limits. If issues persist, run migrations separately with longer delays.

## Rollback

If migration fails:

```bash
# Restore MongoDB from backup
mongorestore --uri="your_mongodb_uri" ./backup-directory

# Delete Firebase data (requires Firebase CLI)
firebase firestore:delete --all-collections --project your-project-id
```

## Other Scripts

### Test Scripts (for development)

- `seed.js` - Seed MongoDB with sample data
- `addTestUser.js` - Add test user to MongoDB
- `checkAdmin.js` - Check admin users in MongoDB
- `testConnection.js` - Test MongoDB connection

These scripts remain functional during migration period.

---

**See also:** `../FIREBASE_MIGRATION_GUIDE.md` for complete migration documentation

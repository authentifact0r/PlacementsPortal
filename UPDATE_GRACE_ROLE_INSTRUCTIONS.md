# Update Grace's Role to Student

## Quick Instructions

### Option 1: Firebase Console (Recommended - 2 minutes)

1. **Go to Firebase Console**:
   - https://console.firebase.google.com/project/placementsportal-81608/firestore/data

2. **Navigate to Users Collection**:
   - Click on `users` collection
   - Find Grace's document (UID: `G5T1mO7vXdd44ITrn6SAqBy2bPV2`)

3. **Update Role Field**:
   - Click on Grace's document
   - Find the `role` field
   - Change value from `admin` to `student`
   - Click "Update"

4. **Done!**
   - Grace can now login at http://localhost:3000/login
   - Email: grace@placementsportal.com
   - Password: Winner2024
   - Will auto-redirect to http://localhost:3000/dashboard/student

---

### Option 2: Via Script (If you have service account key)

If you have `serviceAccountKey.json`:

```bash
cd placements-portal-full/web
node update-grace-role.js
```

**To get service account key**:
1. Go to Firebase Console > Project Settings
2. Service Accounts tab
3. Click "Generate New Private Key"
4. Save as `serviceAccountKey.json` in `placements-portal-full/web/`

---

## Expected Result

**Before**:
```json
{
  "uid": "G5T1mO7vXdd44ITrn6SAqBy2bPV2",
  "email": "grace@placementsportal.com",
  "displayName": "Grace",
  "role": "admin",  ← OLD
  ...
}
```

**After**:
```json
{
  "uid": "G5T1mO7vXdd44ITrn6SAqBy2bPV2",
  "email": "grace@placementsportal.com",
  "displayName": "Grace",
  "role": "student",  ← NEW
  ...
}
```

---

## Verification Steps

1. **Login as Grace**:
   - Go to http://localhost:3000/login
   - Email: grace@placementsportal.com
   - Password: Winner2024

2. **Check Auto-Redirect**:
   - Should automatically go to `/dashboard/student`
   - Should see "Welcome back, Grace!"
   - Should see student dashboard with:
     - 0 Applications
     - 0 Saved Jobs
     - 5 Upcoming Events
     - 0 CV Tokens
     - Overview/Video Pitch/CV Optimizer tabs

3. **Verify Access**:
   - ✅ Can access: Student Profile, Video Pitch Studio, CV Optimizer
   - ❌ Cannot access: Admin Dashboard, Employer Dashboard

---

## User Details

### Grace (Student)
- **Email**: grace@placementsportal.com
- **Password**: Winner2024
- **UID**: G5T1mO7vXdd44ITrn6SAqBy2bPV2
- **Role**: student (updated from admin)
- **Dashboard**: http://localhost:3000/dashboard/student

### Toluwani (Admin)
- **Email**: toluwani@placementsportal.com
- **Password**: Winner2021
- **UID**: 2yhzWCsCz6cGMvXeqNyuR61sw442
- **Role**: admin (unchanged)
- **Dashboard**: http://localhost:3000/dashboard/admin

---

## Troubleshooting

### Grace still redirects to admin dashboard
- **Clear browser cache and cookies**
- **Logout and login again**
- **Check Firestore - role field should be "student"**

### Can't find Grace's document in Firestore
- **Search by email**: grace@placementsportal.com
- **Or by UID**: G5T1mO7vXdd44ITrn6SAqBy2bPV2

### Role field doesn't exist
- **Add the field manually**:
  - Click "Add field"
  - Field name: `role`
  - Type: string
  - Value: `student`

---

**Estimated Time**: 2 minutes via Firebase Console ⏱️

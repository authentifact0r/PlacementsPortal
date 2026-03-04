# Create Admin Users - Instructions

## Users to Create

1. **Toluwani** (Admin)
   - Email: toluwani@placementsportal.com
   - Password: Winner2021
   - Role: admin

2. **Grace** (Admin)
   - Email: grace@placementsportal.com
   - Password: Winner2024
   - Role: admin

## Setup Steps

### Step 1: Get Firebase Service Account Key

1. Go to Firebase Console:
   https://console.firebase.google.com/project/placementsportal-81608/settings/serviceaccounts/adminsdk

2. Click "Generate new private key"

3. Download the JSON file

4. Rename it to `serviceAccountKey.json`

5. Move it to: `placements-portal-full/web/serviceAccountKey.json`

**IMPORTANT:** This file contains secrets! Never commit it to git.

### Step 2: Install Dependencies

```bash
cd placements-portal-full/web
npm install firebase-admin --save-dev
```

### Step 3: Run the Script

```bash
cd placements-portal-full/web
node create-users.js
```

### Expected Output

```
🚀 PlacementsPortal - User Creation Script

==================================================

🔵 Creating user: Toluwani (toluwani@placementsportal.com)...
✅ Auth user created with UID: abc123...
✅ Firestore profile created
📧 Email: toluwani@placementsportal.com
🔑 Password: Winner2021
👤 Role: admin

🔵 Creating user: Grace (grace@placementsportal.com)...
✅ Auth user created with UID: def456...
✅ Firestore profile created
📧 Email: grace@placementsportal.com
🔑 Password: Winner2024
👤 Role: admin

==================================================
✅ All users created successfully!

📋 Login Credentials:

1. Toluwani (Admin)
   Email: toluwani@placementsportal.com
   Password: Winner2021
   Dashboard: http://localhost:3000/dashboard/admin

2. Grace (Admin)
   Email: grace@placementsportal.com
   Password: Winner2024
   Dashboard: http://localhost:3000/dashboard/admin

🎉 You can now login at: http://localhost:3000/login
```

## Step 4: Login and Test

1. Go to: http://localhost:3000/login

2. Login with Toluwani's credentials:
   - Email: `toluwani@placementsportal.com`
   - Password: `Winner2021`

3. After login, navigate to: http://localhost:3000/dashboard/admin

4. You should see the admin dashboard ✅

## Troubleshooting

### Error: "ENOENT: no such file or directory, open 'serviceAccountKey.json'"

**Solution:** You need to download the service account key from Firebase Console (see Step 1)

### Error: "auth/email-already-exists"

**Solution:** The script will automatically update the password if the user already exists. This is normal.

### Error: "Permission denied"

**Solution:** Make sure your service account key has the correct permissions. Try generating a new key.

## Security Notes

### ⚠️ Important

- `serviceAccountKey.json` contains admin credentials
- Never commit this file to version control
- Never share this file publicly
- Add to `.gitignore`:

```bash
echo "serviceAccountKey.json" >> .gitignore
```

### Production Deployment

For production, use Firebase Functions or environment variables instead of a local service account key.

## Alternative: Manual Creation via Firebase Console

If you prefer not to use the script:

1. Go to: https://console.firebase.google.com/project/placementsportal-81608/authentication/users

2. Click "Add user"

3. Enter:
   - Email: toluwani@placementsportal.com
   - Password: Winner2021

4. Click "Add user"

5. Go to Firestore: https://console.firebase.google.com/project/placementsportal-81608/firestore

6. Find the user's document in the `users` collection

7. Add/update field: `role = "admin"`

8. Repeat for Grace

## Next Steps

After creating the admin users:

1. ✅ Login with admin credentials
2. ✅ Access admin dashboard
3. ✅ Test admin features:
   - User management
   - Job moderation
   - Analytics
   - System settings

## Files

- `create-users.js` - User creation script
- `serviceAccountKey.json` - Firebase admin credentials (you need to download this)
- `CREATE_USERS_INSTRUCTIONS.md` - This file

## Status

**Ready to run!** Just need the service account key from Firebase Console.

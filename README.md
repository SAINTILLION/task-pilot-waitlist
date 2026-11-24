# TaskPilot Waitlist Website

A responsive, animated single-page waitlist site with Firebase Firestore signup integration.

## Files
- `index.html`: page markup
- `styles.css`: responsive styling and animations
- `app.js`: Firestore signup logic
- `firebase-config.js`: Firebase Web app configuration placeholders
- `firestore.rules`: restrictive rules for the waitlist collection

## Setup
1. Create or open your Firebase project at https://console.firebase.google.com/.
2. Add a **Web app** to the project (project overview > Add app > Web).
3. Copy the Firebase configuration snippet/config object.
4. Replace the placeholder values in `firebase-config.js` with your actual values.
5. In Firebase Console, open **Firestore Database** and create a database.
6. Open Firestore **Rules**, paste the contents of `firestore.rules`, and publish the rules.
7. Run the site from a local web server (ES modules won't work reliably from `file://`). For example, in this folder run `python -m http.server 8000`, then visit http://localhost:8000.
8. Deploy the folder to Firebase Hosting, Netlify, Cloudflare Pages, or another static host.

## Deploy to Firebase Hosting (optional)
Install Firebase CLI, log in, then from this folder:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your existing Firebase project; set public directory to this folder (or use a clean deploy folder).
# If asked about single-page app rewrites, answer No.
firebase deploy --only hosting
```

## Notes
- This is a public signup form. The client config is not a secret.
- Rules prohibit client reads and updates/deletes, and validate fields on signup.
- For stronger abuse protection, configure Firebase App Check with reCAPTCHA for your web app and enforce it for Firestore after testing.
- Avoid collecting unnecessary personal data. The form collects email only.

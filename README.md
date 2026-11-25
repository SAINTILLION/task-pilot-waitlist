# TaskPilot Waitlist — Duplicate Registration Update

This update adds an individual Firestore document lookup before creating a waitlist registration.

## Files

- `app.js`: replace the existing website `app.js` with this file.
- `firestore.rules`: publish these rules in Firebase Console → Firestore Database → Rules.

Keep your existing `index.html`, `styles.css`, and `firebase-config.js` unchanged.

## Firestore document structure

Collection: `waitlist`

Document ID: normalized email address (lowercase and trimmed)

Fields:

- `email` (string)
- `country` (string; best-effort browser locale)
- `countryCode` (string; best-effort browser locale)
- `timezone` (string; browser-configured IANA timezone)
- `source` (string: `taskpilot-website`)
- `createdAt` (Firestore server timestamp)

## Setup

1. Back up your current `app.js` and Firestore rules.
2. Replace the website's `app.js` with the supplied file.
3. Open Firebase Console → Firestore Database → Rules.
4. Replace the rules with the supplied `firestore.rules` and click Publish.
5. Refresh the website and test with a new email address.
6. Test the same email again. It should display the already-registered message.

## Important privacy and security note

These rules allow `get` on an individual waitlist document but deny `list`. Because document IDs are email addresses, a visitor who knows or guesses an email can check whether it is registered. The full collection cannot be listed through these rules, but individual membership can be tested. For a production waitlist, consider moving duplicate checks and registration writes behind a trusted backend (for example, a Firebase Cloud Function) and adding App Check/rate limiting.

The rules permit creation only and prohibit public updates and deletes. The `createdAt` field must be written using Firebase `serverTimestamp()`.

## Local testing

Live Server is supported. Open the site using its local HTTP address, submit a new email, and inspect Firestore → Data → `waitlist`. Browser locale country detection is approximate; timezone is read from the browser configuration.

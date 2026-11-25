import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Update the footer year, if the element exists.
const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

/**
 * Best-effort country detection from the browser's language/locale.
 * This is NOT GPS or IP geolocation and may not match the visitor's
 * physical location (for example, a visitor in Nigeria may use en-US).
 */
function getVisitorCountry() {
  try {
    const language = navigator.language || 'en';
    const locale = new Intl.Locale(language);
    const countryCode = locale.region || '';
    const displayNames = new Intl.DisplayNames([language], { type: 'region' });

    return {
      countryCode,
      country: countryCode ? (displayNames.of(countryCode) || 'Unknown') : 'Unknown'
    };
  } catch (error) {
    console.warn('Country detection failed:', error);
    return { countryCode: '', country: 'Unknown' };
  }
}

/** Detect the browser's configured IANA timezone. */
function getVisitorTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  } catch (error) {
    console.warn('Timezone detection failed:', error);
    return 'Unknown';
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const forms = [
  {
    form: document.getElementById('waitlist-form'),
    email: document.getElementById('email'),
    button: document.getElementById('submit-btn'),
    note: document.getElementById('form-note')
  },
  {
    form: document.getElementById('waitlist-form-bottom'),
    email: document.getElementById('email-bottom'),
    button: document.getElementById('submit-btn-bottom'),
    note: document.getElementById('form-note-bottom')
  }
];

function setMessage(note, message, isError = false) {
  note.textContent = message;
  note.classList.toggle('error', isError);
}

function restoreButton(button) {
  button.disabled = false;
  button.innerHTML = 'Join the waitlist <span>→</span>';
}

async function submitEmail(email, button, note, form) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || normalizedEmail.length > 254 || !isValidEmail(normalizedEmail)) {
    setMessage(note, 'Please enter a valid email address.', true);
    return;
  }

  button.disabled = true;
  button.textContent = 'Checking...';
  setMessage(note, '');

  // The email address is also the Firestore document ID.
  const registrationRef = doc(db, 'waitlist', normalizedEmail);

  try {
    // 1. Check whether this exact email already has a registration.
    const existingRegistration = await getDoc(registrationRef);

    if (existingRegistration.exists()) {
      setMessage(note, 'This email is already on the waitlist. Thanks for your interest!');
      restoreButton(button);
      return;
    }

    // 2. Collect visitor metadata automatically.
    const visitor = getVisitorCountry();
    const timezone = getVisitorTimezone();

    // 3. Create a new registration. Do not use merge:true:
    // the Firestore rules intentionally prohibit overwriting existing records.
    const submission = {
      email: normalizedEmail,
      country: visitor.country,
      countryCode: visitor.countryCode,
      timezone,
      source: 'taskpilot-website',
      createdAt: serverTimestamp()
    };

    button.textContent = 'Joining...';
    await setDoc(registrationRef, submission);

    setMessage(note, 'You’re on the list! Watch your inbox for TaskPilot updates.');
    form.reset();
    button.textContent = 'You’re on the list ✓';
    // Keep the button disabled after a successful registration.

  } catch (error) {
    console.error('Waitlist signup failed:', error);

    // A second visitor/tab could create the same email after our initial
    // getDoc() check. If the create is rejected, check once more so we can
    // distinguish that duplicate race from other permission errors.
    if (error?.code === 'permission-denied') {
      try {
        const latestCheck = await getDoc(registrationRef);
        if (latestCheck.exists()) {
          setMessage(note, 'This email is already on the waitlist. Thanks for your interest!');
          restoreButton(button);
          return;
        }
      } catch (checkError) {
        console.error('Could not verify existing registration:', checkError);
      }

      setMessage(note, 'Signup is temporarily unavailable. Please try again shortly.', true);
    } else if (error?.code === 'unavailable') {
      setMessage(note, 'Connection problem. Please check your internet and try again.', true);
    } else if (error?.code === 'invalid-argument') {
      setMessage(note, 'Invalid submission. Please check your email and try again.', true);
    } else {
      setMessage(note, 'Something went wrong. Please try again in a moment.', true);
    }

    restoreButton(button);
  }
}

// Attach listeners to both signup forms. Missing optional forms are ignored.
forms.forEach(({ form, email, button, note }) => {
  if (!form || !email || !button || !note) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitEmail(email.value, button, note, form);
  });
});

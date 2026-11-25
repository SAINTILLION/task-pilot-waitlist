import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
document.getElementById('year').textContent = new Date().getFullYear();

// Best-effort country detection from browser locale (may differ from actual location).
function getVisitorCountry() {
  try {
    const locale = new Intl.Locale(navigator.language || 'en');
    const code = locale.region || '';
    const names = new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' });
    return { countryCode: code, country: code ? names.of(code) : 'Unknown' };
  } catch { return { countryCode: '', country: 'Unknown' }; }
}

function getVisitorTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'; }
  catch { return 'Unknown'; }
}

const forms = [
  { form: document.getElementById('waitlist-form'), email: document.getElementById('email'), button: document.getElementById('submit-btn'), note: document.getElementById('form-note') },
  { form: document.getElementById('waitlist-form-bottom'), email: document.getElementById('email-bottom'), button: document.getElementById('submit-btn-bottom'), note: document.getElementById('form-note-bottom') }
];

async function submitEmail(email, button, note, form) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    note.textContent = 'Please enter a valid email address.';
    note.classList.add('error'); return;
  }
  button.disabled = true; button.textContent = 'Joining…'; note.textContent = '';
  try {
    // Email-based document IDs prevent duplicate registrations; the collection is not readable by clients.
    await setDoc(doc(db, 'waitlist', normalized), {
      email: normalized,
      source: 'taskpilot-website',
      ...getVisitorCountry(),
      timezone: getVisitorTimezone(),
      createdAt: serverTimestamp()
    }, { merge: false });
    note.textContent = 'You’re on the list! Watch your inbox for TaskPilot updates.';
    note.classList.remove('error'); form.reset(); button.textContent = 'You’re on the list ✓';
  } catch (err) {
    console.error('Waitlist signup failed:', err);
    if (err.code === 'permission-denied') note.textContent = 'Signup is temporarily unavailable. Please try again shortly.';
    else if (err.code === 'already-exists') note.textContent = 'This email is already on the waitlist. Thanks for your interest!';
    else note.textContent = 'Something went wrong. Please try again in a moment.';
    note.classList.add('error'); button.disabled = false; button.innerHTML = 'Join the waitlist <span>→</span>';
  }
}

forms.forEach(({ form, email, button, note }) => form.addEventListener('submit', event => {
  event.preventDefault();
  submitEmail(email.value, button, note, form);
}))

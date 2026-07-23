# Youssef Boukhmiss — atelier store (Firebase edition)

This is the same shop (index/about/faq + shop + cart + studio admin), rebuilt so the
catalog, orders, and admin login are backed by **Firebase** instead of the browser's
localStorage — so edits made in the dashboard show up for every visitor, on every device.

## What changed vs. the old version

- `admin.html` → **`login.html` + `dashboard.html`**, protected by real sign-in
  (Firebase Authentication) instead of a shared PIN typed into the page.
- `data.js` (localStorage) → **`js/products.js`** (Firestore) + **`js/firebase.js`**.
- Product photos uploaded in the dashboard are resized/compressed in the browser and
  stored directly inside the product's Firestore document (as a data URL) — no Firebase
  Storage needed, so this stays on the free **Spark** plan and never requires a billing
  upgrade.
- Checkout now writes a real order document to Firestore (`orders` collection) —
  still no payment is taken; connect Stripe or similar for that.
- `styles.css` → `css/styles.css` (unchanged design), plus new `css/login.css` and
  `css/dashboard.css` for the two new pages.

## One-time setup (you only need to do this once)

Your Firebase config for project **youssef-s-store** is already wired into `js/firebase.js` — you don't need to touch that file.

1. In the [Firebase console](https://console.firebase.google.com/project/youssef-s-store), enable:
   - **Authentication** → Sign-in method → **Email/Password**
   - **Firestore Database** (create it if you haven't — start in production mode, the included `firestore.rules` handle access)
   - That's it — **Storage is not used**, so there's nothing to enable there and no billing upgrade is required.
2. **Create your one admin account**: since `login.html` no longer has a sign-up option (only you should have access), create the account directly in the console instead: Authentication → Users → **Add user** → enter your email + a password.
3. **Make that account an admin**: copy the UID shown next to the user you just created, then in Firestore Database → Start collection → collection ID `admins` → document ID = *that UID* (any single field inside, e.g. `role: "owner"`) → Save.
4. Deploy the security rules (needs the Firebase CLI: `npm install -g firebase-tools`):
   ```
   firebase login
   firebase deploy --only firestore:rules
   ```
   Or just paste the contents of `firestore.rules` into the Rules tab of Firestore in the console.
5. Open `login.html` (via a local server, or after `firebase deploy --only hosting`), sign in with the email/password from step 2, and you're in `dashboard.html`.

## First run

The first time `getProducts()` is called and Firestore's `products` collection is empty,
it automatically seeds the same 15 default products the old site shipped with — so the
shop isn't empty on day one.

## A note on product photos

To avoid needing Firebase Storage (which requires upgrading to the paid Blaze plan even
to use its free quota), photos are compressed to ~700px wide JPEGs and stored as base64
text directly inside each product's Firestore document. That's fine for a shop with a
modest number of products — Firestore's free tier is generous (1GB stored, 50k reads/day)
and a document can hold up to 1MB. If the catalog grows very large or photos need to be
sharper/larger, moving to Firebase Storage (or a free image host like Cloudinary) later
is a small, contained change — only `fileToCompressedDataUrl` in `js/products.js` would
need to change.

## Payment & order emails

Payment is **cash on delivery** — no card is charged at checkout. Every order is saved to
Firestore (`orders` collection, visible in the Firebase console under Firestore Database),
and also posted to **Formspree**, which forwards it straight to the studio's inbox — no
Gmail API or billing setup needed. The contact form (Shipping & FAQ page) uses the same
Formspree form, so both order notifications and contact messages land in the same place.

The Formspree endpoint is already wired into `js/checkout.js` and `faq.html`
(`https://formspree.io/f/mojgwgee`). If you ever need to point it at a different
Formspree form, update the `FORMSPREE_ENDPOINT` constant in both files.

Formspree's free plan covers 50 submissions/month — plenty for a studio catalog. If you
outgrow it, Formspree's paid tiers raise that limit; nothing else in the code needs to
change.

## Languages (English / French / Arabic)

The Shop, About, and Shipping & FAQ pages have a language switcher (EN/FR/AR) in the
nav — top right. It covers all site UI text: navigation, hero, footer, the studio
chatbot (including keyword matching, so it understands French/Arabic questions too),
the cart drawer, checkout messages, and every word of the About/FAQ pages.

**Not translated on purpose:**
- Product names, descriptions, categories, and sizes — these come from whatever the
  admin typed into the dashboard, so they stay in whichever language they were entered.
- `login.html` and `dashboard.html` — admin-only pages, left English.

The choice is remembered per-browser (localStorage) and Arabic switches the whole page
to right-to-left layout with a matching Arabic web font. To add or edit any wording,
everything lives in `js/i18n.js` — one object per language, same keys across all three.

## Still manual / not wired up

- **Contact form**: still opens the visitor's email app (`mailto:`) rather than sending
  through a backend — connect a form service like Formspree if you want it to submit
  without leaving the page.

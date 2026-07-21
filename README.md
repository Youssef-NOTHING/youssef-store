# Youssef Boukhmiss — atelier store (Firebase edition)

This is the same shop (index/about/faq + shop + cart + studio admin), rebuilt so the
catalog, orders, and admin login are backed by **Firebase** instead of the browser's
localStorage — so edits made in the dashboard show up for every visitor, on every device.

## What changed vs. the old version

- `admin.html` → **`login.html` + `dashboard.html`**, protected by real sign-in
  (Firebase Authentication) instead of a shared PIN typed into the page.
- `data.js` (localStorage) → **`js/products.js`** (Firestore) + **`js/firebase.js`**.
- Product photos uploaded in the dashboard go to **Firebase Storage**, not just a
  typed-in file path.
- Checkout now writes a real order document to Firestore (`orders` collection) —
  still no payment is taken; connect Stripe or similar for that.
- `styles.css` → `css/styles.css` (unchanged design), plus new `css/login.css` and
  `css/dashboard.css` for the two new pages.

## One-time setup (you only need to do this once)

Your Firebase config for project **youssef-s-store** is already wired into `js/firebase.js` — you don't need to touch that file.

1. In the [Firebase console](https://console.firebase.google.com/project/youssef-s-store), enable:
   - **Authentication** → Sign-in method → **Email/Password**
   - **Firestore Database** (create it if you haven't — start in production mode, the included `firestore.rules` handle access)
   - **Storage** (create it if you haven't)
2. **Create your one admin account**: since `login.html` no longer has a sign-up option (only you should have access), create the account directly in the console instead: Authentication → Users → **Add user** → enter your email + a password.
3. **Make that account an admin**: copy the UID shown next to the user you just created, then in Firestore Database → Start collection → collection ID `admins` → document ID = *that UID* (any single field inside, e.g. `role: "owner"`) → Save.
4. Deploy the security rules (needs the Firebase CLI: `npm install -g firebase-tools`):
   ```
   firebase login
   firebase deploy --only firestore:rules,storage:rules
   ```
   Or just paste the contents of `firestore.rules` / `storage.rules` into the Rules tab of Firestore/Storage in the console.
5. Open `login.html` (via a local server, or after `firebase deploy --only hosting`), sign in with the email/password from step 2, and you're in `dashboard.html`.

## First run

The first time `getProducts()` is called and Firestore's `products` collection is empty,
it automatically seeds the same 15 default products the old site shipped with — so the
shop isn't empty on day one.

## What's new in this update

- **Cash on Delivery**: checkout now collects the customer's name, phone and delivery
  address, records the order in Firestore with `paymentMethod: "cod"`, and shows the
  order in a new **Orders** tab in `dashboard.html` so you can call to confirm and mark
  it fulfilled once it's delivered and paid.
- **Dedicated product pages**: every piece now has its own shareable URL —
  `product.html?id=7` — instead of only opening in a popup. Good for sending a direct
  link to a customer and for search engines. Related pieces from the same category are
  shown at the bottom.

## Still manual / not wired up

- **Online payment**: Cash on Delivery is the only live payment method. Add Stripe (or
  another provider) when you're ready to accept card/online payment as a second option
  — the payment selector in the cart drawer already has a disabled "Online payment —
  coming soon" row ready to enable.
- **Contact form**: still opens the visitor's email app (`mailto:`) rather than sending
  through a backend — connect a form service like Formspree if you want it to submit
  without leaving the page.
- **Real product photos**: 10 of the 15 default products still use a flat sketch icon
  instead of a real photo. Open `dashboard.html` → Index → **Edit** on a product → use
  the **Photo** field to upload a real photo (it goes straight to Firebase Storage and
  replaces the sketch everywhere the product appears).

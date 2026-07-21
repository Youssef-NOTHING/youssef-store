/* ============================================================
   CHECKOUT
   Cash on Delivery is the one live payment method — the order is
   written to Firestore ("orders" collection) with the customer's
   name/phone/address so it can be prepared and paid for on
   delivery. Connect a payment provider (e.g. Stripe) later to add
   real online payment as a second option.
   ============================================================ */

import { db, collection, addDoc, serverTimestamp } from "./firebase.js";
import { clearCart } from "./cart.js";

const ORDER_NOTIFY_ENDPOINT = "https://formspree.io/f/mojgwgee";

export async function placeOrder(cart, products, customer){
  const items = Object.entries(cart).map(([key, line]) => {
    const p = products.find(pp => pp.id === line.productId);
    return {
      productId: line.productId,
      name: p ? p.name : "Unknown",
      size: line.size || null,
      qty: line.qty,
      price: p ? p.price : 0,
    };
  });
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const order = {
    items,
    subtotal,
    status: "new",
    paymentMethod: "cod",
    customer: {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    },
    createdAt: serverTimestamp(),
  };

  try{
    const docRef = await addDoc(collection(db, "orders"), order);
    notifyStudio(docRef.id, order, customer, false); // best-effort email ping, doesn't block the order
    clearCart();
    return { id: docRef.id, saved: true };
  }catch(e){
    // Plan B: Firestore is unreachable (outage, offline, rules issue). The order
    // hasn't been saved to the database, but we still email it straight to the
    // studio inbox so nothing is lost — it just needs to be entered manually later.
    console.error("Could not save order to Firestore — emailing it directly instead:", e);
    await notifyStudio("unsaved-" + Date.now(), order, customer, true);
    clearCart();
    return { id: null, saved: false };
  }
}

/* Emails the studio inbox via the same Formspree form used for the contact page,
   so a new Cash on Delivery order shows up in Gmail right away — no backend needed.
   If this fails for any reason, the order is still safely saved in Firestore and
   visible in the dashboard's Orders tab, so nothing is lost. */
async function notifyStudio(orderId, order, customer, unsaved){
  const itemsText = order.items
    .map(i => `${i.qty} x ${i.name}${i.size ? " (" + i.size + ")" : ""} - ${i.price * i.qty} MAD`)
    .join("\n");
  const warning = unsaved
    ? "\u26A0\uFE0F COULD NOT SAVE TO DATABASE — Firebase was unreachable. This order only exists in this email. Please enter it into the dashboard manually once things are back up.\n\n"
    : "";
  const body = new FormData();
  body.append("name", customer.name);
  body.append("_subject", `${unsaved ? "[UNSAVED] " : ""}New COD order — ${customer.name} — ${order.subtotal} MAD`);
  body.append("message",
    `${warning}New Cash on Delivery order (${orderId})\n\n` +
    `Customer: ${customer.name}\nPhone: ${customer.phone}\nAddress: ${customer.address}\n\n` +
    `Items:\n${itemsText}\n\nSubtotal: ${order.subtotal} MAD`);
  try{
    await fetch(ORDER_NOTIFY_ENDPOINT, { method: "POST", headers: { "Accept": "application/json" }, body });
  }catch(e){
    console.error("Order notification email failed to send too:", e);
  }
}

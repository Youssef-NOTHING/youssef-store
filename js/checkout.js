/* ============================================================
   CHECKOUT
   Payment is cash on delivery — no card is charged. Placing an
   order does two things: (1) saves it to Firestore so it's durable
   and visible in the Firebase console, and (2) posts the order to
   Formspree, which forwards it to the studio's inbox.
   ============================================================ */

import { db, collection, addDoc, serverTimestamp } from "./firebase.js";
import { clearCart } from "./cart.js";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mojgwgee";

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

  // Customer/delivery details are required so the studio can actually
  // reach the buyer and deliver a cash-on-delivery order.
  const customerInfo = {
    name: (customer && customer.name) || "",
    phone: (customer && customer.phone) || "",
    address: (customer && customer.address) || "",
    city: (customer && customer.city) || "",
    note: (customer && customer.note) || "",
  };

  const order = {
    items,
    subtotal,
    customer: customerInfo,
    payment: "cash_on_delivery",
    status: "new",
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "orders"), order);

  // Best-effort inbox notification — if this fails, the order is
  // still saved in Firestore, so checkout isn't blocked by it.
  try{
    const itemsText = items
      .map(i => `${i.qty} x ${i.name}${i.size ? ' ('+i.size+')' : ''} — ${i.price * i.qty} MAD`)
      .join("\n");
    await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: `New order #${docRef.id} — ${customerInfo.name || "unnamed"}`,
        order_id: docRef.id,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        customer_city: customerInfo.city,
        customer_note: customerInfo.note,
        items: itemsText,
        subtotal: subtotal + " MAD",
        payment_method: "Cash on delivery",
      }),
    });
  }catch(e){
    console.error("Order notification email failed (order was still saved):", e);
  }

  clearCart();
  return docRef.id;
}

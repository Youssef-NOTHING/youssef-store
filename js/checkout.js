/* ============================================================
   CHECKOUT
   Still a demo checkout — no payment is taken. The one real thing
   it now does is write the order to Firestore ("orders" collection)
   so it shows up somewhere durable instead of just an alert box.
   Connect a payment provider (e.g. Stripe) to take real payment.
   ============================================================ */

import { db, collection, addDoc, serverTimestamp } from "./firebase.js";
import { clearCart } from "./cart.js";

export async function placeOrder(cart, products){
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
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "orders"), order);
  clearCart();
  return docRef.id;
}

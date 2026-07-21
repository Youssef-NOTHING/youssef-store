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

  const docRef = await addDoc(collection(db, "orders"), order);
  clearCart();
  return docRef.id;
}

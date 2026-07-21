/* ============================================================
   CART
   The bag itself stays in this browser's localStorage — that's
   normal for a cart (it's fine if it doesn't follow you to
   another device before checkout). Orders, once checked out, are
   what gets written to Firestore — see checkout.js.
   ============================================================ */

const CART_KEY = "yb_cart_v1";

export function getCart(){
  try{
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}

export function saveCart(cart){
  try{ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  catch(e){ console.error("Could not save cart:", e); }
}

export function cartCount(cart){
  return Object.values(cart).reduce((a,b)=>a + (b.qty||0), 0);
}

export function clearCart(){
  localStorage.removeItem(CART_KEY);
}

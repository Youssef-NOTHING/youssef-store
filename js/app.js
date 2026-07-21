/* ============================================================
   APP — shared UI wiring used on every page (index/about/faq):
   the cart drawer, the studio chatbot, and the page loader.
   Import this after products.js/cart.js on each page.
   ============================================================ */

import { getCart, saveCart, cartCount } from "./cart.js";
import { fmtPrice } from "./products.js";
import { placeOrder } from "./checkout.js";

/* ---------- Studio bot: small rule-based FAQ assistant, shared across pages.
   No backend/API — it just matches keywords against the site's own FAQ content. ---------- */
export const CHAT_QUICK = ["Shipping times", "Sizing", "Returns", "Contact"];
const CHAT_QA = [
  { keys:["ship","deliver","when will","how long","dispatch"],
    reply:"Clothing is made to order — allow 5–10 working days before it ships. Objects like mugs, totes and beanies usually ship within 1–3 working days. Delivery inside Morocco takes 2–4 working days after dispatch." },
  { keys:["return","exchange","refund"],
    reply:"Objects can be returned within 14 days if unused and in original packaging. Made-to-order clothing can be exchanged for a different size within 14 days, but isn't refundable unless it arrives faulty." },
  { keys:["size","sizing","fit"],
    reply:"Cuts run true to size and slightly relaxed. If you're between two sizes, size down for a closer fit or up for roomier. Custom sizing isn't offered at scale yet — message the studio before ordering a made-to-order piece." },
  { keys:["price","cost","how much","expensive"],
    reply:"Prices vary by piece — objects start around 60 MAD, clothing from about 260 MAD. Open the index to see the exact price for each piece." },
  { keys:["contact","email","whatsapp","reach","talk to","phone"],
    reply:"You can reach the studio at studio@youssefboukhmiss.com or WhatsApp +212 6XX-XXXXXX, Mon–Sat 10:00–18:00. There's also a contact form on the Shipping & FAQ page." },
  { keys:["where","location","morocco","studio","made in"],
    reply:"Everything is made in Morocco. The studio is open by appointment." },
  { keys:["damage","wrong","broken","faulty"],
    reply:"If something arrives damaged or wrong, message the studio with your order number and a photo within 7 days of delivery — it'll be remade or refunded, no questions asked." },
  { keys:["hi","hello","salam","hey","bonjour","slt"],
    reply:"Salam! Ask me about shipping, sizing, returns, or how to reach the studio." },
];
const CHAT_FALLBACK = "I don't have an answer for that yet — the fastest way is to email studio@youssefboukhmiss.com or use the contact form on the Shipping & FAQ page.";

export function chatReply(text){
  const t = text.toLowerCase();
  const hit = CHAT_QA.find(qa => qa.keys.some(k => t.includes(k)));
  return hit ? hit.reply : CHAT_FALLBACK;
}

export function initChat(){
  const quickEl = document.getElementById('chatQuick');
  if(!quickEl) return;
  quickEl.innerHTML = CHAT_QUICK.map(q =>
    `<button type="button" onclick="window.sendChatText('${q}')">${q}</button>`).join("");
  document.getElementById('chatForm').addEventListener('submit', e => {
    e.preventDefault();
    window.sendChatText(document.getElementById('chatInput').value.trim());
  });
  appendChatMsg('bot', "Salam! I'm the studio bot — ask me about shipping, sizing, returns, or how to reach us.");
}
function appendChatMsg(role, text){
  const wrap = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + (role === 'user' ? 'chat-user' : 'chat-bot');
  div.textContent = text;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}
window.toggleChat = function(){
  document.getElementById('chatPanel').classList.toggle('open');
  document.getElementById('chatToggle').style.display = document.getElementById('chatPanel').classList.contains('open') ? 'none' : 'flex';
};
window.sendChatText = function(val){
  if(!val) return;
  appendChatMsg('user', val);
  document.getElementById('chatInput').value = "";
  setTimeout(() => appendChatMsg('bot', chatReply(val)), 350);
};

/* ---------- Cart drawer: shared render/open/close/checkout, driven by whatever
   `products` array the calling page passes in. ---------- */
export function makeCartController(products){
  let cart = getCart();

  function render(){
    document.getElementById('cart-count').textContent = cartCount(cart);
    const itemsEl = document.getElementById('drawer-items');
    const keys = Object.keys(cart);
    if(keys.length === 0){
      itemsEl.innerHTML = `<div class="drawer-empty">— bag is empty —</div>`;
    } else {
      itemsEl.innerHTML = keys.map(key => {
        const line = cart[key];
        const p = products.find(pp => pp.id === line.productId);
        if(!p) return "";
        return `
          <div class="d-item">
            <div class="d-line">
              <span class="d-name">${line.qty} × ${p.name.toUpperCase()}${line.size ? ' ('+line.size+')' : ''}</span>
              <span class="d-filler"></span>
              <span class="d-price">${fmtPrice(p.price * line.qty)}</span>
            </div>
            <div class="d-sub">
              <span>No. ${String(p.id).padStart(3,'0')} — ${p.cat}</span>
              <div class="qty">
                <button onclick="window.__cart.changeQty('${key}', -1)">−</button>
                <span>${line.qty}</span>
                <button onclick="window.__cart.changeQty('${key}', 1)">+</button>
                <span class="d-remove" onclick="window.__cart.removeLine('${key}')">remove</span>
              </div>
            </div>
          </div>`;
      }).join("");
    }
    const subtotal = keys.reduce((sum, key) => {
      const line = cart[key];
      const p = products.find(pp => pp.id === line.productId);
      return sum + (p ? p.price * line.qty : 0);
    }, 0);
    document.getElementById('subtotal').textContent = fmtPrice(subtotal);
  }

  const api = {
    cart,
    render,
    addLine(key, productId, size){
      if(!cart[key]) cart[key] = { productId, size, qty:0 };
      cart[key].qty += 1;
      saveCart(cart);
      render();
    },
    changeQty(key, delta){
      cart[key].qty += delta;
      if(cart[key].qty <= 0) delete cart[key];
      saveCart(cart);
      render();
    },
    removeLine(key){ delete cart[key]; saveCart(cart); render(); },
    open(){ document.getElementById('drawer').classList.add('open'); document.getElementById('overlay').classList.add('open'); },
    close(){ document.getElementById('drawer').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); },
    async checkout(){
      if(cartCount(cart) === 0){ alert("Your bag is empty."); return; }
      try{
        await placeOrder(cart, products);
        cart = getCart();
        render();
        alert("Order received — no payment has been taken yet.\nConnect a payment provider such as Stripe to accept real payment.");
      }catch(e){
        console.error("Could not save order:", e);
        alert("Demo checkout — no payment has been taken.\nConnect a payment provider such as Stripe to accept real orders.");
      }
    },
  };
  window.__cart = api;
  window.openDrawer = api.open;
  window.closeDrawer = api.close;
  window.checkout = api.checkout;
  return api;
}

/* ---------- Page loader fade-out, identical on every page ---------- */
export function initPageLoader(){
  window.addEventListener('load', function(){
    setTimeout(function(){
      const loader = document.getElementById('pageLoader');
      if(loader){ loader.classList.add('hide'); setTimeout(function(){ loader.remove(); }, 550); }
    }, 350);
  });
}

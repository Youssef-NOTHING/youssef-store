/* ============================================================
   APP — shared UI wiring used on every page (index/about/faq):
   the cart drawer, the studio chatbot, and the page loader.
   Import this after products.js/cart.js on each page.
   ============================================================ */

import { getCart, saveCart, cartCount } from "./cart.js";
import { fmtPrice } from "./products.js";
import { placeOrder } from "./checkout.js";
import { t } from "./i18n.js";

/* ---------- Studio bot: small rule-based FAQ assistant, shared across pages.
   No backend/API — it just matches keywords (in en/fr/ar) against the site's
   own FAQ content, then replies in whichever language is currently active. ---------- */
const CHAT_QA = [
  { keys:["ship","deliver","when will","how long","dispatch","livrais","exped","envoi","délai","delai","شحن","توصيل","متى"],
    replyKey:"chat_reply_shipping" },
  { keys:["return","exchange","refund","retour","échange","echange","rembours","إرجاع","استرجاع","استبدال"],
    replyKey:"chat_reply_returns" },
  { keys:["size","sizing","fit","taille","مقاس","المقاسات"],
    replyKey:"chat_reply_sizing" },
  { keys:["price","cost","how much","expensive","prix","coût","cout","سعر","الثمن","كلفة"],
    replyKey:"chat_reply_price" },
  { keys:["contact","email","whatsapp","reach","talk to","phone","joindre","contacter","تواصل","راسل","هاتف"],
    replyKey:"chat_reply_contact" },
  { keys:["where","location","morocco","studio","made in","où","maroc","atelier","أين","المغرب","الاستوديو"],
    replyKey:"chat_reply_location" },
  { keys:["damage","wrong","broken","faulty","endommag","cassé","casse","défaut","defaut","تالف","معيب","خطأ"],
    replyKey:"chat_reply_damage" },
  { keys:["hi","hello","salam","hey","bonjour","slt","سلام","مرحبا"],
    replyKey:"chat_reply_hi" },
];

export function chatReply(text){
  const lower = text.toLowerCase();
  const hit = CHAT_QA.find(qa => qa.keys.some(k => lower.includes(k)));
  return hit ? t(hit.replyKey) : t("chat_fallback");
}

export function initChat(){
  renderChatQuick();
  const form = document.getElementById('chatForm');
  if(form && !form.dataset.wired){
    form.dataset.wired = "1";
    form.addEventListener('submit', e => {
      e.preventDefault();
      window.sendChatText(document.getElementById('chatInput').value.trim());
    });
  }
  resetChatGreeting();
  window.addEventListener('yb:langchange', () => {
    renderChatQuick();
    resetChatGreeting();
  });
}
function renderChatQuick(){
  const quickEl = document.getElementById('chatQuick');
  if(!quickEl) return;
  const labels = [
    t("chat_quick_shipping"), t("chat_quick_sizing"),
    t("chat_quick_returns"), t("chat_quick_contact"),
  ];
  quickEl.innerHTML = labels.map(label =>
    `<button type="button" onclick="window.sendChatText('${label.replace(/'/g,"\\'")}')">${label}</button>`).join("");
}
function resetChatGreeting(){
  const wrap = document.getElementById('chatMessages');
  if(!wrap) return;
  wrap.innerHTML = "";
  appendChatMsg('bot', t("chat_greeting"));
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
      itemsEl.innerHTML = `<div class="drawer-empty">${t("drawer_empty")}</div>`;
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
                <span class="d-remove" onclick="window.__cart.removeLine('${key}')">${t("remove_btn")}</span>
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

  window.addEventListener('yb:langchange', render);

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
    checkout(){
      if(cartCount(cart) === 0){ alert(t("checkout_empty")); return; }
      openCheckoutInfo();
    },
  };
  window.__cart = api;
  window.openDrawer = api.open;
  window.closeDrawer = api.close;
  window.checkout = api.checkout;

  /* ---------- Delivery-details modal: every order needs a name, phone,
     address and city so a cash-on-delivery order can actually be
     reached and delivered — collected here right before placeOrder(). ---------- */
  function openCheckoutInfo(){
    const overlay = document.getElementById('coOverlay');
    if(!overlay) return;
    document.getElementById('coError').textContent = "";
    overlay.classList.add('open');
  }
  window.closeCheckoutInfo = function(){
    document.getElementById('coOverlay').classList.remove('open');
  };
  window.submitCheckoutInfo = async function(){
    const name = document.getElementById('co-name').value.trim();
    const phone = document.getElementById('co-phone').value.trim();
    const address = document.getElementById('co-address').value.trim();
    const city = document.getElementById('co-city').value.trim();
    const note = document.getElementById('co-note').value.trim();
    const errEl = document.getElementById('coError');

    if(!name || !phone || !address || !city){
      errEl.textContent = t("checkout_info_fill_required");
      return;
    }

    const btn = document.getElementById('coSubmitBtn');
    const originalLabel = btn.textContent;
    errEl.textContent = "";
    btn.disabled = true;
    btn.textContent = t("checkout_placing_btn");
    try{
      await placeOrder(cart, products, { name, phone, address, city, note });
      cart = getCart();
      render();
      window.closeCheckoutInfo();
      api.close();
      ["co-name","co-phone","co-address","co-city","co-note"].forEach(id => {
        document.getElementById(id).value = "";
      });
      alert(t("checkout_success"));
    }catch(e){
      console.error("Could not save order:", e);
      errEl.textContent = t("checkout_error");
    }finally{
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  };

  return api;
}

window.toggleNavMenu = function(){
  document.getElementById('navLinks').classList.toggle('open');
};

/* ---------- Page loader fade-out, identical on every page ---------- */
export function initPageLoader(){
  window.addEventListener('load', function(){
    setTimeout(function(){
      const loader = document.getElementById('pageLoader');
      if(loader){ loader.classList.add('hide'); setTimeout(function(){ loader.remove(); }, 550); }
    }, 350);
  });
}

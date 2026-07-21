/* ============================================================
   DASHBOARD
   Same admin functionality as the old admin.html, but products
   are read from / written to Firestore (and photos to Firebase
   Storage) instead of localStorage — so edits show up for every
   visitor, on every device.
   ============================================================ */

import { watchAuth, isAdmin, signOutUser } from "./auth.js";
import {
  getProducts, saveProduct, createProduct, deleteProduct, resetProducts,
  uploadProductImage, fmtPrice, ICONS, getProductsSource,
} from "./products.js";
import { db, collection, getDocs, doc, updateDoc, query, orderBy } from "./firebase.js";

let products = [];
let editingId = null;
let orders = [];

function iconSvg(iconKey){
  return `<svg viewBox="0 0 100 100">${ICONS[iconKey] || ""}</svg>`;
}
function visualCell(p){
  return p.image ? `<img src="${p.image}" alt="${p.name}">` : iconSvg(p.icon);
}

async function renderTable(){
  products = await getProducts();
  const body = document.getElementById('tableBody');
  body.innerHTML = products.map(p => `
    <tr>
      <td class="dash-icon-cell">${visualCell(p)}</td>
      <td class="mono">${String(p.id).padStart(3,'0')}</td>
      <td>${p.name}</td>
      <td style="text-transform:capitalize;">${p.cat}</td>
      <td class="mono">${fmtPrice(p.price)}</td>
      <td class="mono">${p.sizes ? p.sizes.join(", ") : "—"}</td>
      <td>
        <div class="dash-actions">
          <button onclick="window.editProduct(${p.id})">Edit</button>
          <button class="danger" onclick="window.deleteProductRow(${p.id})">Delete</button>
        </div>
      </td>
    </tr>`).join("");
}

window.showForm = function(){
  editingId = null;
  document.getElementById('formTitle').textContent = "Add a product";
  document.getElementById('f-name').value = "";
  document.getElementById('f-cat').value = "clothing";
  document.getElementById('f-price').value = "";
  document.getElementById('f-icon').value = "tee";
  document.getElementById('f-sizes').value = "";
  document.getElementById('f-desc').value = "";
  document.getElementById('f-image-file').value = "";
  document.getElementById('f-upload-status').textContent = "";
  document.getElementById('formBox').style.display = "block";
  document.getElementById('formBox').scrollIntoView({behavior:"smooth", block:"center"});
};
window.hideForm = function(){
  document.getElementById('formBox').style.display = "none";
};
window.editProduct = function(id){
  const p = products.find(pp => pp.id === id);
  if(!p) return;
  editingId = id;
  document.getElementById('formTitle').textContent = `Edit — No. ${String(p.id).padStart(3,'0')}`;
  document.getElementById('f-name').value = p.name;
  document.getElementById('f-cat').value = p.cat;
  document.getElementById('f-price').value = p.price;
  document.getElementById('f-icon').value = p.icon || "tee";
  document.getElementById('f-sizes').value = p.sizes ? p.sizes.join(", ") : "";
  document.getElementById('f-desc').value = p.desc || "";
  document.getElementById('f-image-file').value = "";
  document.getElementById('f-upload-status').textContent = p.image ? `Current photo: ${p.image}` : "";
  document.getElementById('formBox').style.display = "block";
  document.getElementById('formBox').scrollIntoView({behavior:"smooth", block:"center"});
};

window.saveForm = async function(){
  const name = document.getElementById('f-name').value.trim();
  const cat = document.getElementById('f-cat').value;
  const price = parseFloat(document.getElementById('f-price').value);
  const icon = document.getElementById('f-icon').value;
  const sizesRaw = document.getElementById('f-sizes').value.trim();
  const sizes = sizesRaw ? sizesRaw.split(",").map(s => s.trim()).filter(Boolean) : null;
  const desc = document.getElementById('f-desc').value.trim();
  const fileInput = document.getElementById('f-image-file');

  if(!name || isNaN(price)){
    alert("Please fill in at least a name and a valid price.");
    return;
  }

  const gradPalette = [
    ["#3E4A38","#171912"], ["#4B4238","#1a1611"], ["#2E3A4A","#12161c"],
    ["#3A2E2A","#15110e"], ["#5A5240","#1e1b13"], ["#40382E","#15120d"],
    ["#A33B34","#5c221c"], ["#4A4A44","#181815"], ["#8A8578","#302e26"], ["#2E2E2E","#0e0e0e"]
  ];

  document.getElementById('f-upload-status').textContent = "Saving…";

  try{
    let image = null;
    if(editingId){
      const existing = products.find(pp => pp.id === editingId);
      image = existing ? existing.image : null;
    }

    if(editingId){
      const p = products.find(pp => pp.id === editingId);
      const updated = { ...p, name, cat, price, icon, sizes, desc, image };
      if(fileInput.files[0]){
        document.getElementById('f-upload-status').textContent = "Uploading photo…";
        updated.image = await uploadProductImage(fileInput.files[0], editingId);
      }
      await saveProduct(updated);
    } else {
      const nextId = products.length ? Math.max(...products.map(pp => pp.id)) + 1 : 1;
      const created = {
        id: nextId, name, cat, price, icon, sizes, desc, image: null,
        grad: gradPalette[nextId % gradPalette.length],
      };
      if(fileInput.files[0]){
        document.getElementById('f-upload-status').textContent = "Uploading photo…";
        created.image = await uploadProductImage(fileInput.files[0], nextId);
      }
      await saveProduct(created);
    }

    window.hideForm();
    await renderTable();
  }catch(e){
    console.error("Could not save product:", e);
    document.getElementById('f-upload-status').textContent = "Could not save — check the console / Firestore rules.";
  }
};

window.deleteProductRow = async function(id){
  const p = products.find(pp => pp.id === id);
  if(!confirm(`Remove "${p.name}" from the index? This can't be undone (except via Reset).`)) return;
  await deleteProduct(id);
  await renderTable();
};

window.handleReset = async function(){
  if(!confirm("Reset the entire index back to the 15 default products? Any custom edits will be lost.")) return;
  await resetProducts();
  await renderTable();
};

/* ---------- Tabs ---------- */
window.showTab = function(tab){
  document.getElementById('overviewView').style.display = tab === 'overview' ? 'block' : 'none';
  document.getElementById('productsView').style.display = tab === 'products' ? 'block' : 'none';
  document.getElementById('ordersView').style.display = tab === 'orders' ? 'block' : 'none';
  document.getElementById('tabOverview').classList.toggle('active', tab === 'overview');
  document.getElementById('tabProducts').classList.toggle('active', tab === 'products');
  document.getElementById('tabOrders').classList.toggle('active', tab === 'orders');
  if(tab === 'overview') loadOverview();
  if(tab === 'orders') loadOrders();
};

/* ---------- Overview: quick counts across products + orders ---------- */
async function loadOverview(){
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = `<div class="dash-user">Crunching numbers…</div>`;

  const prods = await getProducts();
  const fallback = getProductsSource() !== 'firestore';

  let ordersData = orders;
  let ordersFailed = false;
  try{
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    ordersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    orders = ordersData;
  }catch(e){
    console.error("Could not load orders for overview:", e);
    ordersFailed = true;
  }

  const clothingCount = prods.filter(p => p.cat === 'clothing').length;
  const objectsCount = prods.filter(p => p.cat === 'objects').length;
  const newOrders = ordersData.filter(o => o.status !== 'fulfilled').length;
  const fulfilledOrders = ordersData.filter(o => o.status === 'fulfilled').length;
  const totalRevenue = ordersData.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const pendingRevenue = ordersData.filter(o => o.status !== 'fulfilled').reduce((sum, o) => sum + (o.subtotal || 0), 0);

  const banner = (fallback || ordersFailed) ? `
    <div class="fallback-banner">
      <strong>Plan B is active.</strong>
      ${fallback ? "The product index couldn't reach Firestore, so the shop is showing a saved copy of the catalog (your last successful load, or the built-in defaults) — visitors can still browse and order. " : ""}
      ${ordersFailed ? "Orders couldn't be loaded from the database right now — check your email, since every Cash on Delivery order is also emailed to the studio inbox as a backup. " : ""}
      Reload once Firebase is back to confirm everything's in sync.
    </div>` : "";

  grid.innerHTML = banner + `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-num">${prods.length}</div><div class="stat-label">Pieces in the index</div></div>
      <div class="stat-card"><div class="stat-num">${clothingCount}</div><div class="stat-label">Clothing</div></div>
      <div class="stat-card"><div class="stat-num">${objectsCount}</div><div class="stat-label">Objects</div></div>
      <div class="stat-card accent"><div class="stat-num">${newOrders}</div><div class="stat-label">New orders (COD)</div></div>
      <div class="stat-card"><div class="stat-num">${fulfilledOrders}</div><div class="stat-label">Fulfilled orders</div></div>
      <div class="stat-card"><div class="stat-num">${ordersData.length}</div><div class="stat-label">Orders, all time</div></div>
      <div class="stat-card accent"><div class="stat-num">${fmtPrice(pendingRevenue)}</div><div class="stat-label">Pending revenue</div></div>
      <div class="stat-card"><div class="stat-num">${fmtPrice(totalRevenue)}</div><div class="stat-label">Total revenue, all time</div></div>
    </div>`;
}

/* ---------- Orders (Cash on Delivery) ---------- */
async function loadOrders(){
  const listEl = document.getElementById('ordersList');
  listEl.innerHTML = `<div class="dash-user">Loading orders…</div>`;
  try{
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }catch(e){
    console.error("Could not load orders:", e);
    listEl.innerHTML = `<div class="dash-user">Could not load orders from the database right now. Check your email inbox — every order is also emailed there as a backup — and try reloading in a bit.</div>`;
    return;
  }
  renderOrders();
}

function renderOrders(){
  const listEl = document.getElementById('ordersList');
  const badge = document.getElementById('ordersBadge');
  const newCount = orders.filter(o => o.status !== 'fulfilled').length;
  badge.style.display = newCount > 0 ? 'inline-block' : 'none';
  badge.textContent = newCount;

  if(orders.length === 0){
    listEl.innerHTML = `<div class="dash-user">No orders yet.</div>`;
    return;
  }

  listEl.innerHTML = orders.map(o => {
    const fulfilled = o.status === 'fulfilled';
    const when = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString() : "just now";
    const customer = o.customer || {};
    const itemsHtml = (o.items || []).map(i => `
      <div><span>${i.qty} × ${i.name}${i.size ? ' ('+i.size+')' : ''}</span><span>${fmtPrice(i.price * i.qty)}</span></div>`).join("");
    return `
      <div class="order-card ${fulfilled ? 'fulfilled' : ''}">
        <div class="order-top">
          <span class="order-when">${when}</span>
          <span class="order-status ${fulfilled ? 'fulfilled' : ''}">${fulfilled ? 'Fulfilled' : 'New — COD'}</span>
        </div>
        <div class="order-customer">
          <strong>${customer.name || 'Unknown'}</strong> — ${customer.phone || 'no phone'}<br>
          ${customer.address || 'no address given'}
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-subtotal">Subtotal: ${fmtPrice(o.subtotal || 0)}</div>
        <div class="dash-actions">
          ${fulfilled
            ? `<button onclick="window.setOrderStatus('${o.id}', 'new')">Mark as new</button>`
            : `<button onclick="window.setOrderStatus('${o.id}', 'fulfilled')">Mark fulfilled</button>`}
        </div>
      </div>`;
  }).join("");
}

window.setOrderStatus = async function(id, status){
  try{
    await updateDoc(doc(db, "orders", id), { status });
    const o = orders.find(oo => oo.id === id);
    if(o) o.status = status;
    renderOrders();
  }catch(e){
    console.error("Could not update order:", e);
    alert("Could not update the order — check the console / Firestore rules.");
  }
};

window.handleSignOut = async function(){
  await signOutUser();
  window.location.href = "login.html";
};

/* ---------- Auth guard: only signed-in admins see the panel ---------- */
watchAuth(async (user) => {
  if(!user){
    window.location.href = "login.html";
    return;
  }
  const admin = await isAdmin(user);
  if(!admin){
    document.getElementById('gate').style.display = "block";
    document.getElementById('panel').style.display = "none";
    document.getElementById('gateMsg').textContent =
      `Signed in as ${user.email}, but this account isn't on the studio admin list yet. Add a document at admins/${user.uid} in Firestore to grant access.`;
    return;
  }
  document.getElementById('gate').style.display = "none";
  document.getElementById('panel').style.display = "block";
  document.getElementById('dashUser').textContent = user.email;
  await renderTable();
  await loadOverview();
});

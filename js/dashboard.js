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
  fileToCompressedDataUrl, fmtPrice, ICONS,
} from "./products.js";

let products = [];
let editingId = null;

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
  document.getElementById('f-upload-status').textContent = p.image ? "This product already has a photo — choose a new file only if you want to replace it." : "";
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
        document.getElementById('f-upload-status').textContent = "Compressing photo…";
        updated.image = await fileToCompressedDataUrl(fileInput.files[0]);
      }
      await saveProduct(updated);
    } else {
      const nextId = products.length ? Math.max(...products.map(pp => pp.id)) + 1 : 1;
      const created = {
        id: nextId, name, cat, price, icon, sizes, desc, image: null,
        grad: gradPalette[nextId % gradPalette.length],
      };
      if(fileInput.files[0]){
        document.getElementById('f-upload-status').textContent = "Compressing photo…";
        created.image = await fileToCompressedDataUrl(fileInput.files[0]);
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
});

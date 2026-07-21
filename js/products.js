/* ============================================================
   PRODUCTS
   Products now live in Firestore (collection "products") instead
   of localStorage, so /dashboard.html edits show up for every
   visitor, on every device — not just in the browser that made
   the change.
   ============================================================ */

import {
  db, storage,
  collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy,
  ref, uploadBytes, getDownloadURL,
} from "./firebase.js";

const PRODUCTS_COL = "products";

/* ---------- Line-art "flat sketch" icons, one per garment/object type ---------- */
export const ICONS = {
  tee: `<path d="M30,18 L42,10 Q50,18 58,10 L70,18 L88,32 L76,44 L70,38 L70,90 L30,90 L30,38 L24,44 L12,32 Z"/>`,
  hoodie: `<path d="M50,8 Q34,8 30,22 L18,30 L26,44 L32,38 L32,90 L68,90 L68,38 L74,44 L82,30 L70,22 Q66,8 50,8 Z M42,20 Q50,28 58,20"/>`,
  jacket: `<path d="M32,16 L44,10 L50,18 L56,10 L68,16 L84,30 L74,42 L68,36 L68,90 L32,90 L32,36 L26,42 L16,30 Z M50,18 L50,90 M40,40 L40,60 M60,40 L60,60"/>`,
  shirt: `<path d="M34,14 L44,10 Q50,16 56,10 L66,14 L82,28 L72,40 L66,34 L66,90 L34,90 L34,34 L28,40 L18,28 Z M50,16 L50,44"/>`,
  jeans: `<path d="M32,10 L68,10 L70,90 L56,90 L52,40 L48,90 L34,90 Z M32,10 L30,26 M68,10 L70,26"/>`,
  cap: `<path d="M20,55 Q20,28 50,28 Q80,28 80,55 L84,58 Q60,66 50,66 Q40,66 16,58 Z M50,28 L50,20"/>`,
  tote: `<path d="M26,34 L74,34 L70,90 L30,90 Z M38,34 Q38,16 50,16 Q62,16 62,34"/>`,
  mug: `<path d="M26,26 L70,26 L68,80 L28,80 Z M70,34 Q88,34 88,50 Q88,64 70,64"/>`,
  stickers: `<path d="M20,20 L70,20 Q80,20 80,30 L80,80 L20,80 Z M70,20 L70,30 Q70,30 80,30"/>`,
  beanie: `<path d="M22,58 Q22,16 50,16 Q78,16 78,58 Z M22,58 L78,58 M22,70 L78,70"/>`,
};

/* ---------- Default catalog — used only to seed Firestore the first time ---------- */
export const DEFAULT_PRODUCTS = [
  { id: 1,  name: "Signature Tee",     cat: "clothing", icon: "tee",     price: 280,  sizes:["XS","S","M","L","XL"],
    grad:["#3E4A38","#171912"], desc:"Heavyweight 240gsm cotton, cut fuller through the body. The signature is printed once, small, at the left hem — not across the chest." },
  { id: 2,  name: "Wool Overshirt",    cat: "clothing", icon: "jacket",  price: 890,  sizes:["S","M","L","XL"],
    grad:["#4B4238","#1a1611"], desc:"A brushed wool shirt-jacket meant to be worn open, over anything. One chest pocket, horn buttons, made to be lived in." },
  { id: 3,  name: "Selvedge Denim",    cat: "clothing", icon: "jeans",   price: 1150, sizes:["30","32","34","36"],
    grad:["#2E3A4A","#12161c"], desc:"13oz selvedge denim, straight cut. Unwashed at first — it's meant to fade the way your days do." },
  { id: 4,  name: "Atelier Hoodie",    cat: "clothing", icon: "hoodie",  price: 650,  sizes:["S","M","L","XL"],
    grad:["#3A2E2A","#15110e"], desc:"Loopback cotton fleece, raw-edge hood, no drawstring hardware to catch on anything. Built for studio hours." },
  { id: 5,  name: "Linen Shirt",       cat: "clothing", icon: "shirt",   price: 520,  sizes:["S","M","L","XL"],
    grad:["#5A5240","#1e1b13"], desc:"Washed linen, worn soft from day one. A looser collar stand so the top button can stay done up." },
  { id: 6,  name: "Cropped Jacket",    cat: "clothing", icon: "jacket",  price: 980,  sizes:["XS","S","M","L"],
    grad:["#40382E","#15120d"], desc:"A shorter, structured jacket cut close through the shoulder. Half-lined for warmer evenings." },
  { id: 7,  name: "Ceramic Mug",       cat: "objects",  icon: "mug",     price: 120,  sizes:null,
    grad:["#A33B34","#5c221c"], desc:"Stoneware, hand-glazed, holds 350ml. The signature is stamped into the base, not printed on the side." },
  { id: 8,  name: "Canvas Tote",       cat: "objects",  icon: "tote",    price: 180,  sizes:null,
    grad:["#4A4A44","#181815"], desc:"14oz canvas, reinforced base and handles. Big enough for a day's worth of fabric swatches — or groceries." },
  { id: 9,  name: "Sticker Set",       cat: "objects",  icon: "stickers",price: 60,   sizes:null,
    grad:["#8A8578","#302e26"], desc:"Six die-cut stickers pulled from a season of pattern sketches. Vinyl, weatherproof." },
  { id: 10, name: "Wool Beanie",       cat: "objects",  icon: "beanie",  price: 220,  sizes:null,
    grad:["#2E2E2E","#0e0e0e"], desc:"Merino wool, unlined, ribbed knit. One size, folds once at the brim." },
  { id: 11, name: "Berry Racing Tee",   cat: "clothing", icon: "tee", price: 260, sizes:["S","M","L","XL"],
    image:"images/berry-racing-tee.png",
    desc:"Oversized black tee with a full racing-graphic back print and a small signature-script hit on the back neck." },
  { id: 12, name: "Halcyon Side Tee",   cat: "clothing", icon: "tee", price: 260, sizes:["S","M","L","XL"],
    image:"images/halcyon-side-tee.png",
    desc:"Washed cream tee with a moth-and-moon back graphic and a matching mini print on the chest." },
  { id: 13, name: "Gym Therapy Tee",    cat: "clothing", icon: "tee", price: 230, sizes:["S","M","L","XL","XXL"],
    image:"images/gym-therapy-tee.png",
    desc:"Oversized white tee, dropped shoulder, simple bold wordmark across the chest. No back print." },
  { id: 14, name: "\"No Risk No Story\" Print", cat: "objects", icon: "tote", price: 190, sizes:null,
    image:"images/no-risk-poster.png",
    desc:"A3 framed-ready print, black and white photography with a bold type overlay. Ships rolled, unframed." },
  { id: 15, name: "\"Success\" Steps Print",     cat: "objects", icon: "tote", price: 190, sizes:null,
    image:"images/success-poster.png",
    desc:"A3 framed-ready print, staircase typography piece listing what actually gets you there. Ships rolled, unframed." },
];

const PRODUCTS_CACHE_KEY = "yb_products_cache_v1";

/* Tracks where the last getProducts() call's data came from, so the UI (e.g. the
   dashboard) can warn the studio owner if Firebase is unreachable and the site is
   running on Plan B (a cached or hardcoded copy) instead of live data. */
let lastSource = "firestore";
export function getProductsSource(){ return lastSource; }

/* ---------- Firestore-backed product list, with an offline/outage fallback ---------- */
export async function getProducts(){
  try{
    const q = query(collection(db, PRODUCTS_COL), orderBy("id"));
    const snap = await getDocs(q);
    let list;
    if(snap.empty){
      await seedDefaults();
      list = structuredClone(DEFAULT_PRODUCTS);
    } else {
      list = snap.docs.map(d => d.data());
    }
    lastSource = "firestore";
    try{ localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(list)); }catch(e){ /* storage full/blocked — not critical */ }
    return list;
  }catch(e){
    console.error("Could not read products from Firestore — falling back to the last saved catalog:", e);
    try{
      const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if(cached){
        lastSource = "cache";
        return JSON.parse(cached);
      }
    }catch(e2){ /* fall through to hardcoded defaults */ }
    lastSource = "defaults";
    return structuredClone(DEFAULT_PRODUCTS);
  }
}

export async function getProductById(id){
  const products = await getProducts();
  return products.find(p => p.id === Number(id)) || null;
}

async function seedDefaults(){
  for(const p of DEFAULT_PRODUCTS){
    await setDoc(doc(db, PRODUCTS_COL, String(p.id)), p);
  }
}

export async function saveProduct(product){
  await setDoc(doc(db, PRODUCTS_COL, String(product.id)), product);
}

export async function createProduct(product){
  // Auto-increment id based on current max, since the UI still shows "No. 00X"
  const products = await getProducts();
  const nextId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
  const withId = { ...product, id: nextId };
  await setDoc(doc(db, PRODUCTS_COL, String(nextId)), withId);
  return withId;
}

export async function deleteProduct(id){
  await deleteDoc(doc(db, PRODUCTS_COL, String(id)));
}

export async function resetProducts(){
  const products = await getProducts();
  for(const p of products){
    await deleteDoc(doc(db, PRODUCTS_COL, String(p.id)));
  }
  await seedDefaults();
}

export async function uploadProductImage(file, productId){
  const path = `products/${productId}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/* ---------- Shared helpers ---------- */
export function fmtPrice(n){ return n.toLocaleString() + " MAD"; }

export function iconSvg(iconKey, extraClass){
  return `<svg class="${extraClass||''}" viewBox="0 0 100 100">${ICONS[iconKey] || ""}</svg>`;
}

export function productVisualHtml(p, imgClass, svgClass){
  if(p.image){
    return `<img src="${p.image}" alt="${p.name}" class="${imgClass || ''}">`;
  }
  return iconSvg(p.icon, svgClass);
}

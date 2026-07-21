/* ============================================================
   AUTH
   Email/password auth via Firebase Auth. "Admin" is decided by
   an allow-list stored in Firestore at admins/{uid} (see
   firestore.rules) rather than by anyone who happens to sign in —
   that keeps the /dashboard.html panel restricted to you even
   though sign-up is open.
   ============================================================ */

import {
  auth, db,
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, fbSignOut,
  doc, getDoc,
} from "./firebase.js";

export function watchAuth(callback){
  return onAuthStateChanged(auth, (user) => callback(user));
}

export async function signIn(email, password){
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signUp(email, password){
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutUser(){
  await fbSignOut(auth);
}

export async function isAdmin(user){
  if(!user) return false;
  try{
    const snap = await getDoc(doc(db, "admins", user.uid));
    return snap.exists();
  }catch(e){
    console.error("Could not check admin status:", e);
    return false;
  }
}

export function currentUser(){
  return auth.currentUser;
}

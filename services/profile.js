import DB from './db.js';

export function getProfile(chat_id){
  return DB.get(`SELECT * FROM profiles WHERE chat_id=?`, chat_id) || { chronotype:'day', nudge_pref:'short', avg_focus:6 };
}
export function updateProfile(chat_id, patch){
  // upsert logic…
}
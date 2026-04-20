window.SERVICES = [{"id": "s01", "name": "Eyebrow Threading", "price": 3}, {"id": "s02", "name": "Upper Lip Threading", "price": 2}, {"id": "s03", "name": "Full Face Threading", "price": 8}, {"id": "s04", "name": "Full Face Waxing", "price": 12}, {"id": "s05", "name": "Full Leg Waxing", "price": 18}, {"id": "s06", "name": "Half Leg Waxing", "price": 9}, {"id": "s07", "name": "Full Arm Waxing", "price": 10}, {"id": "s08", "name": "Hollywood Waxing", "price": 18}, {"id": "s09", "name": "Aroma Facial", "price": 35}, {"id": "s10", "name": "Manicure", "price": 15}, {"id": "s11", "name": "Pedicure", "price": 25}, {"id": "s12", "name": "Head Massage", "price": 15}, {"id": "s13", "name": "Simple Hair & Makeup", "price": 70}, {"id": "s14", "name": "Mehndi — Simple Line One Hand Front", "price": 5}];
const PHONE_NUMBER = "447599693034";
function formatCurrency(v) { return "£" + Number(v || 0).toFixed(0); }
function serviceById(id) { return (window.SERVICES || []).find(s => s.id === id); }
function selectedServiceObjects(ids) { return ids.map(serviceById).filter(Boolean); }
function selectedTotal(ids) { return selectedServiceObjects(ids).reduce((sum, s) => sum + Number(s.price || 0), 0); }
function openWhatsAppBooking(payload) {
  const lines = ["Hi Vaishali, I'd like to book an appointment.","",`Name: ${payload.name}`,`Phone: ${payload.phone}`,`Date: ${payload.date}`,`Time: ${payload.time}`,`Services: ${payload.services.join(", ")}`,`Total: £${payload.total}`];
  if (payload.notes) lines.push(`Notes: ${payload.notes}`);
  window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
}
async function getSupabaseClient() {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY || window.SUPABASE_URL.includes("PASTE_")) throw new Error("Supabase is not configured yet. Update js/config.js first.");
  if (!window.supabase || !window.supabase.createClient) throw new Error("Supabase library failed to load.");
  if (!window._sb) window._sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  return window._sb;
}

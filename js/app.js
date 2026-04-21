window.SERVICES = [{"id": "s01", "name": "Eyebrow Threading", "price": 3, "category": "Threading"}, {"id": "s02", "name": "Upper Lip Threading", "price": 2, "category": "Threading"}, {"id": "s03", "name": "Full Face Threading", "price": 8, "category": "Threading"}, {"id": "s04", "name": "Full Face Waxing", "price": 12, "category": "Waxing"}, {"id": "s05", "name": "Full Leg Waxing", "price": 18, "category": "Waxing"}, {"id": "s06", "name": "Half Leg Waxing", "price": 9, "category": "Waxing"}, {"id": "s07", "name": "Full Arm Waxing", "price": 10, "category": "Waxing"}, {"id": "s08", "name": "Hollywood Waxing (Strip)", "price": 18, "category": "Waxing"}, {"id": "s15", "name": "Hollywood Waxing (Hot Wax)", "price": 25, "category": "Waxing"}, {"id": "s09", "name": "Aroma Facial", "price": 35, "category": "Facials & Care"}, {"id": "s10", "name": "Manicure", "price": 15, "category": "Nails & Massage"}, {"id": "s11", "name": "Pedicure", "price": 25, "category": "Nails & Massage"}, {"id": "s12", "name": "Head Massage", "price": 15, "category": "Nails & Massage"}, {"id": "s13", "name": "Simple Hair & Makeup", "price": 70, "category": "Makeup & Mehndi"}, {"id": "s14", "name": "Mehndi — Simple Line One Hand Front", "price": 5, "category": "Makeup & Mehndi"}];
const PHONE_NUMBER = "447599693034";

function formatCurrency(v) {
  return "£" + Number(v || 0).toFixed(0);
}

function serviceById(id) {
  return (window.SERVICES || []).find(s => s.id === id);
}

function selectedServiceObjects(ids) {
  return ids.map(serviceById).filter(Boolean);
}

function selectedTotal(ids) {
  return selectedServiceObjects(ids).reduce((sum, s) => sum + Number(s.price || 0), 0);
}

function groupedServices() {
  const groups = {};
  (window.SERVICES || []).forEach(service => {
    const category = service.category || "Services";
    if (!groups[category]) groups[category] = [];
    groups[category].push(service);
  });
  return groups;
}

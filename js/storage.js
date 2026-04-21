
(function () {
  const KEYS = {
    bookings: "vb_bookings",
    feedback: "vb_feedback",
    gallery: "vb_gallery",
    adminSession: "vb_admin_session"
  };

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  window.VBStore = {
    keys: KEYS,

    getBookings() { return read(KEYS.bookings, []); },
    saveBookings(items) { write(KEYS.bookings, items); },

    getFeedback() { return read(KEYS.feedback, []); },
    saveFeedback(items) { write(KEYS.feedback, items); },

    getGallery() { return read(KEYS.gallery, []); },
    saveGallery(items) { write(KEYS.gallery, items); },

    isAdminLoggedIn() { return !!localStorage.getItem(KEYS.adminSession); },
    setAdminSession(value) {
      if (value) localStorage.setItem(KEYS.adminSession, "1");
      else localStorage.removeItem(KEYS.adminSession);
    }
  };
})();

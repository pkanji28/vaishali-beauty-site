(function () {
  const KEYS = {
    bookings: "vb_bookings",
    feedback: "vb_feedback",
    adminSession: "vb_admin_session"
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  window.VBStorage = {
    getBookings() {
      return read(KEYS.bookings, []);
    },
    saveBookings(bookings) {
      write(KEYS.bookings, bookings);
    },
    addBooking(booking) {
      const bookings = read(KEYS.bookings, []);
      bookings.push(booking);
      write(KEYS.bookings, bookings);
      return booking;
    },
    removeBooking(id) {
      const bookings = read(KEYS.bookings, []).filter(item => item.id !== id);
      write(KEYS.bookings, bookings);
    },
    getFeedback() {
      return read(KEYS.feedback, []);
    },
    saveFeedback(feedback) {
      write(KEYS.feedback, feedback);
    },
    addFeedback(item) {
      const feedback = read(KEYS.feedback, []);
      feedback.push(item);
      write(KEYS.feedback, feedback);
      return item;
    },
    updateFeedback(id, patch) {
      const feedback = read(KEYS.feedback, []).map(item => (
        item.id === id ? { ...item, ...patch } : item
      ));
      write(KEYS.feedback, feedback);
    },
    removeFeedback(id) {
      const feedback = read(KEYS.feedback, []).filter(item => item.id !== id);
      write(KEYS.feedback, feedback);
    },
    isAdminAuthed() {
      return read(KEYS.adminSession, false) === true;
    },
    setAdminAuthed(value) {
      write(KEYS.adminSession, Boolean(value));
    }
  };
})();

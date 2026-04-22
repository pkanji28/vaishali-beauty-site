(function () {
  const bookingsMount = document.getElementById("adminBookings");
  const feedbackMount = document.getElementById("adminFeedback");
  if (!bookingsMount || !feedbackMount) return;
  const bookings = JSON.parse(localStorage.getItem("vb_bookings_v31_safe") || "[]");
  const feedback = JSON.parse(localStorage.getItem("vb_feedback_v31_safe") || "[]");
  bookingsMount.innerHTML = bookings.length ? bookings.map(item => `
    <div class="admin-item">
      <strong>${item.name}</strong><br>
      ${item.date} at ${item.time}<br>
      ${item.services.map(s => s.name + (s.quantity > 1 ? " x " + s.quantity : "")).join(", ")}<br>
      Total: £${item.total}
    </div>`).join("") : '<div class="empty-note">No bookings yet.</div>';
  feedbackMount.innerHTML = feedback.length ? feedback.map(item => `
    <div class="admin-item">
      <strong>${item.name}</strong> — ${item.rating}/5<br>
      ${item.message}
    </div>`).join("") : '<div class="empty-note">No feedback yet.</div>';
})();
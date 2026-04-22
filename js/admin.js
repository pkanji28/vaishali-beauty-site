(function () {
  const loginPanel = document.getElementById("adminLoginPanel");
  if (!loginPanel) return;

  const pinInput = document.getElementById("adminPinInput");
  const loginBtn = document.getElementById("adminLoginBtn");
  const loginStatus = document.getElementById("adminLoginStatus");
  const adminContent = document.getElementById("adminContent");
  const logoutBtn = document.getElementById("adminLogoutBtn");
  const bookingList = document.getElementById("bookingList");
  const pendingFeedbackList = document.getElementById("pendingFeedbackList");
  const approvedFeedbackAdminList = document.getElementById("approvedFeedbackAdminList");

  function setStatus(text, kind) {
    loginStatus.textContent = text || "";
    loginStatus.className = `status-message ${kind || ""}`.trim();
  }

  function bookingHtml(item) {
    return `
      <article class="admin-card">
        <div class="admin-card-head">
          <strong>${item.name}</strong>
          <button class="btn btn-secondary small-btn" data-remove-booking="${item.id}" type="button">Delete</button>
        </div>
        <p><strong>Phone:</strong> ${item.phone}</p>
        <p><strong>Date:</strong> ${item.date}</p>
        <p><strong>Time:</strong> ${item.time}</p>
        <p><strong>Services:</strong> ${item.services.map(service => `${service.name}${service.quantity > 1 ? ` × ${service.quantity}` : ""}`).join(", ")}</p>
        <p><strong>Total:</strong> £${item.total}</p>
        ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ""}
      </article>
    `;
  }

  function feedbackHtml(item, pending) {
    return `
      <article class="admin-card">
        <div class="admin-card-head">
          <strong>${item.name}</strong>
          <div class="mini-actions">
            ${pending ? `<button class="btn btn-primary small-btn" data-approve-feedback="${item.id}" type="button">Approve</button>` : ""}
            <button class="btn btn-secondary small-btn" data-remove-feedback="${item.id}" type="button">Delete</button>
          </div>
        </div>
        <p><strong>Rating:</strong> ${item.rating} / 5</p>
        <p>${item.text}</p>
      </article>
    `;
  }

  function renderAdmin() {
    const bookings = window.VBStorage.getBookings();
    const feedback = window.VBStorage.getFeedback();
    const pending = feedback.filter(item => !item.approved);
    const approved = feedback.filter(item => item.approved);

    bookingList.innerHTML = bookings.length
      ? bookings.map(bookingHtml).join("")
      : '<p class="empty-summary">No saved bookings yet.</p>';

    pendingFeedbackList.innerHTML = pending.length
      ? pending.map(item => feedbackHtml(item, true)).join("")
      : '<p class="empty-summary">No pending feedback.</p>';

    approvedFeedbackAdminList.innerHTML = approved.length
      ? approved.map(item => feedbackHtml(item, false)).join("")
      : '<p class="empty-summary">No approved feedback yet.</p>';
  }

  function updateView() {
    const authed = window.VBStorage.isAdminAuthed();
    loginPanel.classList.toggle("hidden", authed);
    adminContent.classList.toggle("hidden", !authed);
    if (authed) renderAdmin();
  }

  loginBtn.addEventListener("click", () => {
    if (pinInput.value === window.VB_ADMIN_PIN) {
      window.VBStorage.setAdminAuthed(true);
      pinInput.value = "";
      setStatus("", "");
      updateView();
    } else {
      setStatus("Incorrect PIN.", "error");
    }
  });

  logoutBtn.addEventListener("click", () => {
    window.VBStorage.setAdminAuthed(false);
    updateView();
  });

  document.addEventListener("click", event => {
    const removeBookingId = event.target.getAttribute("data-remove-booking");
    if (removeBookingId) {
      window.VBStorage.removeBooking(removeBookingId);
      renderAdmin();
      return;
    }

    const approveFeedbackId = event.target.getAttribute("data-approve-feedback");
    if (approveFeedbackId) {
      window.VBStorage.updateFeedback(approveFeedbackId, { approved: true });
      renderAdmin();
      return;
    }

    const removeFeedbackId = event.target.getAttribute("data-remove-feedback");
    if (removeFeedbackId) {
      window.VBStorage.removeFeedback(removeFeedbackId);
      renderAdmin();
    }
  });

  updateView();
})();

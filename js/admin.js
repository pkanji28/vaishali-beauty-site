(function () {
  const adminPin = (window.VB_CONFIG && window.VB_CONFIG.adminPin) || "1234";
  const adminContent = document.getElementById("adminContent");
  const adminPinInput = document.getElementById("adminPinInput");
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  const adminLoginMessage = document.getElementById("adminLoginMessage");
  const adminBookingsList = document.getElementById("adminBookingsList");
  const adminFeedbackList = document.getElementById("adminFeedbackList");
  const galleryTitle = document.getElementById("galleryTitle");
  const galleryFile = document.getElementById("galleryFile");
  const saveGalleryBtn = document.getElementById("saveGalleryBtn");
  const galleryMessage = document.getElementById("galleryMessage");
  const galleryGrid = document.getElementById("galleryGrid");

  function updateAccess() {
    const loggedIn = VBStore.isAdminLoggedIn();
    adminContent.classList.toggle("hidden", !loggedIn);
    adminLogoutBtn.classList.toggle("hidden", !loggedIn);
    adminLoginBtn.classList.toggle("hidden", loggedIn);
    adminPinInput.classList.toggle("hidden", loggedIn);
  }

  function renderBookings() {
    const items = VBStore.getBookings();
    if (!items.length) {
      adminBookingsList.innerHTML = '<div class="admin-item"><strong>No bookings yet.</strong></div>';
      return;
    }
    adminBookingsList.innerHTML = items.map(item => `
      <article class="admin-item">
        <strong>${item.customerName}</strong>
        <div>${item.date} at ${item.time}</div>
        <div>${item.customerPhone}</div>
        <div>Total: £${item.total}</div>
        <small>${item.services.map(s => `${s.name} × ${s.quantity}`).join(", ")}</small>
        <small>Notes: ${item.notes || "None"}</small>
        <div class="button-row"><button class="btn btn-secondary delete-booking" data-id="${item.id}">Delete</button></div>
      </article>
    `).join("");

    document.querySelectorAll(".delete-booking").forEach(btn => {
      btn.addEventListener("click", () => {
        VBStore.saveBookings(VBStore.getBookings().filter(item => item.id !== btn.dataset.id));
        renderBookings();
      });
    });
  }

  function renderFeedback() {
    const items = VBStore.getFeedback();
    if (!items.length) {
      adminFeedbackList.innerHTML = '<div class="admin-item"><strong>No feedback yet.</strong></div>';
      return;
    }
    adminFeedbackList.innerHTML = items.map(item => `
      <article class="admin-item">
        <strong>${item.name}</strong>
        <div>${"★".repeat(Number(item.rating))}</div>
        <p>${item.text}</p>
        <small>${new Date(item.createdAt).toLocaleString()}</small>
        <div class="button-row">
          <button class="btn btn-secondary toggle-feedback" data-id="${item.id}">${item.approved ? "Unapprove" : "Approve"}</button>
          <button class="btn btn-secondary delete-feedback" data-id="${item.id}">Delete</button>
        </div>
      </article>
    `).join("");

    document.querySelectorAll(".toggle-feedback").forEach(btn => {
      btn.addEventListener("click", () => {
        const items = VBStore.getFeedback().map(item => item.id === btn.dataset.id ? { ...item, approved: !item.approved } : item);
        VBStore.saveFeedback(items);
        renderFeedback();
      });
    });
    document.querySelectorAll(".delete-feedback").forEach(btn => {
      btn.addEventListener("click", () => {
        VBStore.saveFeedback(VBStore.getFeedback().filter(item => item.id !== btn.dataset.id));
        renderFeedback();
      });
    });
  }

  function renderGallery() {
    const items = VBStore.getGallery();
    if (!items.length) {
      galleryGrid.innerHTML = '<div class="admin-item"><strong>No images uploaded yet.</strong></div>';
      return;
    }
    galleryGrid.innerHTML = items.map(item => `
      <div class="gallery-tile">
        <img src="${item.dataUrl}" alt="${item.title}">
        <div class="tile-body">
          <span>${item.title}</span>
          <button class="btn btn-secondary delete-gallery" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".delete-gallery").forEach(btn => {
      btn.addEventListener("click", () => {
        VBStore.saveGallery(VBStore.getGallery().filter(item => item.id !== btn.dataset.id));
        renderGallery();
      });
    });
  }

  adminLoginBtn?.addEventListener("click", () => {
    adminLoginMessage.textContent = "";
    adminLoginMessage.className = "status-message";
    if (adminPinInput.value === adminPin) {
      VBStore.setAdminSession(true);
      adminPinInput.value = "";
      updateAccess();
      renderBookings();
      renderFeedback();
      renderGallery();
    } else {
      adminLoginMessage.textContent = "Incorrect PIN.";
      adminLoginMessage.classList.add("error");
    }
  });

  adminLogoutBtn?.addEventListener("click", () => {
    VBStore.setAdminSession(false);
    updateAccess();
  });

  saveGalleryBtn?.addEventListener("click", () => {
    galleryMessage.textContent = "";
    galleryMessage.className = "status-message";
    const title = galleryTitle.value.trim();
    const file = galleryFile.files[0];
    if (!title || !file) {
      galleryMessage.textContent = "Please add a title and choose an image.";
      galleryMessage.classList.add("error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const items = VBStore.getGallery();
      items.unshift({ id: String(Date.now()), title, dataUrl: reader.result });
      VBStore.saveGallery(items);
      galleryTitle.value = "";
      galleryFile.value = "";
      galleryMessage.textContent = "Image saved.";
      galleryMessage.classList.add("success");
      renderGallery();
    };
    reader.readAsDataURL(file);
  });

  updateAccess();
  if (VBStore.isAdminLoggedIn()) {
    renderBookings();
    renderFeedback();
    renderGallery();
  }
})();
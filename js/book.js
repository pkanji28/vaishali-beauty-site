
(function () {
  const services = window.VB_SERVICES || [];
  const timeSlots = window.VB_TIME_SLOTS || [];
  const whatsappNumber = (window.VB_CONFIG && window.VB_CONFIG.whatsappNumber) || "";

  const servicesList = document.getElementById("servicesList");
  const bookingTotal = document.getElementById("bookingTotal");
  const summaryTotal = document.getElementById("summaryTotal");
  const selectedServicesSummary = document.getElementById("selectedServicesSummary");
  const dateTimeSummary = document.getElementById("dateTimeSummary");
  const availabilitySummary = document.getElementById("availabilitySummary");
  const bookingDate = document.getElementById("bookingDate");
  const bookingTime = document.getElementById("bookingTime");
  const bookingForm = document.getElementById("bookingForm");
  const bookingMessage = document.getElementById("bookingMessage");
  const clearBookingBtn = document.getElementById("clearBookingBtn");

  const selectedQuantities = {};

  function setMinDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    bookingDate.min = `${yyyy}-${mm}-${dd}`;
  }

  function groupServices() {
    return services.reduce((acc, service) => {
      const category = service.category || "Services";
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {});
  }

  function renderServices() {
    if (!servicesList || !services.length) {
      servicesList.innerHTML = '<p class="muted">No services available.</p>';
      return;
    }

    const grouped = groupServices();

    servicesList.innerHTML = Object.entries(grouped).map(([category, items]) => `
      <section class="service-category">
        <h4 class="service-category-title">${category}</h4>
        <div class="service-picker">
          ${items.map(service => `
            <div class="service-option" data-id="${service.id}">
              <div class="service-option-main">
                <div class="service-option-icon">✦</div>

                <div class="service-option-row">
                  <div class="service-option-content">
                    <strong>${service.name}</strong>
                    <div class="small">£${service.price} each</div>
                  </div>

                  <div class="quantity-box">
                    <button type="button" class="qty-btn qty-minus" data-id="${service.id}">−</button>
                    <div class="qty-display" id="qty-${service.id}">${selectedQuantities[service.id] || 0}</div>
                    <button type="button" class="qty-btn qty-plus" data-id="${service.id}">+</button>
                  </div>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    `).join("");

    bindQuantityButtons();
  }

  function bindQuantityButtons() {
    document.querySelectorAll(".qty-plus").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        selectedQuantities[id] = (selectedQuantities[id] || 0) + 1;
        updateBookingUI();
      });
    });

    document.querySelectorAll(".qty-minus").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        selectedQuantities[id] = Math.max(0, (selectedQuantities[id] || 0) - 1);
        updateBookingUI();
      });
    });
  }

  function getSelectedItems() {
    return services
      .map(service => ({
        ...service,
        quantity: selectedQuantities[service.id] || 0
      }))
      .filter(item => item.quantity > 0);
  }

  function getTotal() {
    return getSelectedItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function updateServiceDisplays() {
    services.forEach(service => {
      const qtyEl = document.getElementById(`qty-${service.id}`);
      if (qtyEl) qtyEl.textContent = selectedQuantities[service.id] || 0;
    });
  }

  function updateSummary() {
    const items = getSelectedItems();
    const total = getTotal();

    bookingTotal.textContent = `£${total}`;
    summaryTotal.textContent = `£${total}`;

    if (!items.length) {
      selectedServicesSummary.innerHTML = '<div class="muted">No services selected yet.</div>';
    } else {
      selectedServicesSummary.innerHTML = items.map(item => `
        <div class="summary-row">
          <span>${item.name} × ${item.quantity}</span>
          <strong>£${item.price * item.quantity}</strong>
        </div>
      `).join("");
    }

    const date = bookingDate.value;
    const time = bookingTime.value;
    if (!date) {
      dateTimeSummary.textContent = "Choose a date first, then a time.";
    } else if (!time) {
      dateTimeSummary.textContent = `${date} — choose a time`;
    } else {
      dateTimeSummary.textContent = `${date} at ${time}`;
    }
  }

  function getBookingsForDate(date) {
    return VBStore.getBookings().filter(item => item.date === date);
  }

  function loadTimesForDate() {
    const date = bookingDate.value;
    bookingTime.innerHTML = '<option value="">Select a time</option>';

    if (!date) {
      availabilitySummary.textContent = "Select a date to load available times.";
      updateSummary();
      return;
    }

    const existing = getBookingsForDate(date);
    const taken = new Set(existing.map(item => item.time));
    const available = timeSlots.filter(slot => !taken.has(slot));

    available.forEach(slot => {
      const option = document.createElement("option");
      option.value = slot;
      option.textContent = slot;
      bookingTime.appendChild(option);
    });

    availabilitySummary.textContent = available.length
      ? "Available times loaded successfully."
      : "No times available for this date.";

    updateSummary();
  }

  function updateBookingUI() {
    updateServiceDisplays();
    updateSummary();
  }

  function clearForm() {
    services.forEach(service => { selectedQuantities[service.id] = 0; });
    bookingForm.reset();
    bookingTime.innerHTML = '<option value="">Select a time</option>';
    bookingMessage.textContent = "";
    bookingMessage.className = "status-message";
    updateBookingUI();
    availabilitySummary.textContent = "Select a date to load available times.";
  }

  function buildWhatsAppMessage(payload) {
    const serviceLines = payload.services.map(item => `• ${item.name} × ${item.quantity} — £${item.price * item.quantity}`).join("\n");
    return [
      "Hi Vaishali, I'd like to book an appointment.",
      "",
      serviceLines,
      "",
      `Date: ${payload.date}`,
      `Time: ${payload.time}`,
      `Total: £${payload.total}`,
      "",
      `Name: ${payload.customerName}`,
      `Phone: ${payload.customerPhone}`,
      `Notes: ${payload.notes || "None"}`,
      "",
      "Please confirm my appointment. Thank you!"
    ].join("\n");
  }

  bookingDate.addEventListener("change", loadTimesForDate);
  bookingTime.addEventListener("change", updateSummary);
  clearBookingBtn.addEventListener("click", clearForm);

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    bookingMessage.textContent = "";
    bookingMessage.className = "status-message";

    const selected = getSelectedItems();
    const total = getTotal();
    const customerName = document.getElementById("customerName").value.trim();
    const customerPhone = document.getElementById("customerPhone").value.trim();
    const date = bookingDate.value;
    const time = bookingTime.value;
    const notes = document.getElementById("bookingNotes").value.trim();

    if (!selected.length || !customerName || !customerPhone || !date || !time) {
      bookingMessage.textContent = "Please choose services and complete name, phone, date and time.";
      bookingMessage.classList.add("error");
      return;
    }

    const bookings = VBStore.getBookings();
    const collides = bookings.some(item => item.date === date && item.time === time);

    if (collides) {
      bookingMessage.textContent = "That time has already been booked. Please choose another slot.";
      bookingMessage.classList.add("error");
      loadTimesForDate();
      return;
    }

    const payload = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      customerName,
      customerPhone,
      date,
      time,
      notes,
      total,
      services: selected,
      createdAt: new Date().toISOString(),
      status: "pending"
    };

    bookings.push(payload);
    VBStore.saveBookings(bookings);

    bookingMessage.textContent = "Booking saved. Opening WhatsApp now.";
    bookingMessage.classList.add("success");

    loadTimesForDate();

    const text = encodeURIComponent(buildWhatsAppMessage(payload));
    const wa = `https://wa.me/${whatsappNumber}?text=${text}`;
    window.open(wa, "_blank");
  });

  setMinDate();
  renderServices();
  updateBookingUI();
})();

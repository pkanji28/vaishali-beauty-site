(function () {
  const servicesRoot = document.getElementById("service-sections");
  if (!servicesRoot) return;

  const state = {
    name: "",
    phone: "",
    date: "",
    time: "",
    notes: "",
    quantities: {}
  };

  const totalAmount = document.getElementById("totalAmount");
  const summaryTotal = document.getElementById("summaryTotal");
  const selectedServicesSummary = document.getElementById("selectedServicesSummary");
  const dateTimeSummary = document.getElementById("dateTimeSummary");
  const availabilitySummary = document.getElementById("availabilitySummary");
  const statusMessage = document.getElementById("statusMessage");
  const dateSelect = document.getElementById("dateSelect");
  const timeSelect = document.getElementById("timeSelect");
  const nameInput = document.getElementById("nameInput");
  const phoneInput = document.getElementById("phoneInput");
  const notesInput = document.getElementById("notesInput");
  const clearBtn = document.getElementById("clearBookingBtn");
  const saveBtn = document.getElementById("saveBookingBtn");

  function currency(amount) {
    return `£${amount}`;
  }

  function getAllServices() {
    return window.VB_SERVICE_CATEGORIES.flatMap(category => category.services);
  }

  function getSelectedServices() {
    return getAllServices()
      .map(service => ({ ...service, quantity: state.quantities[service.id] || 0 }))
      .filter(service => service.quantity > 0);
  }

  function getTotal() {
    return getSelectedServices().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function formatDateForDisplay(value) {
    if (!value) return "Choose a date and time.";
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function formatDateForWhatsApp(value) {
    return formatDateForDisplay(value);
  }

  function setStatus(text, kind) {
    statusMessage.textContent = text || "";
    statusMessage.className = `status-message ${kind || ""}`.trim();
  }

  function renderDateOptions() {
    const today = new Date();
    const options = ['<option value="">Select a date</option>'];

    for (let i = 0; i < 21; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const value = date.toISOString().slice(0, 10);
      options.push(`<option value="${value}">${date.toLocaleDateString("en-GB")}</option>`);
    }

    dateSelect.innerHTML = options.join("");
  }

  function refreshAvailableTimes() {
    const existing = window.VBStorage.getBookings();
    const bookedForDate = new Set(
      existing
        .filter(item => item.date === state.date)
        .map(item => item.time)
    );

    const options = ['<option value="">Select a time</option>'];
    window.VB_TIME_SLOTS.forEach(slot => {
      const disabled = bookedForDate.has(slot) ? ' disabled' : '';
      const label = bookedForDate.has(slot) ? `${slot} (Booked)` : slot;
      options.push(`<option value="${slot}"${disabled}>${label}</option>`);
    });

    timeSelect.innerHTML = options.join("");
    if (!state.date) {
      availabilitySummary.textContent = "Select a date to load available times.";
    } else {
      availabilitySummary.textContent = "Available times loaded successfully.";
    }
  }

  function renderServices() {
    servicesRoot.innerHTML = window.VB_SERVICE_CATEGORIES.map(category => `
      <section class="service-section">
        <h4 class="service-category-title">${category.title}</h4>
        <div class="service-list">
          ${category.services.map(service => {
            const qty = state.quantities[service.id] || 0;
            return `
              <article class="service-item-card">
                <div class="service-item-main">
                  <div class="service-item-icon">✦</div>
                  <div class="service-item-copy">
                    <h5>${service.name}</h5>
                    <p>${currency(service.price)} each</p>
                    <div class="quantity-inline" aria-label="Adjust quantity for ${service.name}">
                      <button type="button" class="qty-btn" data-action="decrease" data-id="${service.id}">−</button>
                      <span class="qty-value">${qty}</span>
                      <button type="button" class="qty-btn" data-action="increase" data-id="${service.id}">+</button>
                    </div>
                  </div>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `).join("");
  }

  function renderSummary() {
    const selected = getSelectedServices();
    const total = getTotal();

    totalAmount.textContent = currency(total);
    summaryTotal.textContent = currency(total);

    if (!selected.length) {
      selectedServicesSummary.innerHTML = '<p class="empty-summary">No services selected yet.</p>';
    } else {
      selectedServicesSummary.innerHTML = selected.map(item => `
        <div class="summary-line">
          <span>${item.name} × ${item.quantity}</span>
          <strong>${currency(item.price * item.quantity)}</strong>
        </div>
      `).join("");
    }

    if (state.date && state.time) {
      dateTimeSummary.textContent = `${formatDateForDisplay(state.date)} at ${state.time}`;
    } else if (state.date) {
      dateTimeSummary.textContent = `${formatDateForDisplay(state.date)} — choose a time`;
    } else {
      dateTimeSummary.textContent = "Choose a date and time.";
    }
  }

  function syncInputsToState() {
    state.name = nameInput.value;
    state.phone = phoneInput.value;
    state.notes = notesInput.value;
    state.date = dateSelect.value;
    state.time = timeSelect.value;
  }

  function validateBooking() {
    syncInputsToState();

    if (!getSelectedServices().length) return "Please select at least one service.";
    if (!state.name.trim()) return "Please enter your name.";
    if (!state.phone.trim()) return "Please enter your phone number.";
    if (!state.date) return "Please choose a date.";
    if (!state.time) return "Please choose a time.";
    return "";
  }

  function buildWhatsAppMessage() {
    const selected = getSelectedServices();
    const serviceLines = selected.map(item => `• ${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`);
    const notesLine = state.notes.trim() ? `📝 Notes: ${state.notes.trim()}` : "";

    return [
      "✨✨ Vaishali's Beauty Booking ✨✨",
      "",
      `👤 Name: ${state.name.trim()}`,
      `📞 Phone: ${state.phone.trim()}`,
      "",
      `📅 Date: ${formatDateForWhatsApp(state.date)}`,
      `⏰ Time: ${state.time}`,
      "",
      "💄 Services:",
      ...serviceLines,
      "",
      `💷 Total: ${currency(getTotal())}`,
      ...(notesLine ? ["", notesLine] : []),
      "",
      "Please confirm my appointment. Thank you 😊"
    ].join("\n");
  }

  function openWhatsApp() {
    const message = encodeURIComponent(buildWhatsAppMessage());
    const url = `https://wa.me/${window.VB_WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, "_blank");
  }

  function resetForm() {
    state.name = "";
    state.phone = "";
    state.date = "";
    state.time = "";
    state.notes = "";
    state.quantities = {};

    nameInput.value = "";
    phoneInput.value = "";
    notesInput.value = "";
    dateSelect.value = "";
    refreshAvailableTimes();
    timeSelect.value = "";
    setStatus("", "");
    renderServices();
    renderSummary();
  }

  function handleSaveBooking() {
    const error = validateBooking();
    if (error) {
      setStatus(error, "error");
      return;
    }

    const existing = window.VBStorage.getBookings();
    const clash = existing.find(item => item.date === state.date && item.time === state.time);
    if (clash) {
      setStatus("That time has already been booked. Please choose another time.", "error");
      refreshAvailableTimes();
      return;
    }

    const booking = {
      id: `booking_${Date.now()}`,
      name: state.name.trim(),
      phone: state.phone.trim(),
      date: state.date,
      time: state.time,
      notes: state.notes.trim(),
      services: getSelectedServices(),
      total: getTotal(),
      createdAt: new Date().toISOString()
    };

    window.VBStorage.addBooking(booking);
    setStatus("Booking saved. Opening WhatsApp now.", "success");
    refreshAvailableTimes();
    renderSummary();
    openWhatsApp();
  }

  servicesRoot.addEventListener("click", event => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;
    const current = state.quantities[id] || 0;

    if (action === "increase") {
      state.quantities[id] = current + 1;
    }

    if (action === "decrease") {
      state.quantities[id] = Math.max(0, current - 1);
    }

    renderServices();
    renderSummary();
  });

  [nameInput, phoneInput, notesInput].forEach(input => {
    input.addEventListener("input", () => {
      syncInputsToState();
      renderSummary();
    });
  });

  dateSelect.addEventListener("change", () => {
    syncInputsToState();
    state.time = "";
    refreshAvailableTimes();
    timeSelect.value = "";
    renderSummary();
  });

  timeSelect.addEventListener("change", () => {
    syncInputsToState();
    renderSummary();
  });

  clearBtn.addEventListener("click", resetForm);
  saveBtn.addEventListener("click", handleSaveBooking);

  renderDateOptions();
  refreshAvailableTimes();
  renderServices();
  renderSummary();
})();

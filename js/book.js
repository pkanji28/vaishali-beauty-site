(function () {
  const servicesData = window.VB_SERVICES || [];
  const whatsappNumber = (window.VB_CONFIG && window.VB_CONFIG.whatsappNumber) || "447000000000";
  const STORAGE_KEY = "vb_bookings_v31_safe";
  const APP_STATE_KEY = "vb_app_state_v31_safe";

  const servicesMount = document.getElementById("servicesMount");
  if (!servicesMount) return;

  const bookingTotal = document.getElementById("bookingTotal");
  const bookingForm = document.getElementById("bookingForm");
  const bookingStatus = document.getElementById("bookingStatus");
  const clearBooking = document.getElementById("clearBooking");
  const bookingDate = document.getElementById("bookingDate");
  const bookingTime = document.getElementById("bookingTime");
  const customerName = document.getElementById("customerName");
  const customerPhone = document.getElementById("customerPhone");
  const bookingNotes = document.getElementById("bookingNotes");

  const summaryServices = document.getElementById("summaryServices");
  const summaryDateTime = document.getElementById("summaryDateTime");
  const summaryAvailability = document.getElementById("summaryAvailability");
  const summaryTotal = document.getElementById("summaryTotal");

  const quantities = {};
  servicesData.forEach(group => group.items.forEach(item => quantities[item.id] = 0));

  function formatMoney(value) { return "£" + Number(value || 0); }

  function generateTimeSlots() {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      for (let minute = 0; minute <= 30; minute += 30) {
        if (hour === 21 && minute > 0) continue;
        const h12 = ((hour + 11) % 12) + 1;
        const ampm = hour < 12 ? "AM" : "PM";
        const mm = String(minute).padStart(2, "0");
        slots.push(`${h12}:${mm} ${ampm}`);
      }
    }
    return slots;
  }

  function formatDateForWhatsApp(dateValue) {
    if (!dateValue) return "";
    const d = new Date(dateValue + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }

  function getSelectedServices() {
    const selected = [];
    servicesData.forEach(group => group.items.forEach(item => {
      const qty = quantities[item.id] || 0;
      if (qty > 0) selected.push({ ...item, quantity: qty, lineTotal: qty * item.price });
    }));
    return selected;
  }

  function getTotal() { return getSelectedServices().reduce((sum, item) => sum + item.lineTotal, 0); }

  function getBookings() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch (e) { return []; }
  }

  function saveBookings(bookings) { localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings)); }

  function saveAppState() {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify({
      quantities, name: customerName.value, phone: customerPhone.value,
      date: bookingDate.value, time: bookingTime.value, notes: bookingNotes.value
    }));
  }

  function loadAppState() {
    try {
      const state = JSON.parse(localStorage.getItem(APP_STATE_KEY) || "{}");
      if (state.quantities) Object.keys(quantities).forEach(key => quantities[key] = Number(state.quantities[key] || 0));
      customerName.value = state.name || "";
      customerPhone.value = state.phone || "";
      bookingDate.value = state.date || "";
      bookingNotes.value = state.notes || "";
    } catch (e) {}
  }

  function setStatus(message, type) {
    bookingStatus.textContent = message || "";
    bookingStatus.className = "status-message";
    if (type) bookingStatus.classList.add("status-" + type);
  }

  function availableTimesForDate(date) {
    if (!date) return [];
    const allSlots = generateTimeSlots();
    const bookedTimes = getBookings().filter(booking => booking.date === date).map(booking => booking.time);
    return allSlots.filter(time => !bookedTimes.includes(time));
  }

  function refreshTimeOptions() {
    const current = bookingTime.value;
    const available = availableTimesForDate(bookingDate.value);
    bookingTime.innerHTML = '<option value="">Select a time</option>';
    available.forEach(time => {
      const option = document.createElement("option");
      option.value = time; option.textContent = time;
      if (time === current) option.selected = true;
      bookingTime.appendChild(option);
    });

    if (!bookingDate.value) summaryAvailability.textContent = "Choose a date first to load times.";
    else if (available.length) summaryAvailability.textContent = "Available times loaded successfully.";
    else summaryAvailability.textContent = "No available times found for this date.";
  }

  function renderServices() {
    servicesMount.innerHTML = "";
    servicesData.forEach(group => {
      const section = document.createElement("section");
      section.className = "service-category";
      section.innerHTML = `<h3>${group.category}</h3>`;
      const list = document.createElement("div");
      list.className = "service-list";

      group.items.forEach(item => {
        const qty = quantities[item.id] || 0;
        const card = document.createElement("div");
        card.className = "service-card";
        card.innerHTML = `
          <div class="service-card-main">
            <div class="service-icon">${group.icon || "✦"}</div>
            <div class="service-text">
              <div class="service-name">${item.name}</div>
              <div class="service-price">${formatMoney(item.price)} each</div>
            </div>
            <div class="service-controls">
              <button type="button" class="qty-btn minus" data-id="${item.id}" aria-label="Decrease ${item.name}">−</button>
              <div class="qty-value">${qty}</div>
              <button type="button" class="qty-btn plus" data-id="${item.id}" aria-label="Increase ${item.name}">+</button>
            </div>
          </div>`;
        list.appendChild(card);
      });

      section.appendChild(list);
      servicesMount.appendChild(section);
    });

    servicesMount.querySelectorAll(".qty-btn.plus").forEach(btn => btn.addEventListener("click", () => {
      quantities[btn.dataset.id] += 1; saveAppState(); renderServices(); renderSummary();
    }));
    servicesMount.querySelectorAll(".qty-btn.minus").forEach(btn => btn.addEventListener("click", () => {
      quantities[btn.dataset.id] = Math.max(0, quantities[btn.dataset.id] - 1); saveAppState(); renderServices(); renderSummary();
    }));
  }

  function renderSummary() {
    bookingTotal.textContent = formatMoney(getTotal());
    summaryTotal.textContent = formatMoney(getTotal());
    const selected = getSelectedServices();

    if (!selected.length) {
      summaryServices.className = "summary-list empty";
      summaryServices.textContent = "No services selected yet.";
    } else {
      summaryServices.className = "summary-list";
      summaryServices.innerHTML = selected.map(item => `
        <div class="summary-line">
          <span>${item.name} × ${item.quantity}</span>
          <strong>${formatMoney(item.lineTotal)}</strong>
        </div>`).join("");
    }

    if (bookingDate.value && bookingTime.value) summaryDateTime.textContent = `${formatDateForWhatsApp(bookingDate.value)} at ${bookingTime.value}`;
    else if (bookingDate.value) summaryDateTime.textContent = `${formatDateForWhatsApp(bookingDate.value)} — choose a time`;
    else summaryDateTime.textContent = "Choose a date and time.";
  }

  function buildWhatsAppMessage() {
    const selected = getSelectedServices();
    const serviceLines = selected.map(item => {
      const qtyText = item.quantity > 1 ? ` x ${item.quantity}` : "";
      return `• ${item.name}${qtyText}`;
    });
    const notesLine = bookingNotes.value.trim() ? `📝 Notes: ${bookingNotes.value.trim()}` : "";
    return [
      `✨✨ Vaishali's Beauty Booking ✨✨`, ``,
      `👤 Name: ${customerName.value.trim()}`,
      `📞 Phone: ${customerPhone.value.trim()}`, ``,
      `🗓️ Date: ${formatDateForWhatsApp(bookingDate.value)}`,
      `⏰ Time: ${bookingTime.value}`, ``,
      `💄 Services:`, ...serviceLines, ``,
      `💷 Total: ${formatMoney(getTotal())}`,
      ...(notesLine ? ["", notesLine] : []), ``,
      `Please confirm my appointment. Thank you! 😊`
    ].join("\n");
  }

  function validate() {
    if (!getSelectedServices().length) return "Please add at least one service.";
    if (!customerName.value.trim()) return "Please enter your name.";
    if (!customerPhone.value.trim()) return "Please enter your phone number.";
    if (!bookingDate.value) return "Please choose a date.";
    if (!bookingTime.value) return "Please choose a time.";
    return "";
  }

  function handleSubmit(event) {
    event.preventDefault();
    setStatus("", "");
    const error = validate();
    if (error) { setStatus(error, "error"); return; }

    const booking = {
      id: "b_" + Date.now(),
      name: customerName.value.trim(),
      phone: customerPhone.value.trim(),
      date: bookingDate.value,
      time: bookingTime.value,
      notes: bookingNotes.value.trim(),
      services: getSelectedServices(),
      total: getTotal(),
      createdAt: new Date().toISOString()
    };

    const bookings = getBookings();
    const clash = bookings.find(item => item.date === booking.date && item.time === booking.time);
    if (clash) {
      setStatus("That time has already been booked. Please choose another time.", "error");
      refreshTimeOptions();
      return;
    }

    bookings.push(booking);
    saveBookings(bookings);
    saveAppState();
    refreshTimeOptions();
    renderSummary();
    setStatus("Booking saved. Opening WhatsApp now.", "success");

    const url = `https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
    window.open(url, "_blank");
  }

  function clearForm() {
    Object.keys(quantities).forEach(key => quantities[key] = 0);
    customerName.value = ""; customerPhone.value = ""; bookingDate.value = "";
    bookingTime.innerHTML = '<option value="">Select a time</option>';
    bookingNotes.value = "";
    saveAppState(); renderServices(); renderSummary(); setStatus("", "");
    summaryAvailability.textContent = "Choose a date first to load times.";
  }

  function initDateMin() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    bookingDate.min = `${yyyy}-${mm}-${dd}`;
  }

  loadAppState();
  initDateMin();
  renderServices();
  refreshTimeOptions();
  renderSummary();

  bookingDate.addEventListener("change", () => { saveAppState(); refreshTimeOptions(); renderSummary(); setStatus("", ""); });
  bookingTime.addEventListener("change", () => { saveAppState(); renderSummary(); setStatus("", ""); });
  customerName.addEventListener("input", saveAppState);
  customerPhone.addEventListener("input", saveAppState);
  bookingNotes.addEventListener("input", saveAppState);
  bookingForm.addEventListener("submit", handleSubmit);
  clearBooking.addEventListener("click", clearForm);
})();
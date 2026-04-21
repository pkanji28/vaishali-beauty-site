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
    bookingDate.min = today.toISOString().split("T")[0];
  }

  function groupServices() {
    return services.reduce((acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    }, {});
  }

  function renderServices() {
    const grouped = groupServices();

    servicesList.innerHTML = Object.entries(grouped).map(([category, items]) => `
      <section class="service-category">
        <h4>${category}</h4>
        ${items.map(service => `
          <div class="service-option">
            <div>
              <strong>${service.name}</strong>
              <div>£${service.price}</div>
            </div>
            <div>
              <button class="qty-minus" data-id="${service.id}">−</button>
              <span id="qty-${service.id}">0</span>
              <button class="qty-plus" data-id="${service.id}">+</button>
            </div>
          </div>
        `).join("")}
      </section>
    `).join("");

    bindQtyButtons();
  }

  function bindQtyButtons() {
    document.querySelectorAll(".qty-plus").forEach(btn => {
      btn.onclick = () => {
        selectedQuantities[btn.dataset.id] = (selectedQuantities[btn.dataset.id] || 0) + 1;
        updateUI();
      };
    });

    document.querySelectorAll(".qty-minus").forEach(btn => {
      btn.onclick = () => {
        selectedQuantities[btn.dataset.id] = Math.max(0, (selectedQuantities[btn.dataset.id] || 0) - 1);
        updateUI();
      };
    });
  }

  function getSelected() {
    return services.map(s => ({
      ...s,
      quantity: selectedQuantities[s.id] || 0,
      lineTotal: (selectedQuantities[s.id] || 0) * s.price
    })).filter(s => s.quantity > 0);
  }

  function getTotal() {
    return getSelected().reduce((sum, s) => sum + s.lineTotal, 0);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function updateUI() {
    const items = getSelected();
    const total = getTotal();

    bookingTotal.textContent = `£${total}`;
    summaryTotal.textContent = `£${total}`;

    selectedServicesSummary.innerHTML = items.length
      ? items.map(i => `<div>${i.name} x ${i.quantity} — £${i.lineTotal}</div>`).join("")
      : "No services selected";

    dateTimeSummary.textContent = bookingDate.value
      ? (bookingTime.value ? `${bookingDate.value} at ${bookingTime.value}` : `${bookingDate.value} — choose time`)
      : "Choose a date first";

    services.forEach(s => {
      const el = document.getElementById(`qty-${s.id}`);
      if (el) el.textContent = selectedQuantities[s.id] || 0;
    });
  }

  function loadTimes() {
    const date = bookingDate.value;
    bookingTime.innerHTML = '<option value="">Select time</option>';

    if (!date) return;

    const taken = new Set(
      VBStore.getBookings()
        .filter(b => b.date === date)
        .map(b => b.time)
    );

    const available = timeSlots.filter(t => !taken.has(t));

    available.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      bookingTime.appendChild(opt);
    });

    availabilitySummary.textContent = available.length
      ? "Available times loaded successfully."
      : "No times available.";
  }

  // ✅ FINAL CLEAN WHATSAPP MESSAGE
  function buildWhatsAppMessage(data) {
    const serviceLines = data.services.map(s => {
      const qty = s.quantity > 1 ? ` x ${s.quantity}` : "";
      return `• ${s.name}${qty}`;
    }).join("\n");

    const notesSection = data.notes && data.notes.trim()
      ? `📝 Notes: ${data.notes.trim()}\n\n`
      : "";

    return `✨✨ Vaishali's Beauty Booking ✨✨

👤 Name: ${data.name}
📞 Phone: ${data.phone}

🗓️ Date: ${data.dateFormatted}
⏰ Time: ${data.time}

💄 Services:
${serviceLines}

💷 Total: £${data.total}

${notesSection}Please confirm my appointment. Thank you! 😊`;
  }

  bookingForm.addEventListener("submit", e => {
    e.preventDefault();

    const selected = getSelected();
    if (!selected.length) return;

    const name = document.getElementById("customerName").value;
    const phone = document.getElementById("customerPhone").value;
    const date = bookingDate.value;
    const time = bookingTime.value;
    const notes = document.getElementById("bookingNotes").value;

    const total = getTotal();

    const booking = {
      id: Date.now(),
      name,
      phone,
      date,
      time,
      notes,
      total,
      services: selected
    };

    const bookings = VBStore.getBookings();

    if (bookings.some(b => b.date === date && b.time === time)) {
      bookingMessage.textContent = "Time already booked.";
      return;
    }

    bookings.push(booking);
    VBStore.saveBookings(bookings);

    bookingMessage.textContent = "Booking saved. Opening WhatsApp...";

    const message = buildWhatsAppMessage({
      ...booking,
      dateFormatted: formatDate(date)
    });

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  });

  bookingDate.addEventListener("change", loadTimes);
  bookingTime.addEventListener("change", updateUI);
  clearBookingBtn.addEventListener("click", () => location.reload());

  setMinDate();
  renderServices();
  updateUI();
})();

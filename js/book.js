(function () {
  "use strict";

  const DEFAULT_SERVICES = [
    {
      category: "Threading",
      items: [
        { id: "eyebrow-threading", name: "Eyebrow Threading", price: 3 },
        { id: "upper-lip-threading", name: "Upper Lip Threading", price: 2 },
        { id: "full-face-threading", name: "Full Face Threading", price: 8 }
      ]
    },
    {
      category: "Waxing",
      items: [
        { id: "full-face-waxing", name: "Full Face Waxing", price: 12 },
        { id: "full-leg-waxing", name: "Full Leg Waxing", price: 18 },
        { id: "half-leg-waxing", name: "Half Leg Waxing", price: 9 },
        { id: "full-arm-waxing", name: "Full Arm Waxing", price: 10 },
        { id: "hollywood-waxing-strip", name: "Hollywood Waxing (Strip)", price: 18 },
        { id: "hollywood-waxing-hot-wax", name: "Hollywood Waxing (Hot Wax)", price: 25 }
      ]
    },
    {
      category: "Beauty & Care",
      items: [
        { id: "aroma-facial", name: "Aroma Facial", price: 35 },
        { id: "manicure", name: "Manicure", price: 15 },
        { id: "pedicure", name: "Pedicure", price: 25 },
        { id: "head-massage", name: "Head Massage", price: 15 },
        { id: "simple-hair-makeup", name: "Simple Hair & Makeup", price: 70 },
        { id: "mehndi-simple-line-one-hand-front", name: "Mehndi — Simple Line One Hand Front", price: 5 }
      ]
    }
  ];

  const APP_KEY = "vb_booking_state_v_locked";
  const BOOKINGS_KEY = "vb_bookings_local";
  const FEEDBACK_KEY = "vb_feedback_local";

  const servicesData = Array.isArray(window.VB_SERVICES) && window.VB_SERVICES.length
    ? window.VB_SERVICES
    : DEFAULT_SERVICES;

  const state = {
    quantities: {},
    name: "",
    phone: "",
    date: "",
    time: "",
    notes: "",
    availableTimes: []
  };

  function flattenServices(groups) {
    const list = [];
    groups.forEach((group) => {
      group.items.forEach((item) => {
        list.push({
          ...item,
          category: group.category
        });
      });
    });
    return list;
  }

  const allServices = flattenServices(servicesData);
  const servicesById = Object.fromEntries(allServices.map((item) => [item.id, item]));

  allServices.forEach((item) => {
    state.quantities[item.id] = 0;
  });

  function getEl(id) {
    return document.getElementById(id);
  }

  const els = {
    app: getEl("bookingApp"),
    servicesWrap: getEl("servicesWrap"),
    totalAmount: getEl("totalAmount"),
    customerName: getEl("customerName"),
    customerPhone: getEl("customerPhone"),
    bookingDate: getEl("bookingDate"),
    bookingTime: getEl("bookingTime"),
    bookingNotes: getEl("bookingNotes"),
    saveBtn: getEl("saveBookingBtn"),
    clearBtn: getEl("clearBookingBtn"),
    statusMessage: getEl("statusMessage"),

    summaryServices: getEl("summaryServices"),
    summaryDateTime: getEl("summaryDateTime"),
    summaryAvailability: getEl("summaryAvailability"),
    summaryTotal: getEl("summaryTotal")
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(APP_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (saved && typeof saved === "object") {
        if (saved.quantities && typeof saved.quantities === "object") {
          Object.keys(state.quantities).forEach((id) => {
            state.quantities[id] = Number(saved.quantities[id] || 0);
          });
        }
        state.name = saved.name || "";
        state.phone = saved.phone || "";
        state.date = saved.date || "";
        state.time = saved.time || "";
        state.notes = saved.notes || "";
      }
    } catch (error) {
      console.warn("Could not load booking state:", error);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(APP_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Could not save booking state:", error);
    }
  }

  function getSelectedServices() {
    return allServices
      .filter((item) => state.quantities[item.id] > 0)
      .map((item) => ({
        ...item,
        quantity: state.quantities[item.id],
        lineTotal: item.price * state.quantities[item.id]
      }));
  }

  function getTotal() {
    return getSelectedServices().reduce((sum, item) => sum + item.lineTotal, 0);
  }

  function formatMoney(value) {
    return `£${Number(value || 0)}`;
  }

  function formatDateForWhatsApp(dateValue) {
    if (!dateValue) return "";
    const d = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateValue;

    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function setStatus(message, type) {
    if (!els.statusMessage) return;
    els.statusMessage.textContent = message || "";
    els.statusMessage.className = "status-message";
    if (type) {
      els.statusMessage.classList.add(`status-${type}`);
    }
  }

  function renderServices() {
    if (!els.servicesWrap) return;

    els.servicesWrap.innerHTML = "";

    servicesData.forEach((group) => {
      const section = document.createElement("section");
      section.className = "service-category";

      const title = document.createElement("h3");
      title.className = "service-category-title";
      title.textContent = group.category;
      section.appendChild(title);

      const list = document.createElement("div");
      list.className = "service-grid";

      group.items.forEach((item) => {
        const qty = state.quantities[item.id] || 0;

        const card = document.createElement("div");
        card.className = "service-card";
        if (qty > 0) card.classList.add("is-selected");

        const content = document.createElement("div");
        content.className = "service-card-main";

        const textWrap = document.createElement("div");
        textWrap.className = "service-text";

        const name = document.createElement("div");
        name.className = "service-name";
        name.textContent = item.name;

        const price = document.createElement("div");
        price.className = "service-price";
        price.textContent = `${formatMoney(item.price)} each`;

        textWrap.appendChild(name);
        textWrap.appendChild(price);

        const controls = document.createElement("div");
        controls.className = "service-controls";

        const minusBtn = document.createElement("button");
        minusBtn.type = "button";
        minusBtn.className = "qty-btn qty-btn-minus";
        minusBtn.textContent = "−";
        minusBtn.setAttribute("aria-label", `Decrease ${item.name}`);
        minusBtn.addEventListener("click", () => {
          updateQuantity(item.id, -1);
        });

        const qtyValue = document.createElement("span");
        qtyValue.className = "qty-value";
        qtyValue.textContent = String(qty);

        const plusBtn = document.createElement("button");
        plusBtn.type = "button";
        plusBtn.className = "qty-btn qty-btn-plus";
        plusBtn.textContent = "+";
        plusBtn.setAttribute("aria-label", `Increase ${item.name}`);
        plusBtn.addEventListener("click", () => {
          updateQuantity(item.id, 1);
        });

        controls.appendChild(minusBtn);
        controls.appendChild(qtyValue);
        controls.appendChild(plusBtn);

        content.appendChild(textWrap);
        content.appendChild(controls);
        card.appendChild(content);
        list.appendChild(card);
      });

      section.appendChild(list);
      els.servicesWrap.appendChild(section);
    });
  }

  function updateQuantity(serviceId, delta) {
    const current = Number(state.quantities[serviceId] || 0);
    const next = Math.max(0, current + delta);
    state.quantities[serviceId] = next;

    saveState();
    renderServices();
    renderSummary();
    renderTotal();
    setStatus("", "");
  }

  function renderTotal() {
    if (els.totalAmount) {
      els.totalAmount.textContent = formatMoney(getTotal());
    }
  }

  function renderSummary() {
    const selected = getSelectedServices();

    if (els.summaryServices) {
      if (!selected.length) {
        els.summaryServices.innerHTML = `<p class="summary-empty">No services selected yet.</p>`;
      } else {
        els.summaryServices.innerHTML = selected
          .map((item) => {
            return `
              <div class="summary-line">
                <span>${escapeHtml(item.name)} × ${item.quantity}</span>
                <strong>${formatMoney(item.lineTotal)}</strong>
              </div>
            `;
          })
          .join("");
      }
    }

    if (els.summaryDateTime) {
      if (state.date && state.time) {
        els.summaryDateTime.textContent = `${state.date} at ${state.time}`;
      } else if (state.date) {
        els.summaryDateTime.textContent = `${state.date} — choose a time`;
      } else {
        els.summaryDateTime.textContent = "Choose a date and time.";
      }
    }

    if (els.summaryAvailability) {
      if (!state.date) {
        els.summaryAvailability.textContent = "Choose a date first to load times.";
      } else if (state.availableTimes.length) {
        els.summaryAvailability.textContent = "Available times loaded successfully.";
      } else {
        els.summaryAvailability.textContent = "No available times found for this date.";
      }
    }

    if (els.summaryTotal) {
      els.summaryTotal.textContent = formatMoney(getTotal());
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getDefaultTimes() {
    return [
      "09:00 AM",
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
      "01:00 PM",
      "01:30 PM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
      "04:30 PM",
      "05:00 PM",
      "05:30 PM",
      "06:00 PM",
      "06:30 PM",
      "07:00 PM",
      "07:30 PM",
      "08:00 PM",
      "08:30 PM",
      "09:00 PM",
    ];
  }

  function loadExistingBookings() {
    try {
      return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveBookings(list) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
  }

  function populateTimeOptions() {
    if (!els.bookingTime) return;

    const currentValue = state.time;
    els.bookingTime.innerHTML = `<option value="">Select a time</option>`;

    state.availableTimes.forEach((time) => {
      const option = document.createElement("option");
      option.value = time;
      option.textContent = time;
      if (time === currentValue) option.selected = true;
      els.bookingTime.appendChild(option);
    });
  }

  function refreshAvailableTimes() {
    if (!state.date) {
      state.availableTimes = [];
      state.time = "";
      populateTimeOptions();
      renderSummary();
      saveState();
      return;
    }

    const allTimes = getDefaultTimes();
    const existing = loadExistingBookings();
    const bookedTimes = existing
      .filter((booking) => booking.date === state.date)
      .map((booking) => booking.time);

    state.availableTimes = allTimes.filter((time) => !bookedTimes.includes(time));

    if (state.time && !state.availableTimes.includes(state.time)) {
      state.time = "";
    }

    populateTimeOptions();
    renderSummary();
    saveState();
  }

  function bindInputs() {
    if (els.customerName) {
      els.customerName.value = state.name;
      els.customerName.addEventListener("input", (event) => {
        state.name = event.target.value;
        saveState();
      });
    }

    if (els.customerPhone) {
      els.customerPhone.value = state.phone;
      els.customerPhone.addEventListener("input", (event) => {
        state.phone = event.target.value;
        saveState();
      });
    }

    if (els.bookingDate) {
      els.bookingDate.value = state.date;
      els.bookingDate.addEventListener("change", (event) => {
        state.date = event.target.value;
        refreshAvailableTimes();
        setStatus("", "");
      });
    }

    if (els.bookingTime) {
      els.bookingTime.addEventListener("change", (event) => {
        state.time = event.target.value;
        saveState();
        renderSummary();
        setStatus("", "");
      });
    }

    if (els.bookingNotes) {
      els.bookingNotes.value = state.notes;
      els.bookingNotes.addEventListener("input", (event) => {
        state.notes = event.target.value;
        saveState();
      });
    }

    if (els.clearBtn) {
      els.clearBtn.addEventListener("click", clearBookingForm);
    }

    if (els.saveBtn) {
      els.saveBtn.addEventListener("click", handleSaveBooking);
    }
  }

  function clearBookingForm() {
    allServices.forEach((item) => {
      state.quantities[item.id] = 0;
    });

    state.name = "";
    state.phone = "";
    state.date = "";
    state.time = "";
    state.notes = "";
    state.availableTimes = [];

    if (els.customerName) els.customerName.value = "";
    if (els.customerPhone) els.customerPhone.value = "";
    if (els.bookingDate) els.bookingDate.value = "";
    if (els.bookingNotes) els.bookingNotes.value = "";

    populateTimeOptions();
    saveState();
    renderServices();
    renderSummary();
    renderTotal();
    setStatus("", "");
  }

  function validateBooking() {
    const selected = getSelectedServices();

    if (!selected.length) {
      return "Please add at least one service.";
    }
    if (!state.name.trim()) {
      return "Please enter your name.";
    }
    if (!state.phone.trim()) {
      return "Please enter your phone number.";
    }
    if (!state.date) {
      return "Please choose a date.";
    }
    if (!state.time) {
      return "Please choose a time.";
    }

    return "";
  }

  function buildWhatsAppMessage() {
    const selected = getSelectedServices();
    const serviceLines = selected.map((item) => {
      const qtyText = item.quantity > 1 ? ` × ${item.quantity}` : "";
      return `• ${item.name}${qtyText}`;
    });

    const notesLine = state.notes.trim()
      ? `📝 Notes: ${state.notes.trim()}`
      : "";

    return [
      `✨✨ Vaishali's Beauty Booking ✨✨`,
      ``,
      `👤 Name: ${state.name.trim()}`,
      `📞 Phone: ${state.phone.trim()}`,
      ``,
      `🗓️ Date: ${formatDateForWhatsApp(state.date)}`,
      `⏰ Time: ${state.time}`,
      ``,
      `💄 Services:`,
      ...serviceLines,
      ``,
      `💷 Total: ${formatMoney(getTotal())}`,
      ...(notesLine ? ["", notesLine] : []),
      ``,
      `Please confirm my appointment. Thank you 😊`
    ].join("\n");
  }

  async function handleSaveBooking() {
    const error = validateBooking();
    if (error) {
      setStatus(error, "error");
      return;
    }

    const existing = loadExistingBookings();

    const clash = existing.find((booking) => {
      return booking.date === state.date && booking.time === state.time;
    });

    if (clash) {
      setStatus("That time has already been booked. Please choose another time.", "error");
      refreshAvailableTimes();
      return;
    }

    const bookingPayload = {
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

    existing.push(bookingPayload);
    saveBookings(existing);

    saveState();
    refreshAvailableTimes();
    setStatus("Booking saved. Opening WhatsApp now.", "success");

    const whatsappMessage = buildWhatsAppMessage();
    const targetNumber = window.VB_WHATSAPP_NUMBER || state.phone.trim();
    const whatsappUrl = `https://wa.me/${String(targetNumber).replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;

    window.open(whatsappUrl, "_blank");
  }

  function initDateMin() {
    if (!els.bookingDate) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    els.bookingDate.min = `${yyyy}-${mm}-${dd}`;
  }

  function init() {
    loadState();
    initDateMin();
    bindInputs();
    renderServices();
    refreshAvailableTimes();
    renderSummary();
    renderTotal();

    if (els.customerName) els.customerName.value = state.name;
    if (els.customerPhone) els.customerPhone.value = state.phone;
    if (els.bookingDate) els.bookingDate.value = state.date;
    if (els.bookingNotes) els.bookingNotes.value = state.notes;
  }

  document.addEventListener("DOMContentLoaded", init);
})();

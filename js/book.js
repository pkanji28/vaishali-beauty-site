(function () {
  const servicesData = window.VB_SERVICES || [];
  const config = window.VB_CONFIG || {};
  const supabase = window.supabaseClient;

  const primaryNumber = config.primaryNumber || "447599693034";
  const fallbackNumber = config.fallbackNumber || "447951077118";

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
  const recipientChoice = document.getElementById("recipientChoice");

  const summaryServices = document.getElementById("summaryServices");
  const summaryDateTime = document.getElementById("summaryDateTime");
  const summaryAvailability = document.getElementById("summaryAvailability");
  const summaryTotal = document.getElementById("summaryTotal");

  const quantities = {};
  servicesData.forEach(group => {
    group.items.forEach(item => {
      quantities[item.id] = 0;
    });
  });

  function formatMoney(value) {
    return "£" + Number(value || 0);
  }

  function getSelectedRecipientNumber() {
    return recipientChoice && recipientChoice.value === "fallback"
      ? fallbackNumber
      : primaryNumber;
  }

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

  function formatDateForDisplay(dateValue) {
    if (!dateValue) return "";
    const d = new Date(dateValue + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function getSelectedServices() {
    const selected = [];

    servicesData.forEach(group => {
      group.items.forEach(item => {
        const qty = quantities[item.id] || 0;

        if (qty > 0) {
          selected.push({
            ...item,
            quantity: qty,
            lineTotal: qty * item.price
          });
        }
      });
    });

    return selected;
  }

  function getTotal() {
    return getSelectedServices().reduce((sum, item) => sum + item.lineTotal, 0);
  }

  async function availableTimesForDate(date) {
    if (!date) return [];

    const allSlots = generateTimeSlots();

    if (!supabase) {
      return allSlots;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", date);

    if (error) {
      console.error("Error loading booked times:", error);
      return allSlots;
    }

    const bookedTimes = (data || []).map(item => item.booking_time);

    return allSlots.filter(time => !bookedTimes.includes(time));
  }

  async function refreshTimeOptions() {
    const current = bookingTime.value;
    const available = await availableTimesForDate(bookingDate.value);

    bookingTime.innerHTML = '<option value="">Select a time</option>';

    available.forEach(time => {
      const opt = document.createElement("option");
      opt.value = time;
      opt.textContent = time;

      if (time === current) {
        opt.selected = true;
      }

      bookingTime.appendChild(opt);
    });

    if (!bookingDate.value) {
      summaryAvailability.textContent = "Choose a date first to load times.";
    } else if (available.length) {
      summaryAvailability.textContent = "Available times loaded successfully.";
    } else {
      summaryAvailability.textContent = "Fully booked for this date.";
    }
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
          </div>
        `;

        list.appendChild(card);
      });

      section.appendChild(list);
      servicesMount.appendChild(section);
    });

    document.querySelectorAll(".plus").forEach(btn => {
      btn.onclick = () => {
        quantities[btn.dataset.id] += 1;
        renderServices();
        renderSummary();
      };
    });

    document.querySelectorAll(".minus").forEach(btn => {
      btn.onclick = () => {
        quantities[btn.dataset.id] = Math.max(0, quantities[btn.dataset.id] - 1);
        renderServices();
        renderSummary();
      };
    });
  }

  function renderSummary() {
    bookingTotal.textContent = formatMoney(getTotal());
    summaryTotal.textContent = formatMoney(getTotal());

    const selected = getSelectedServices();

    if (!selected.length) {
      summaryServices.innerHTML = "No services selected yet.";
    } else {
      summaryServices.innerHTML = selected.map(item => `
        <div class="summary-line">
          <span>${item.name} × ${item.quantity}</span>
          <strong>${formatMoney(item.lineTotal)}</strong>
        </div>
      `).join("");
    }

    if (bookingDate.value && bookingTime.value) {
      summaryDateTime.textContent = `${formatDateForDisplay(bookingDate.value)} at ${bookingTime.value}`;
    } else if (bookingDate.value) {
      summaryDateTime.textContent = `${formatDateForDisplay(bookingDate.value)} — choose a time`;
    } else {
      summaryDateTime.textContent = "Choose a date and time.";
    }
  }

  function validate() {
    if (!getSelectedServices().length) return "Select at least one service.";
    if (!customerName.value.trim()) return "Enter name.";
    if (!customerPhone.value.trim()) return "Enter phone.";
    if (!bookingDate.value) return "Select date.";
    if (!bookingTime.value) return "Select time.";
    return "";
  }

  function buildWhatsAppMessage() {
    const selected = getSelectedServices();

    const serviceLines = selected.map(item => {
      const qtyText = item.quantity > 1 ? ` x ${item.quantity}` : "";
      return `• ${item.name}${qtyText}`;
    });

    const notesLine = bookingNotes.value.trim()
      ? `📝 Notes: ${bookingNotes.value.trim()}`
      : "";

    return [
      `✨✨ Vaishali's Beauty Booking ✨✨`,
      ``,
      `👤 Name: ${customerName.value.trim()}`,
      `📞 Phone: ${customerPhone.value.trim()}`,
      ``,
      `🗓️ Date: ${formatDateForDisplay(bookingDate.value)}`,
      `⏰ Time: ${bookingTime.value}`,
      ``,
      `💄 Services:`,
      ...serviceLines,
      ``,
      `💷 Total: ${formatMoney(getTotal())}`,
      ...(notesLine ? ["", notesLine] : []),
      ``,
      `Please confirm my appointment. Thank you! 😊`
    ].join("\n");
  }

  function openWhatsApp(msg) {
    const num = getSelectedRecipientNumber();
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errorText = validate();
    if (errorText) {
      bookingStatus.textContent = errorText;
      bookingStatus.className = "status-message status-error";
      return;
    }

    const available = await availableTimesForDate(bookingDate.value);

    if (!available.includes(bookingTime.value)) {
      bookingStatus.textContent = "That time has already been booked. Please choose another time.";
      bookingStatus.className = "status-message status-error";
      await refreshTimeOptions();
      return;
    }

    if (!supabase) {
      bookingStatus.textContent = "Supabase is not connected.";
      bookingStatus.className = "status-message status-error";
      return;
    }

    const payload = {
      customer_name: customerName.value.trim(),
      customer_phone: customerPhone.value.trim(),
      booking_date: bookingDate.value,
      booking_time: bookingTime.value,
      notes: bookingNotes.value.trim(),
      recipient: recipientChoice ? recipientChoice.value : "primary",
      services_json: getSelectedServices(),
      total_amount: getTotal(),
      status: "pending"
    };

    const { error: insertError } = await supabase
      .from("bookings")
      .insert([payload]);

    if (insertError) {
      console.error(insertError);
      bookingStatus.textContent = "Error saving booking.";
      bookingStatus.className = "status-message status-error";
      return;
    }

    bookingStatus.textContent = "Booking saved. Opening WhatsApp now.";
    bookingStatus.className = "status-message status-success";

    openWhatsApp(buildWhatsAppMessage());
    await refreshTimeOptions();
  }

  bookingDate.addEventListener("change", async () => {
    await refreshTimeOptions();
    renderSummary();
  });

  bookingTime.addEventListener("change", renderSummary);

  bookingForm.addEventListener("submit", handleSubmit);

  if (clearBooking) {
    clearBooking.addEventListener("click", () => {
      Object.keys(quantities).forEach(key => {
        quantities[key] = 0;
      });

      customerName.value = "";
      customerPhone.value = "";
      bookingDate.value = "";
      bookingTime.innerHTML = '<option value="">Select a time</option>';
      bookingNotes.value = "";
      if (recipientChoice) recipientChoice.value = "primary";

      summaryAvailability.textContent = "Choose a date first to load times.";
      bookingStatus.textContent = "";
      bookingStatus.className = "status-message";

      renderServices();
      renderSummary();
    });
  }

  renderServices();
  renderSummary();
})();

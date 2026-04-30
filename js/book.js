(function () {
  const servicesData = window.VB_SERVICES || [];
  const primaryNumber   = "447599693034";
  const fallbackNumber  = "447951077118";
  const supabase        = window.supabaseClient;

  /* ── DOM refs ─────────────────────────────────────────── */
  const servicesMount       = document.getElementById("servicesMount");
  if (!servicesMount) return;

  const bookingTotal        = document.getElementById("bookingTotal");
  const bookingForm         = document.getElementById("bookingForm");
  const bookingStatus       = document.getElementById("bookingStatus");
  const clearBooking        = document.getElementById("clearBooking");
  const bookingDate         = document.getElementById("bookingDate");
  const bookingTime         = document.getElementById("bookingTime");
  const customerName        = document.getElementById("customerName");
  const customerPhone       = document.getElementById("customerPhone");
  const bookingNotes        = document.getElementById("bookingNotes");
  const recipientChoice     = document.getElementById("recipientChoice");

  const summaryServices     = document.getElementById("summaryServices");
  const summaryDateTime     = document.getElementById("summaryDateTime");
  const summaryAvailability = document.getElementById("summaryAvailability");
  const summaryTotal        = document.getElementById("summaryTotal");
  const summaryDuration     = document.getElementById("summaryDuration");

  /* ── State ─────────────────────────────────────────────── */
  const quantities = {};
  servicesData.forEach(group => group.items.forEach(item => {
    quantities[item.id] = 0;
  }));

  /* ── Helpers ───────────────────────────────────────────── */
  function formatMoney(v) { return "£" + Number(v || 0); }

  function formatDuration(mins) {
    if (!mins) return "";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} hr ${m} min` : `${h} hr`;
  }

  function timeToMinutes(timeStr) {
    // "9:00 AM" / "1:30 PM"
    const [time, period] = timeStr.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }

  function minutesToTime(mins) {
    const h24  = Math.floor(mins / 60);
    const m    = mins % 60;
    const h12  = ((h24 + 11) % 12) + 1;
    const ampm = h24 < 12 ? "AM" : "PM";
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  function getRecipientNumber() {
    return recipientChoice && recipientChoice.value === "fallback"
      ? fallbackNumber : primaryNumber;
  }

  function generateAllSlots() {
    const slots = [];
    for (let h = 8; h <= 21; h++) {
      for (let m = 0; m <= 30; m += 30) {
        if (h === 21 && m > 0) continue;
        slots.push(minutesToTime(h * 60 + m));
      }
    }
    return slots;
  }

  function formatDateForDisplay(dateValue) {
    if (!dateValue) return "";
    const d = new Date(dateValue + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }

  /* ── Service selection ─────────────────────────────────── */
  function getSelectedServices() {
    const out = [];
    servicesData.forEach(group => {
      group.items.forEach(item => {
        const qty = quantities[item.id] || 0;
        if (qty > 0) out.push({
          ...item,
          quantity: qty,
          lineTotal:    qty * item.price,
          lineDuration: qty * item.duration
        });
      });
    });
    return out;
  }

  function getTotal()         { return getSelectedServices().reduce((s, i) => s + i.lineTotal, 0); }
  function getTotalDuration() { return getSelectedServices().reduce((s, i) => s + i.lineDuration, 0); }

  /* ── Availability — duration-aware ────────────────────── */
  async function availableTimesForDate(date) {
    if (!date) return [];
    const allSlots       = generateAllSlots();
    const newDuration    = getTotalDuration() || 30; // fallback 30 min

    if (!supabase) return allSlots;

    const { data, error } = await supabase
      .from("bookings")
      .select("booking_time, duration")
      .eq("booking_date", date)
      .neq("status", "cancelled");

    if (error) { console.error(error); return allSlots; }

    const bookedBlocks = (data || []).map(b => ({
      start: timeToMinutes(b.booking_time),
      end:   timeToMinutes(b.booking_time) + (b.duration || 30)
    }));

    return allSlots.filter(slot => {
      const slotStart = timeToMinutes(slot);
      const slotEnd   = slotStart + newDuration;
      // Slot is free if it doesn't overlap any existing booking
      return !bookedBlocks.some(b =>
        slotStart < b.end && slotEnd > b.start
      );
    });
  }

  async function refreshTimeOptions() {
    const current   = bookingTime.value;
    const available = await availableTimesForDate(bookingDate.value);

    bookingTime.innerHTML = '<option value="">Select a time</option>';
    available.forEach(time => {
      const opt = document.createElement("option");
      opt.value = time;
      opt.textContent = time;
      if (time === current) opt.selected = true;
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

  /* ── Render service cards ──────────────────────────────── */
  function renderServices() {
    servicesMount.innerHTML = "";

    servicesData.forEach(group => {
      const section = document.createElement("section");
      section.className = "service-category";
      section.innerHTML = `<h3>${group.category}</h3>`;

      const list = document.createElement("div");
      list.className = "service-list";

      group.items.forEach(item => {
        const qty          = quantities[item.id] || 0;
        const durationLabel = item.durationNote
          ? item.durationNote
          : formatDuration(item.duration);

        const card = document.createElement("div");
        card.className = "service-card";
        card.innerHTML = `
          <div class="service-card-main">
            <div class="service-icon">${group.icon || "✦"}</div>
            <div class="service-text">
              <div class="service-name">${item.name}</div>
              <div class="service-price">${formatMoney(item.price)} &nbsp;·&nbsp; <span class="service-duration">⏱ ${durationLabel}</span></div>
            </div>
            <div class="service-controls">
              <button type="button" class="qty-btn minus" data-id="${item.id}" aria-label="Decrease ${item.name}">−</button>
              <div class="qty-value">${qty}</div>
              <button type="button" class="qty-btn plus"  data-id="${item.id}" aria-label="Increase ${item.name}">+</button>
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
        if (bookingDate.value) refreshTimeOptions();
      };
    });

    document.querySelectorAll(".minus").forEach(btn => {
      btn.onclick = () => {
        quantities[btn.dataset.id] = Math.max(0, quantities[btn.dataset.id] - 1);
        renderServices();
        renderSummary();
        if (bookingDate.value) refreshTimeOptions();
      };
    });
  }

  /* ── Render summary panel ──────────────────────────────── */
  function renderSummary() {
    const total    = getTotal();
    const duration = getTotalDuration();
    const selected = getSelectedServices();

    bookingTotal.textContent = formatMoney(total);
    summaryTotal.textContent = formatMoney(total);

    if (summaryDuration) {
      summaryDuration.textContent = duration
        ? `Estimated appointment time: ${formatDuration(duration)}`
        : "Select services to see duration.";
    }

    if (!selected.length) {
      summaryServices.innerHTML = "No services selected yet.";
    } else {
      summaryServices.innerHTML = selected.map(item => `
        <div class="summary-line">
          <span>${item.name}${item.quantity > 1 ? " × " + item.quantity : ""} <small style="color:var(--muted)">⏱ ${item.durationNote || formatDuration(item.lineDuration)}</small></span>
          <strong>${formatMoney(item.lineTotal)}</strong>
        </div>
      `).join("") + `
        <div class="summary-line" style="border-top:2px solid var(--border);margin-top:8px;padding-top:12px">
          <span style="font-weight:800">Total duration</span>
          <strong style="color:var(--gold-deep)">${formatDuration(duration)}</strong>
        </div>
      `;
    }

    if (bookingDate.value && bookingTime.value) {
      summaryDateTime.textContent = `${formatDateForDisplay(bookingDate.value)} at ${bookingTime.value}`;
    } else if (bookingDate.value) {
      summaryDateTime.textContent = `${formatDateForDisplay(bookingDate.value)} — choose a time`;
    } else {
      summaryDateTime.textContent = "Choose a date and time.";
    }
  }

  /* ── Validation ────────────────────────────────────────── */
  function validate() {
    if (!getSelectedServices().length) return "Select at least one service.";
    if (!customerName.value.trim())    return "Enter your name.";
    if (!customerPhone.value.trim())   return "Enter your phone number.";
    if (!bookingDate.value)            return "Select a date.";
    if (!bookingTime.value)            return "Select a time.";
    return "";
  }

  /* ── WhatsApp message ──────────────────────────────────── */
  function buildWhatsAppMessage() {
    const selected = getSelectedServices();
    const serviceLines = selected.map(item => {
      const qtyText  = item.quantity > 1 ? ` x ${item.quantity}` : "";
      const durText  = item.durationNote || formatDuration(item.lineDuration);
      return `• ${item.name}${qtyText} (${durText})`;
    });

    const totalDur  = getTotalDuration();
    const notesLine = bookingNotes.value.trim()
      ? `📝 Notes: ${bookingNotes.value.trim()}`
      : "";

    return [
      `✨ Vaishali's Beauty Booking ✨`,
      ``,
      `👤 Name: ${customerName.value.trim()}`,
      `📞 Phone: ${customerPhone.value.trim()}`,
      ``,
      `🗓️ Date: ${formatDateForDisplay(bookingDate.value)}`,
      `⏰ Time: ${bookingTime.value}`,
      `⏱️ Estimated duration: ${formatDuration(totalDur)}`,
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
    window.open(`https://wa.me/${getRecipientNumber()}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  /* ── Submit ────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();

    const errorText = validate();
    if (errorText) {
      bookingStatus.textContent = errorText;
      bookingStatus.className   = "status-message status-error";
      return;
    }

    const available = await availableTimesForDate(bookingDate.value);
    if (!available.includes(bookingTime.value)) {
      bookingStatus.textContent = "That time is no longer available. Please choose another.";
      bookingStatus.className   = "status-message status-error";
      await refreshTimeOptions();
      return;
    }

    if (!supabase) {
      bookingStatus.textContent = "Supabase is not connected.";
      bookingStatus.className   = "status-message status-error";
      return;
    }

    const selected    = getSelectedServices();
    const serviceText = selected
      .map(i => `${i.name}${i.quantity > 1 ? ` x ${i.quantity}` : ""}`)
      .join(", ");

    const { error: insertError } = await supabase
      .from("bookings")
      .insert([{
        customer_name:  customerName.value.trim(),
        customer_phone: customerPhone.value.trim(),
        service:        serviceText,
        total:          getTotal(),
        duration:       getTotalDuration(),
        booking_date:   bookingDate.value,
        booking_time:   bookingTime.value,
        status:         "pending"
      }]);

    if (insertError) {
      console.error(insertError);
      bookingStatus.textContent = `Error saving booking: ${insertError.message}`;
      bookingStatus.className   = "status-message status-error";
      return;
    }

    bookingStatus.textContent = "Booking saved. Opening WhatsApp now.";
    bookingStatus.className   = "status-message status-success";
    openWhatsApp(buildWhatsAppMessage());
    await refreshTimeOptions();
  }

  /* ── Event listeners ───────────────────────────────────── */
  bookingDate.addEventListener("change", async () => {
    await refreshTimeOptions();
    renderSummary();
  });

  bookingTime.addEventListener("change", renderSummary);
  bookingForm.addEventListener("submit", handleSubmit);

  if (clearBooking) {
    clearBooking.addEventListener("click", () => {
      Object.keys(quantities).forEach(k => quantities[k] = 0);
      customerName.value   = "";
      customerPhone.value  = "";
      bookingDate.value    = "";
      bookingTime.innerHTML = '<option value="">Select a time</option>';
      bookingNotes.value   = "";
      if (recipientChoice) recipientChoice.value = "primary";
      summaryAvailability.textContent = "Choose a date first to load times.";
      bookingStatus.textContent       = "";
      bookingStatus.className         = "status-message";
      renderServices();
      renderSummary();
    });
  }

  renderServices();
  renderSummary();
})();

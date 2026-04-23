(function () {
  const servicesData = window.VB_SERVICES || [];
  const config = window.VB_CONFIG || {};

  const supabase = window.supabaseClient;

  const primaryNumber = config.primaryNumber || "447599693034";
  const fallbackNumber = config.fallbackNumber || "4407951077118";

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
  servicesData.forEach(group => {
    group.items.forEach(item => {
      quantities[item.id] = 0;
    });
  });

  function formatMoney(v) {
    return "£" + Number(v || 0);
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
    return getSelectedServices().reduce((s, i) => s + i.lineTotal, 0);
  }

  async function availableTimesForDate(date) {
    if (!date) return [];

    const allSlots = generateTimeSlots();

    const { data, error } = await supabase
      .from('bookings')
      .select('booking_time')
      .eq('booking_date', date);

    if (error) {
      console.error(error);
      return allSlots;
    }

    const booked = (data || []).map(b => b.booking_time);

    return allSlots.filter(t => !booked.includes(t));
  }

  async function refreshTimeOptions() {
    const current = bookingTime.value;
    const available = await availableTimesForDate(bookingDate.value);

    bookingTime.innerHTML = '<option value="">Select a time</option>';

    available.forEach(time => {
      const opt = document.createElement("option");
      opt.value = time;
      opt.textContent = time;
      if (time === current) opt.selected = true;
      bookingTime.appendChild(opt);
    });

    summaryAvailability.textContent = available.length
      ? "Available times loaded."
      : "Fully booked.";
  }

  function renderServices() {
    servicesMount.innerHTML = "";

    servicesData.forEach(group => {
      const section = document.createElement("section");
      section.innerHTML = `<h3>${group.category}</h3>`;

      group.items.forEach(item => {
        const qty = quantities[item.id];

        const card = document.createElement("div");
        card.innerHTML = `
          <div>
            ${item.name} (£${item.price})
            <button data-id="${item.id}" class="minus">-</button>
            ${qty}
            <button data-id="${item.id}" class="plus">+</button>
          </div>
        `;

        section.appendChild(card);
      });

      servicesMount.appendChild(section);
    });

    document.querySelectorAll(".plus").forEach(btn => {
      btn.onclick = () => {
        quantities[btn.dataset.id]++;
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

    summaryServices.innerHTML = selected.map(s =>
      `<div>${s.name} x${s.quantity} = £${s.lineTotal}</div>`
    ).join("");

    if (bookingDate.value && bookingTime.value) {
      summaryDateTime.textContent = `${bookingDate.value} ${bookingTime.value}`;
    }
  }

  function validate() {
    if (!getSelectedServices().length) return "Select service";
    if (!customerName.value) return "Enter name";
    if (!customerPhone.value) return "Enter phone";
    if (!bookingDate.value) return "Select date";
    if (!bookingTime.value) return "Select time";
    return "";
  }

  function openWhatsApp(msg) {
    const num = primaryNumber;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const error = validate();
    if (error) return alert(error);

    const available = await availableTimesForDate(bookingDate.value);

    if (!available.includes(bookingTime.value)) {
      alert("Time already booked.");
      await refreshTimeOptions();
      return;
    }

    const { error: insertError } = await supabase
      .from('bookings')
      .insert([{
        customer_name: customerName.value,
        customer_phone: customerPhone.value,
        booking_date: bookingDate.value,
        booking_time: bookingTime.value,
        total: getTotal(),
        status: 'pending'
      }]);

    if (insertError) {
      alert("Error saving booking");
      return;
    }

    openWhatsApp("Booking confirmed");
    alert("Booking saved!");
    await refreshTimeOptions();
  }

  bookingDate.addEventListener("change", refreshTimeOptions);
  bookingForm.addEventListener("submit", handleSubmit);

  renderServices();
  renderSummary();
})();

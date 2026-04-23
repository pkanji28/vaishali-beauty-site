(function () {
  const supabase = window.supabaseClient;

  const bookingList = document.getElementById("adminBookingList");
  const emptyState = document.getElementById("adminEmptyState");
  const statusMessage = document.getElementById("adminStatusMessage");

  const statusFilter = document.getElementById("adminStatusFilter");
  const dateFilter = document.getElementById("adminDateFilter");
  const searchInput = document.getElementById("adminSearch");
  const refreshBtn = document.getElementById("refreshAdmin");

  const todayCount = document.getElementById("todayCount");
  const upcomingCount = document.getElementById("upcomingCount");
  const pendingCount = document.getElementById("pendingCount");
  const totalValue = document.getElementById("totalValue");

  if (!bookingList) return;

  function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message";
    if (type) statusMessage.classList.add(`status-${type}`);
  }

  function formatMoney(value) {
    return `£${Number(value || 0)}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function formatStatusLabel(status) {
    if (!status) return "pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function getTodayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function sortBookings(bookings) {
    return [...bookings].sort((a, b) => {
      const aKey = `${a.booking_date || ""} ${a.booking_time || ""}`;
      const bKey = `${b.booking_date || ""} ${b.booking_time || ""}`;
      return aKey.localeCompare(bKey);
    });
  }

  function applyFilters(bookings) {
    const statusValue = statusFilter.value;
    const dateValue = dateFilter.value.trim();
    const searchValue = searchInput.value.trim().toLowerCase();

    return bookings.filter(item => {
      const statusMatch = statusValue === "all" || (item.status || "pending") === statusValue;
      const dateMatch = !dateValue || item.booking_date === dateValue;

      const haystack = [
        item.customer_name || "",
        item.customer_phone || "",
        item.service || "",
        item.booking_time || "",
        item.status || ""
      ].join(" ").toLowerCase();

      const searchMatch = !searchValue || haystack.includes(searchValue);

      return statusMatch && dateMatch && searchMatch;
    });
  }

  function updateSummary(bookings) {
    const today = getTodayISO();

    const todayItems = bookings.filter(item => item.booking_date === today);
    const upcomingItems = bookings.filter(item => item.booking_date >= today);
    const pendingItems = bookings.filter(item => (item.status || "pending") === "pending");
    const total = bookings.reduce((sum, item) => sum + Number(item.total || 0), 0);

    todayCount.textContent = todayItems.length;
    upcomingCount.textContent = upcomingItems.length;
    pendingCount.textContent = pendingItems.length;
    totalValue.textContent = formatMoney(total);
  }

  function bookingCard(item) {
    const wrapper = document.createElement("article");
    wrapper.className = "admin-booking-card card-soft";

    wrapper.innerHTML = `
      <div class="admin-booking-top">
        <div>
          <h4>${item.customer_name || "No name"}</h4>
          <p class="admin-meta">${item.customer_phone || ""}</p>
        </div>
        <span class="status-pill status-${item.status || "pending"}">${formatStatusLabel(item.status || "pending")}</span>
      </div>

      <div class="admin-booking-grid">
        <div class="admin-info-block">
          <strong>Date</strong>
          <span>${formatDate(item.booking_date)}</span>
        </div>
        <div class="admin-info-block">
          <strong>Time</strong>
          <span>${item.booking_time || ""}</span>
        </div>
        <div class="admin-info-block">
          <strong>Total</strong>
          <span>${formatMoney(item.total)}</span>
        </div>
      </div>

      <div class="admin-service-block">
        <strong>Services</strong>
        <p>${item.service || "-"}</p>
      </div>

      <div class="admin-actions">
        <button type="button" class="btn btn-secondary btn-small" data-action="pending" data-id="${item.id}">Pending</button>
        <button type="button" class="btn btn-secondary btn-small" data-action="confirmed" data-id="${item.id}">Confirm</button>
        <button type="button" class="btn btn-secondary btn-small" data-action="completed" data-id="${item.id}">Complete</button>
        <button type="button" class="btn btn-secondary btn-small" data-action="cancelled" data-id="${item.id}">Cancel</button>
        <button type="button" class="btn btn-danger btn-small" data-action="delete" data-id="${item.id}">Delete</button>
      </div>
    `;

    return wrapper;
  }

  async function loadBookings() {
    if (!supabase) {
      setStatus("Supabase is not connected.", "error");
      return;
    }

    setStatus("Loading bookings...");

    const { data, error } = await supabase
      .from("bookings")
      .select("*");

    if (error) {
      console.error(error);
      setStatus(`Error loading bookings: ${error.message}`, "error");
      return;
    }

    const sorted = sortBookings(data || []);
    const filtered = applyFilters(sorted);

    updateSummary(sorted);
    renderList(filtered);
    setStatus(`Loaded ${filtered.length} booking${filtered.length === 1 ? "" : "s"}.`, "success");
  }

  function renderList(items) {
    bookingList.innerHTML = "";

    if (!items.length) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    items.forEach(item => {
      bookingList.appendChild(bookingCard(item));
    });
  }

  async function updateStatus(id, status) {
    if (!supabase) return;

    setStatus("Updating booking...");

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      setStatus(`Error updating booking: ${error.message}`, "error");
      return;
    }

    setStatus(`Booking marked as ${status}.`, "success");
    await loadBookings();
  }

  async function deleteBooking(id) {
    if (!supabase) return;

    const ok = window.confirm("Delete this booking?");
    if (!ok) return;

    setStatus("Deleting booking...");

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setStatus(`Error deleting booking: ${error.message}`, "error");
      return;
    }

    setStatus("Booking deleted.", "success");
    await loadBookings();
  }

  bookingList.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "delete") {
      await deleteBooking(id);
      return;
    }

    await updateStatus(id, action);
  });

  statusFilter.addEventListener("change", loadBookings);
  dateFilter.addEventListener("change", loadBookings);
  searchInput.addEventListener("input", loadBookings);
  refreshBtn.addEventListener("click", loadBookings);

  loadBookings();
})();

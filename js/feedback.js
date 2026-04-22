(function () {
  const list = document.getElementById("approvedFeedbackList");
  if (!list) return;

  const nameInput = document.getElementById("feedbackName");
  const ratingInput = document.getElementById("feedbackRating");
  const textInput = document.getElementById("feedbackText");
  const submitBtn = document.getElementById("submitFeedbackBtn");
  const status = document.getElementById("feedbackStatus");

  function renderApprovedFeedback() {
    const approved = window.VBStorage.getFeedback().filter(item => item.approved);
    if (!approved.length) {
      list.innerHTML = '<p class="empty-summary">No approved feedback yet.</p>';
      return;
    }

    list.innerHTML = approved.map(item => `
      <article class="review-card">
        <div class="review-head">
          <strong>${item.name}</strong>
          <span>${"★".repeat(Number(item.rating))}</span>
        </div>
        <p>${item.text}</p>
      </article>
    `).join("");
  }

  function setStatus(text, kind) {
    status.textContent = text || "";
    status.className = `status-message ${kind || ""}`.trim();
  }

  submitBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const rating = ratingInput.value;
    const text = textInput.value.trim();

    if (!name) {
      setStatus("Please enter your name.", "error");
      return;
    }
    if (!text) {
      setStatus("Please enter your feedback.", "error");
      return;
    }

    window.VBStorage.addFeedback({
      id: `feedback_${Date.now()}`,
      name,
      rating,
      text,
      approved: false,
      createdAt: new Date().toISOString()
    });

    nameInput.value = "";
    textInput.value = "";
    ratingInput.value = "5";
    setStatus("Feedback sent for approval.", "success");
    renderApprovedFeedback();
  });

  renderApprovedFeedback();
})();

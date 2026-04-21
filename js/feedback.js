(function () {
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackMessage = document.getElementById("feedbackMessage");
  const approvedFeedbackList = document.getElementById("approvedFeedbackList");

  function renderApprovedFeedback() {
    const items = VBStore.getFeedback().filter(item => item.approved);
    if (!items.length) {
      approvedFeedbackList.innerHTML = '<div class="feedback-item"><strong>No approved feedback yet.</strong><small>New approved reviews will appear here.</small></div>';
      return;
    }
    approvedFeedbackList.innerHTML = items.map(item => `
      <article class="feedback-item">
        <strong>${item.name}</strong>
        <div>${"★".repeat(Number(item.rating))}</div>
        <p>${item.text}</p>
        <small>${new Date(item.createdAt).toLocaleDateString()}</small>
      </article>
    `).join("");
  }

  feedbackForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    feedbackMessage.textContent = "";
    feedbackMessage.className = "status-message";

    const name = document.getElementById("feedbackName").value.trim();
    const rating = document.getElementById("feedbackRating").value;
    const text = document.getElementById("feedbackText").value.trim();

    if (!name || !rating || !text) {
      feedbackMessage.textContent = "Please complete all feedback fields.";
      feedbackMessage.classList.add("error");
      return;
    }

    const items = VBStore.getFeedback();
    items.unshift({ id: String(Date.now()), name, rating, text, approved: false, createdAt: new Date().toISOString() });
    VBStore.saveFeedback(items);

    feedbackMessage.textContent = "Feedback submitted. It will appear publicly after approval.";
    feedbackMessage.classList.add("success");
    feedbackForm.reset();
    renderApprovedFeedback();
  });

  renderApprovedFeedback();
})();
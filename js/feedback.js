(function () {
  const STORAGE_KEY = "vb_feedback_full_corrected";
  const form = document.getElementById("feedbackForm");
  if (!form) return;
  const status = document.getElementById("feedbackStatus");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const feedback = {
      id: "f_" + Date.now(),
      name: document.getElementById("feedbackName").value.trim(),
      rating: document.getElementById("feedbackRating").value,
      message: document.getElementById("feedbackMessage").value.trim(),
      createdAt: new Date().toISOString()
    };

    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    list.push(feedback);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    status.textContent = "Feedback submitted successfully.";
    status.className = "status-message status-success";
    form.reset();
  });
})();
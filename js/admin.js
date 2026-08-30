// =========================================================
// ADMIN DASHBOARD — SCRIPT
// Search, message-view modal, and small UI niceties.
// =========================================================

document.getElementById("currentYear").textContent = new Date().getFullYear();

var lastLoad = document.getElementById("lastLoad");
if (lastLoad) {
  var now = new Date();
  lastLoad.textContent =
    "Loaded " +
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  lastLoad.setAttribute("datetime", now.toISOString());
}

/* ---- search ---- */
var searchInput = document.getElementById("messageSearch");
var table = document.getElementById("messageTable");
var noResults = document.getElementById("noResults");

if (searchInput && table) {
  var rows = table.querySelectorAll("tbody tr");
  searchInput.addEventListener("input", function () {
    var term = this.value.toLowerCase().trim();
    var visible = 0;
    rows.forEach(function (row) {
      var matches = row.textContent.toLowerCase().includes(term);
      row.style.display = matches ? "" : "none";
      if (matches) visible++;
    });
    if (noResults) noResults.style.display = visible === 0 ? "block" : "none";
  });
}

/* ---- message modal ---- */
var modal = document.getElementById("messageModal");
var modalClose = document.getElementById("modalCloseBtn");

function openModal(row) {
  var id = row.dataset.id;
  document.getElementById("modalSubject").textContent =
    row.dataset.subject || "(no subject)";
  document.getElementById("modalMeta").textContent =
    "#" + id + " \u00B7 " + row.dataset.date;
  document.getElementById("modalName").textContent = row.dataset.name;
  document.getElementById("modalEmail").textContent = row.dataset.email;
  document.getElementById("modalMessage").textContent = row.dataset.message;

  var actions = document.getElementById("modalActions");
  actions.innerHTML = "";

  if (row.dataset.status === "Unread") {
    var readForm = document.createElement("form");
    readForm.action = "/message/read/" + id;
    readForm.method = "POST";
    readForm.innerHTML =
      '<button type="submit" class="btn btn-success"><i class="fa-solid fa-check"></i> Mark as read</button>';
    actions.appendChild(readForm);
  }

  var delForm = document.createElement("form");
  delForm.action = "/message/delete/" + id;
  delForm.method = "POST";
  delForm.onsubmit = function () {
    return confirm("Delete this message? This action cannot be undone.");
  };
  delForm.innerHTML =
    '<button type="submit" class="btn btn-danger"><i class="fa-solid fa-trash"></i> Delete</button>';
  actions.appendChild(delForm);

  modal.classList.add("is-open");
}

if (table) {
  table.querySelectorAll("tbody tr").forEach(function (row) {
    row.addEventListener("click", function (e) {
      if (e.target.closest(".actions")) return; // let action buttons work normally
      openModal(row);
    });
  });
}

if (modalClose)
  modalClose.addEventListener("click", function () {
    modal.classList.remove("is-open");
  });
if (modal) {
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.classList.remove("is-open");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") modal.classList.remove("is-open");
  });
}

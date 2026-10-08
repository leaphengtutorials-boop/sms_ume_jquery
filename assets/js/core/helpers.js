/**
 * CORE / HELPERS — Utilities
 */

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function showToast(msg, type = "success") {
  const $t = $("#toast");
  if (!$t.length) return;
  $t.text(msg).attr("class", "toast show " + type);
  setTimeout(() => $t.attr("class", "toast " + type), 3000);
}

function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  $("#attDate, #scoreDate").val(today);
}

function toggleSidebar() { $("#sidebar").toggleClass("open"); }

function esc(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "\\'");
}

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
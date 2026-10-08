/**
 * UI / MODAL
 */

function openModal(html) {
  $("#modalContent").html(html);
  $("#modal").addClass("open");
}

function closeModal() {
  $("#modal").removeClass("open");
}
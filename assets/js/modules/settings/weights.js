/**
 * ============================================================
 * SETTINGS — Weights
 * ============================================================
 */

async function loadWeights() {
  const sid = $("#weightSubject").val();
  if (!sid) return;

  const d = await api(`weights.php?subject_id=${sid}`);
  if (!d) return;

  $("#w_attendance").val(d.attendance_weight);
  $("#w_homework").val(d.homework_weight);
  $("#w_quiz").val(d.quiz_weight);
  $("#w_midterm").val(d.midterm_weight);
  $("#w_assignment").val(d.assignment_weight);
  $("#w_final").val(d.final_weight || 0);
  updateWeightTotal();
}

function updateWeightTotal() {
  const t = [
    "w_attendance",
    "w_homework",
    "w_quiz",
    "w_midterm",
    "w_assignment",
    "w_final",
  ].reduce((s, id) => s + (parseFloat($("#" + id).val()) || 0), 0);

  $("#weightTotal")
    .text(t)
    .css(
      "color",
      Math.abs(t - 100) < 0.01 ? "var(--success)" : "var(--danger)",
    );
}

async function saveWeights() {
  const sid = $("#weightSubject").val();
  if (!sid) return showToast("សូមជ្រើស", "error");

  const p = {
    subject_id: sid,
    attendance_weight: parseFloat($("#w_attendance").val()) || 0,
    homework_weight: parseFloat($("#w_homework").val()) || 0,
    quiz_weight: parseFloat($("#w_quiz").val()) || 0,
    midterm_weight: parseFloat($("#w_midterm").val()) || 0,
    assignment_weight: parseFloat($("#w_assignment").val()) || 0,
    final_weight: parseFloat($("#w_final").val()) || 0,
  };

  const res = await api("weights.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });

  if (res?.success) showToast("✅");
  else showToast(res?.error || "បរាជ័យ", "error");
}

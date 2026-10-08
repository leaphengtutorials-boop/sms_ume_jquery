/**
 * ============================================================
 * SETTINGS — Attendance Rules
 * ============================================================
 */

async function loadRules() {
  const sid = $("#ruleSubject").val();
  if (!sid) return;

  const d = await api(`rules.php?subject_id=${sid}`);
  if (!d) return;

  $("#r_present").val(d.present_score);
  $("#r_late").val(d.late_deduction);
  $("#r_absent").val(d.absent_deduction);
  $("#r_permission").val(d.permission_deduction);
}

async function saveRules() {
  const sid = $("#ruleSubject").val();
  if (!sid) return showToast("សូមជ្រើស", "error");

  const p = {
    subject_id: sid,
    present_score:        parseFloat($("#r_present").val()) || 0,
    late_deduction:       parseFloat($("#r_late").val()) || 0,
    absent_deduction:     parseFloat($("#r_absent").val()) || 0,
    permission_deduction: parseFloat($("#r_permission").val()) || 0,
  };

  const res = await api("rules.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });

  if (res?.success) showToast("✅");
  else showToast(res?.error || "បរាជ័យ", "error");
}
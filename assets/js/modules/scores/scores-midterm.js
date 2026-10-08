/**
 * ============================================================
 * MIDTERM SCORES
 * ============================================================
 */

async function loadScoreSheet() {
  const sid    = $("#scoreSubject").val();
  const search = $("#scoreFilterSearch").val() || "";
  const cohort = $("#scoreFilterCohort").val() || "";
  const $tbody = $("#scoreTable tbody");

  if (!sid) {
    $tbody.html('<tr><td colspan="5" style="text-align:center;padding:2rem;">សូមជ្រើស</td></tr>');
    return;
  }

  let url = `scores.php?subject_id=${sid}&type=midterm`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (cohort) url += `&cohort_id=${cohort}`;

  const data = await api(url);
  if (!data || !data.students) return;

  $tbody.html(data.students.map((s, idx) => {
    const cs = data.scores[s.student_id] ?? "";
    return `
      <tr data-sid="${s.student_id}">
        <td><strong>${idx + 1}</strong></td>
        <td>${s.photo ? `<img class="avatar" src="${s.photo}">` : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-size:1.3rem;">${s.gender === "M" ? "👨" : "👩"}</div>`}</td>
        <td><strong>${s.student_code}</strong></td>
        <td>${s.full_name}</td>
        <td><input type="number" class="score-input input" min="0" max="100" step="0.5" style="width:100%;" placeholder="0-100" value="${cs}"></td>
      </tr>`;
  }).join(""));
}

async function saveScores() {
  const sid   = $("#scoreSubject").val();
  const title = $("#scoreTitle").val().trim() || "Midterm Exam";
  const date  = $("#scoreDate").val();

  if (!sid) return showToast("សូមជ្រើស", "error");

  const records = [];
  $("#scoreTable tbody tr").each(function () {
    const v = $(this).find(".score-input").val();
    if (v !== "") records.push({ student_id: parseInt($(this).data("sid")), score: parseFloat(v) });
  });

  if (!records.length) return showToast("សូមបញ្ចូល", "error");

  const res = await api("scores.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject_id: sid,
      score_type: "midterm",
      title, max_score: 100,
      exam_date: date,
      records,
    }),
  });

  if (res?.success) {
    showToast(res.message);
    loadScoreSheet();
  }
}

async function refreshScores() {
  try {
    const sid = $("#scoreSubject").val();
    if (!sid) return showToast("សូមជ្រើសមុខវិជ្ជា", "error");
    await loadScoreSheet();
    showToast("✅ ផ្ទុករួចរាល់", "success");
  } catch (e) {
    showToast("មានបញ្ហា: " + e.message, "error");
  }
}
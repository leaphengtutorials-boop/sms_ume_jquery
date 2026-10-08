/**
 * ============================================================
 * FINAL SCORES
 * ============================================================
 */

async function loadFinalSubjects() {
  const data = await api("subjects.php?current_only=1");
  if (!data) return;
  allSubjects = data;

  const options = '<option value="">-- ជ្រើសមុខវិជ្ជា --</option>' +
    data.map((s) => {
      const y   = s.study_year || 1;
      const sem = s.semester   || 1;
      const yr  = s.year_name  || '';
      return `<option value="${s.id}">${s.subject_code} — ${s.subject_name} (ឆ្នាំ ${y} · ឆមាស ${sem} · ${yr})</option>`;
    }).join("");

  const $sel = $("#finalSubject");
  const cur = $sel.val();
  $sel.html(options);
  if (cur && $sel.find(`option[value="${cur}"]`).length) $sel.val(cur);
  else if (data.length > 0) $sel.val(data[0].id);
}

async function loadFinalScores() {
  const sid    = $("#finalSubject").val();
  const search = $("#finalFilterSearch").val() || "";
  const cohort = $("#finalFilterCohort").val() || "";
  const $tbody = $("#finalTable tbody");
  const $info  = $("#finalInfo");

  if (!sid) {
    $tbody.html('<tr><td colspan="5" style="text-align:center;padding:2rem;">សូមជ្រើសមុខវិជ្ជា</td></tr>');
    $info.html("");
    return;
  }

  // ✅ បង្ហាញ Subject Info
  const subject = allSubjects.find((s) => s.id == sid);
  if (subject && $info.length) {
    const y   = subject.study_year || 1;
    const sem = subject.semester   || 1;
    const yr  = subject.year_name  || '-';
    
    $info.html(`
      <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);padding:0.8rem 1rem;border-radius:10px;font-size:0.82rem;color:#1e40af;margin-bottom:1rem;">
        📚 <strong>${subject.subject_code} — ${subject.subject_name}</strong>
        · 📖 ឆ្នាំ ${y}
        · 📅 ឆមាស ${sem}
        · 🗓️ ${yr}
      </div>
    `);
  }

  let url = `final_scores.php?subject_id=${sid}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (cohort) url += `&cohort_id=${cohort}`;

  const data = await api(url);
  if (!data || !data.students) return;

  // ✅ Status Info (មាន/គ្មានពិន្ទុ)
  const has = Object.keys(data.scores).length > 0;

  $tbody.html(data.students.map((s, idx) => {
    const cs = data.scores[s.student_id] ?? "";
    return `
      <tr data-sid="${s.student_id}">
        <td><strong>${idx + 1}</strong></td>
        <td>${s.photo 
          ? `<img class="avatar" src="${s.photo}">` 
          : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-size:1.3rem;">${s.gender === "M" ? "👨" : "👩"}</div>`}</td>
        <td><strong>${s.student_code}</strong></td>
        <td>${s.full_name}</td>
        <td><input type="number" class="final-score-input input" min="0" max="100" step="0.5" style="width:100%;" placeholder="0-100" value="${cs}"></td>
      </tr>`;
  }).join(""));
}

async function saveFinalScores() {
  const sid   = $("#finalSubject").val();
  const title = $("#finalTitle").val().trim() || "Final Exam";
  const date  = $("#finalDate").val();

  if (!sid) return showToast("សូមជ្រើស", "error");

  const records = [];
  $("#finalTable tbody tr").each(function () {
    const v = $(this).find(".final-score-input").val();
    if (v !== "") records.push({ student_id: parseInt($(this).data("sid")), score: parseFloat(v) || 0 });
  });

  if (!records.length) return showToast("សូមបញ្ចូល", "error");
  if (!confirm(`រក្សាទុក ${records.length} នាក់?`)) return;

  const res = await api("final_scores.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject_id: sid, title, exam_date: date, records }),
  });

  if (res?.success) {
    showToast(res.message);
    loadFinalScores();
  }
}

async function deleteFinalScores() {
  const sid = $("#finalSubject").val();
  if (!sid) return showToast("សូមជ្រើស", "error");
  if (!confirm("លុបទាំងអស់?")) return;

  const res = await api(`final_scores.php?subject_id=${sid}`, { method: "DELETE" });
  if (res?.success) {
    showToast(`✅ លុប ${res.deleted}`);
    loadFinalScores();
  }
}

async function refreshFinalScores() {
  try {
    const sid = $("#finalSubject").val();
    if (!sid) return showToast("សូមជ្រើសមុខវិជ្ជា", "error");
    await loadFinalSubjects();
    await loadFinalScores();
    showToast("✅ ផ្ទុករួចរាល់", "success");
  } catch (e) {
    showToast("មានបញ្ហា: " + e.message, "error");
  }
}
/**
 * ============================================================
 * REPORTS — លទ្ធផលពិន្ទុសរុប
 * ============================================================
 */

async function loadReport() {
  const sid    = $("#reportSubject").val();
  const search = $("#reportFilterSearch").val() || "";
  const cohort = $("#reportFilterCohort").val() || "";
  const mode   = $("#reportViewMode").val() || "current";
  const $c     = $("#reportContent");

  if (!sid) {
    $c.html('<p style="text-align:center;padding:2rem;">សូមជ្រើស</p>');
    return;
  }

  let url = `reports.php?subject_id=${sid}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (cohort) url += `&cohort_id=${cohort}`;
  if (mode === "current") url += `&only_current=1`;
  if (mode === "history") url += `&include_completed=1`;

  const data = await api(url);
  if (!data || data.error) return showToast(data?.error || "Error", "error");

  const w = data.weights;

  const rows = data.results.map((stu, idx) => `
    <tr>
      <td><strong>${idx + 1}</strong></td>
      <td>${stu.student_code}</td>
      <td>${stu.full_name}</td>
      <td style="font-size:0.72rem;color:var(--gray);">${stu.cohort_name || '-'}</td>
      <td style="text-align:center;color:#166534;font-weight:700;">${stu.attendance_score}</td>
      <td style="text-align:center;">${stu.scores.homework}</td>
      <td style="text-align:center;">${stu.scores.quiz}</td>
      <td style="text-align:center;color:#3b82f6;font-weight:700;">${stu.scores.midterm}</td>
      <td style="text-align:center;">${stu.scores.assignment}</td>
      <td style="text-align:center;color:#8b5cf6;font-weight:700;">${stu.scores.final}</td>
      <td style="text-align:center;"><strong style="color:#6366f1;font-size:1.05rem;">${stu.total_score}</strong></td>
      <td style="text-align:center;"><strong class="grade-${stu.grade}">${stu.grade}</strong></td>
    </tr>`).join("");

  const vl = { current: "🎯 ជំនាន់បច្ចុប្បន្ន", all: "📊 ទាំងអស់", history: "📚 រួមបញ្ចប់" }[mode] || "";

  $c.html(`
    <div style="background:white;padding:1.5rem;border-radius:14px;overflow-x:auto;">
      <div style="text-align:center;margin-bottom:1.5rem;">
        <h2>📈 លទ្ធផលពិន្ទុសរុប</h2>
        <p style="color:var(--gray);">${data.subject.subject_name} · ${vl} (${data.results.length} នាក់)</p>
        <div style="margin-top:0.8rem;padding:0.7rem;background:#eef2ff;border-radius:10px;display:inline-block;font-size:0.82rem;">
          ⚖️ Att ${w.attendance_weight}% · HW ${w.homework_weight}% · Quiz ${w.quiz_weight}% · Mid ${w.midterm_weight}% · Asg ${w.assignment_weight}% · Final ${w.final_weight}%
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>N°</th><th>លេខកូដ</th><th>ឈ្មោះ</th><th>ជំនាន់</th>
              <th>វត្តមាន</th><th>HW</th><th>Quiz</th><th>Mid</th>
              <th>Asg</th><th>Final</th><th>សរុប</th><th>និទ្ទេស</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`);
}

function exportExcel() {
  const t = document.querySelector("#reportContent table");
  if (!t) return showToast("សូមបង្ហាញ", "error");
  const wb = XLSX.utils.table_to_book(t, { sheet: "Results" });
  XLSX.writeFile(wb, `results_${Date.now()}.xlsx`);
}

function exportPDF() {
  const el = document.getElementById("reportContent");
  if (!el.innerHTML) return showToast("សូមបង្ហាញ", "error");
  html2pdf().from(el).set({
    filename: `results_${Date.now()}.pdf`,
    html2canvas: { scale: 2 },
  }).save();
}

async function refreshReport() {
  try {
    const sid = $("#reportSubject").val();
    if (!sid) return showToast("សូមជ្រើសមុខវិជ្ជា", "error");
    await loadReport();
    showToast("✅ ផ្ទុករួចរាល់", "success");
  } catch (e) {
    showToast("មានបញ្ហា: " + e.message, "error");
  }
}
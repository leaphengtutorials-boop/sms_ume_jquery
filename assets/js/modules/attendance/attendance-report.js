/**
 * ============================================================
 * ATTENDANCE REPORT
 * ============================================================
 */

async function loadAttReport() {
  const sid = $("#attReportSubject").val();
  const search = $("#attReportSearch")?.val() || "";
  const cohort = $("#attFilterCohort").val() || "";
  const onlyCurrent = $("#attOnlyCurrent").is(":checked");
  const $content = $("#attReportContent");

  if (!sid) {
    $content.html(
      '<p style="text-align:center;padding:2rem;">សូមជ្រើសមុខវិជ្ជា</p>',
    );
    return;
  }

  let url = `attendance.php?report=1&subject_id=${sid}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (cohort) url += `&cohort_id=${cohort}`;
  if (onlyCurrent) url += `&only_current=1`;

  const data = await api(url);
  if (!data || data.error) return showToast(data?.error || "Error", "error");

  const tw = data.total_weeks;
  const results = data.results;
  const statusMap = { present: "✓", late: "L", absent: "A", permission: "P" };

  let headers = `<th style="min-width:40px;">N°</th>
                 <th style="min-width:150px;">ឈ្មោះ</th>
                 <th style="min-width:90px;">ជំនាន់</th>
                 <th style="min-width:50px;">ភេទ</th>`;
  for (let i = 1; i <= tw; i++)
    headers += `<th style="min-width:35px;">W${i}</th>`;
  headers += `<th style="min-width:60px;">A</th>
              <th style="min-width:60px;">P</th>
              <th style="min-width:80px;">ពិន្ទុ</th>`;

  const rows = results
    .map((stu, idx) => {
      let weekCells = "";
      for (let i = 1; i <= tw; i++) {
        const st = stu.week_status[i] || "absent";
        const cls =
          st === "present"
            ? "present"
            : st === "late"
              ? "late"
              : st === "permission"
                ? "permission"
                : "absent";
        weekCells += `<td class="${cls}" style="text-align:center;font-weight:700;padding:0.3rem;">${statusMap[st]}</td>`;
      }

      const isCurrent = stu.is_current === 1;
      const cohortBadge = stu.cohort_name
        ? `<span style="background:${isCurrent ? "#dbeafe" : "#f1f5f9"};color:${isCurrent ? "#1e40af" : "#64748b"};padding:2px 8px;border-radius:10px;font-size:0.68rem;font-weight:600;">${isCurrent ? "⭐ " : ""}${stu.cohort_name}</span>`
        : "-";

      return `
      <tr>
        <td><strong>${idx + 1}</strong></td>
        <td>${stu.full_name}<br><small style="color:var(--gray);font-size:0.68rem;">📌 ${stu.student_code}</small></td>
        <td style="text-align:center;">${cohortBadge}</td>
        <td style="text-align:center;">${stu.gender === "M" ? "ប្រុស" : "ស្រី"}</td>
        ${weekCells}
        <td style="text-align:center;font-weight:700;color:#ef4444;">${stu.attendance.absent}</td>
        <td style="text-align:center;font-weight:700;color:#3b82f6;">${stu.attendance.permission}</td>
        <td style="text-align:center;font-weight:700;color:#6366f1;">${stu.attendance_percent}</td>
      </tr>`;
    })
    .join("");

  let cohortInfo = "";
  if (cohort) {
    const c = allCohorts.find((x) => x.id == cohort);
    if (c)
      cohortInfo = `<span style="background:${c.is_current ? "#dbeafe" : "#fef3c7"};color:${c.is_current ? "#1e40af" : "#92400e"};padding:4px 12px;border-radius:20px;font-size:0.78rem;font-weight:600;margin-left:0.5rem;">🎓 ${c.cohort_name}${c.is_current ? " ⭐" : ""}</span>`;
  }

  $content.html(`
    <div style="background:white;padding:1.5rem;border-radius:14px;">
      <div style="text-align:center;margin-bottom:1.5rem;">
        <h2>📊 របាយការណ៍វត្តមាន</h2>
        <p style="color:var(--gray);">
          ${data.subject.subject_name} · ${tw} សប្តាហ៍ · ${results.length} នាក់ ${cohortInfo}
        </p>
      </div>
      <div class="table-wrap" style="overflow-x:auto;">
        <table style="font-size:0.78rem;width:100%;">
          <thead>
            <tr style="background:#f8fafc;position:sticky;top:0;z-index:10;">${headers}</tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="99" style="text-align:center;padding:2rem;color:var(--gray);">មិនមានទិន្នន័យ</td></tr>'}</tbody>
        </table>
      </div>
    </div>`);
}

function exportAttendance() {
  const sid = $("#attReportSubject").val();
  if (!sid) return showToast("សូមជ្រើស", "error");
  window.location.href = `${API}/export_attendance.php?subject_id=${sid}`;
}

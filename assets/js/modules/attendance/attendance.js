/**
 * ============================================================
 * ATTENDANCE — Main Module
 * ============================================================
 */

function switchAttView(view) {
  $(".att-view-btn").each(function () {
    $(this).toggleClass("active", $(this).data("view") === view);
  });
  $("#attTakeView").toggle(view === "take");
  $("#attReportView").toggle(view === "report");

  if (view === "report") {
    const takeSubject = $("#attSubject").val();
    if (takeSubject && !$("#attReportSubject").val()) {
      $("#attReportSubject").val(takeSubject);
    }
    loadAttReport();
  }
}

async function loadAttendance() {
  const sid         = $("#attSubject").val();
  const week        = $("#attWeek").val();
  const search      = $("#attFilterSearch").val() || "";
  const cohort      = $("#attFilterCohort").val() || "";
  const onlyCurrent = $("#attOnlyCurrent").is(":checked");
  const $tbody      = $("#attTable tbody");

  if (!sid || !week) {
    $tbody.html('<tr><td colspan="6" style="text-align:center;padding:2rem;">សូមជ្រើស</td></tr>');
    return;
  }

  let url = `attendance.php?subject_id=${sid}&week=${week}`;
  if (search)      url += `&search=${encodeURIComponent(search)}`;
  if (cohort)      url += `&cohort_id=${cohort}`;
  if (onlyCurrent) url += `&only_current=1`;

  const data = await api(url);
  if (!data) return;

  if (!data.length) {
    $tbody.html('<tr><td colspan="6" style="text-align:center;padding:2rem;">មិនមានសិស្ស</td></tr>');
    updateAttSummaryLive();
    return;
  }

  $tbody.html(data.map((s, idx) => `
    <tr data-sid="${s.student_id}">
      <td><strong>${idx + 1}</strong></td>
      <td>
        ${s.photo 
          ? `<img class="avatar" src="${s.photo}">` 
          : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-size:1.3rem;">${s.gender === "M" ? "👨" : "👩"}</div>`}
      </td>
      <td><strong>${s.student_code}</strong></td>
      <td>${s.full_name}</td>
      <td>
        <select class="status-select status-${s.status}" 
                onchange="updateStatusColor(this);updateAttSummaryLive();">
          <option value="present"    ${s.status === "present" ? "selected" : ""}>✅ មាន</option>
          <option value="late"       ${s.status === "late" ? "selected" : ""}>⏰ យឺត</option>
          <option value="permission" ${s.status === "permission" ? "selected" : ""}>📝 ច្បាប់</option>
          <option value="absent"     ${s.status === "absent" ? "selected" : ""}>❌ អវត្តមាន</option>
        </select>
      </td>
      <td><input type="text" class="note-input input" style="width:100%;" placeholder="..." value="${s.note || ""}"></td>
    </tr>`).join(""));

  updateAttSummaryLive();
}

function updateStatusColor(sel) {
  $(sel).attr("class", "status-select status-" + sel.value);
}

function updateAttSummaryLive() {
  const c = { present: 0, late: 0, absent: 0, permission: 0 };
  $("#attTable .status-select").each(function () {
    c[$(this).val()]++;
  });
  const t = c.present + c.late + c.absent + c.permission;

  $("#attSummary").html(`
    <div class="summary-card"><div class="num">${t}</div><div class="label">សរុប</div></div>
    <div class="summary-card present"><div class="num">${c.present}</div><div class="label">✅ មាន</div></div>
    <div class="summary-card late"><div class="num">${c.late}</div><div class="label">⏰ យឺត</div></div>
    <div class="summary-card permission"><div class="num">${c.permission}</div><div class="label">📝 ច្បាប់</div></div>
    <div class="summary-card absent"><div class="num">${c.absent}</div><div class="label">❌ អវត្តមាន</div></div>`);
}

function markAllAttendance(status) {
  $("#attTable .status-select").each(function () {
    $(this).val(status);
    updateStatusColor(this);
  });
  updateAttSummaryLive();
}

async function saveAttendance() {
  const sid      = $("#attSubject").val();
  const cohortId = $("#attFilterCohort").val() || "";
  const week     = $("#attWeek").val();
  const date     = $("#attDate").val();

  if (!sid || !week) return showToast("សូមជ្រើស", "error");

  const records = [];
  $("#attTable tbody tr").each(function () {
    if (!$(this).data("sid")) return;
    records.push({
      student_id: parseInt($(this).data("sid")),
      status:     $(this).find(".status-select").val(),
      note:       $(this).find(".note-input").val() || "",
    });
  });

  if (!records.length) return showToast("គ្មាន", "error");

  const res = await api("attendance.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject_id: sid, week, attend_date: date, records }),
  });

  if (res?.success) {
    showToast(res.message);
    const key = `${sid}_${cohortId || 'all'}`;
    attendanceWeekSelected[key] = parseInt(week);
  }
}
/**
 * ENROLLMENT
 */

async function loadEnrollment() {
  const sid           = $("#enrollSubject").val();
  const search        = $("#enrollSearch").val() || "";
  const cohort        = $("#enrollCohortFilter").val() || "";
  const year          = $("#enrollYearFilter").val() || "";
  const status        = $("#enrollStatusFilter").val() || "";
  const studentStatus = $("#enrollStudentStatusFilter").val() || "";
  const viewMode      = $("#enrollViewMode").val() || "all";
  const $list         = $("#enrollmentList");

  if (!sid) {
    $list.html('<p style="text-align:center;padding:2rem;">សូមជ្រើសមុខវិជ្ជា</p>');
    $("#enrollCount").text("0");
    return;
  }

  let url = `enrollment.php?subject_id=${sid}`;
  if (search)        url += `&search=${encodeURIComponent(search)}`;
  if (cohort)        url += `&cohort_id=${cohort}`;
  if (year)          url += `&entry_year_id=${year}`;
  if (status)        url += `&enroll_status=${status}`;
  if (studentStatus) url += `&student_status=${studentStatus}`;

  const data = await api(url);
  if (!data) return;

  const subject = allSubjects.find((sub) => sub.id == sid);

  // Filter by viewMode
  let filtered = data;
  if (viewMode === "available") {
    filtered = data.filter((s) => parseInt(s.other_active_count || 0) === 0 || s.enrolled == 1);
  } else if (viewMode === "busy") {
    filtered = data.filter((s) => parseInt(s.other_active_count || 0) > 0);
  }

  $("#enrollCount").text(`${filtered.length} នាក់`);

  if (!filtered.length) {
    $list.html('<p style="text-align:center;padding:2rem;">មិនមានសិស្ស</p>');
    return;
  }

  let availableCount = 0, busyCount = 0;
  data.forEach((s) => {
    if (parseInt(s.other_active_count || 0) > 0) busyCount++;
    else availableCount++;
  });

  const summaryBar = `
    <div class="enroll-summary">
      <div>✅ <strong>អាចចុះឈ្មោះ:</strong> ${availableCount} នាក់</div>
      <div>🔒 <strong>រវល់:</strong> ${busyCount} នាក់</div>
    </div>`;

  $list.html(summaryBar + filtered.map((s) => renderEnrollRow(s, sid, subject)).join(""));
}

function renderEnrollRow(s, sid, subject) {
  const isEnrolled    = s.enrolled == 1;
  const es            = s.enroll_status || 'none';
  const completedSub  = parseInt(s.completed_subjects) || 0;
  const otherActive   = parseInt(s.other_active_count || 0);
  const otherSubjects = s.other_active_subjects || '';
  const isBusy        = otherActive > 0 && !isEnrolled;

  const subjYear     = subject?.year_name || '-';
  const subjStudy    = subject?.study_year || '-';
  const subjSemester = subject?.semester || '-';

  let rowClass = "enroll-row";
  if (es === 'completed')    rowClass += " enroll-row-completed";
  else if (es === 'dropped') rowClass += " enroll-row-dropped";
  else if (es === 'active')  rowClass += " enroll-row-active";
  else if (isBusy)           rowClass += " enroll-row-busy";

  let statusHtml = '';
  if (isEnrolled) {
    statusHtml = `
      <select class="enroll-status-select" data-sid="${s.id}"
              onchange="changeEnrollStatusInline(${s.id}, ${sid}, this.value)">
        <option value="active"    ${es === 'active' ? 'selected' : ''}>🟢 កំពុងរៀន</option>
        <option value="completed" ${es === 'completed' ? 'selected' : ''}>✅ បញ្ចប់</option>
        <option value="dropped"   ${es === 'dropped' ? 'selected' : ''}>🔴 ឈប់</option>
      </select>`;
  } else if (isBusy) {
    statusHtml = `
      <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
        <span class="enroll-busy-chip">🔒 កំពុងរៀន</span>
        <div style="font-size:0.68rem;color:#92400e;text-align:right;line-height:1.5;">
          ${otherSubjects || otherActive + ' មុខវិជ្ជា'}
        </div>
      </div>`;
  }

  return `
    <div class="${rowClass}" data-sid="${s.id}">
      <div class="enroll-checkbox-col">
        <input type="checkbox" class="enroll-check" data-sid="${s.id}"
               ${isEnrolled ? "checked" : ""}
               ${isBusy ? "disabled" : ""}>
      </div>
      <div class="enroll-photo-col">
        ${s.photo ? `<img src="${s.photo}" alt="">` : `<span>${s.gender === "M" ? "👨" : "👩"}</span>`}
      </div>
      <div class="enroll-info-col">
        <div class="enroll-name">${s.full_name}</div>
        <div class="enroll-meta">
          📌 ${s.student_code}
          ${s.cohort_name ? `· 🎓 ${s.cohort_name}` : ''}
          · 📚 បញ្ចប់: <strong>${completedSub}</strong>
        </div>
        <div class="enroll-subject-info">
          <span class="subj-chip">📖 ឆ្នាំទី ${subjStudy}</span>
          <span class="subj-chip">📅 ឆមាស ${subjSemester}</span>
          <span class="subj-chip">🗓️ ${subjYear}</span>
        </div>
      </div>
      <div class="enroll-status-col">${statusHtml}</div>
    </div>`;
}

function selectAllEnrollment() {
  $('#enrollmentList .enroll-check:not(:disabled)').prop("checked", true);
  const blocked = $('#enrollmentList .enroll-check:disabled').length;
  if (blocked) showToast(`🔒 រំលង ${blocked} នាក់រវល់`, "success");
}

function deselectAllEnrollment() {
  $('#enrollmentList .enroll-check').prop("checked", false);
}

async function changeEnrollStatusInline(studentId, subjectId, status) {
  const res = await api("enrollment.php", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, subject_id: subjectId, status }),
  });

  if (res?.success) {
    showToast("✅ កែជោគជ័យ");
    loadEnrollment();
  } else if (res?.missing) {
    alert(`⚠️ មិនអាចបញ្ចប់បាន!\n\n${res.missing.map(m => '• ' + m).join('\n')}`);
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
  }
}

async function saveEnrollment() {
  const sid = $("#enrollSubject").val();
  if (!sid) return showToast("សូមជ្រើសមុខវិជ្ជា", "error");

  const students = [];
  $('#enrollmentList .enroll-check:checked:not(:disabled)').each(function () {
    const studentId = parseInt($(this).data("sid"));
    const $item = $(this).closest('.enroll-row');
    const status = $item.find('.enroll-status-select').val() || 'active';
    students.push({ id: studentId, status });
  });

  const res = await api("enrollment.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject_id: sid, students }),
  });

  if (res?.success) {
    showToast(res.message);
    loadEnrollment();
    loadSubjects();
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
    if (res?.conflicts) alert(`⚠️ ${res.message}`);
  }
}

async function bulkCompleteEnrollment() {
  const sid = $("#enrollSubject").val();
  if (!sid) return showToast("សូមជ្រើសមុខវិជ្ជា", "error");

  const ids = $('#enrollmentList .enroll-check:checked:not(:disabled)')
    .map(function () { return parseInt($(this).data("sid")); }).get();

  if (!ids.length) return showToast("សូមជ្រើសសិស្ស", "error");
  if (!confirm(`🎓 បញ្ចប់សម្រាប់ ${ids.length} នាក់?`)) return;

  const res = await api("bulk_complete.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject_id: parseInt(sid), student_ids: ids }),
  });

  if (res?.success) {
    showToast(res.message, "success");
    if (res.skipped && res.skipped.length) {
      setTimeout(() => alert(`⚠️ រំលង ${res.skipped.length} នាក់:\n\n${res.skipped.slice(0, 10).join('\n')}`), 500);
    }
    loadEnrollment();
    loadSubjects();
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
  }
}
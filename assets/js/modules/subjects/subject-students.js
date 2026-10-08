/**
 * ============================================================
 * SUBJECT STUDENTS MODAL
 * ============================================================
 * 
 * Popup បង្ហាញសិស្សក្នុងមុខវិជ្ជាមួយ (current cohort only)
 */

async function openSubjectStudents(subjectId, subjectName) {
  log("🔵 openSubjectStudents:", { subjectId, subjectName });
  currentSubjectId = subjectId;
  currentSubjectName = subjectName;

  const cohortId = currentCohortId || (allCohorts[0]?.id || "");

  let url = `subject_students.php?subject_id=${subjectId}`;
  if (cohortId) url += `&cohort_id=${cohortId}`;

  const data = await api(url);
  if (!data) return;

  renderSubjectStudentsModal(data);
}

function renderSubjectStudentsModal(data) {
  const students   = data.students;
  const w          = data.weights;
  const totalWeeks = data.total_weeks;
  const cohortId   = currentCohortId || (allCohorts[0]?.id || "");
  const cohort     = allCohorts.find((c) => c.id == cohortId);

  const rows = students.length
    ? students.map((s, idx) => {
        const isCurrent = s.is_current === 1;
        const cohortBadge = s.cohort_name
          ? `<span style="background:${isCurrent ? '#dbeafe' : '#f1f5f9'};color:${isCurrent ? '#1e40af' : '#64748b'};padding:2px 8px;border-radius:10px;font-size:0.68rem;font-weight:600;">${isCurrent ? '⭐ ' : ''}${s.cohort_name}</span>`
          : '-';

        const actionCell = s.enroll_status === 'completed'
          ? '<span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;">✅ បញ្ចប់</span>'
          : `<button type="button" class="btn btn-success btn-sm complete-single-btn" data-sid="${s.student_id}">✅ បញ្ចប់</button>`;

        return `
          <tr style="border-bottom:1px solid #f1f5f9;${s.enroll_status === 'completed' ? 'background:#f0fdf4;' : ''}">
            <td style="padding:0.5rem;text-align:center;">
              <input type="checkbox" class="subj-stu-check" value="${s.student_id}">
            </td>
            <td style="padding:0.5rem;text-align:center;font-size:0.72rem;">${idx + 1}</td>
            <td style="padding:0.5rem;">
              ${s.photo
                ? `<img src="${s.photo}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`
                : `<div style="width:32px;height:32px;border-radius:50%;background:#eef2ff;display:flex;align-items:center;justify-content:center;font-size:1rem;">${s.gender === "M" ? "👨" : "👩"}</div>`}
            </td>
            <td style="padding:0.5rem;">
              <div style="font-weight:600;font-size:0.8rem;">${s.full_name}</div>
              <div style="font-size:0.68rem;color:var(--gray);">📌 ${s.student_code}</div>
            </td>
            <td style="padding:0.5rem;text-align:center;">${cohortBadge}</td>
            <td style="padding:0.5rem;text-align:center;color:#166534;font-weight:700;">${s.attendance_score}</td>
            <td style="padding:0.5rem;text-align:center;">${s.scores.homework}</td>
            <td style="padding:0.5rem;text-align:center;">${s.scores.quiz}</td>
            <td style="padding:0.5rem;text-align:center;color:#3b82f6;font-weight:700;">${s.scores.midterm}</td>
            <td style="padding:0.5rem;text-align:center;">${s.scores.assignment}</td>
            <td style="padding:0.5rem;text-align:center;color:#8b5cf6;font-weight:700;">${s.scores.final}</td>
            <td style="padding:0.5rem;text-align:center;font-weight:700;color:#6366f1;">${s.total_score}</td>
            <td style="padding:0.5rem;text-align:center;"><strong class="grade-${s.grade}">${s.grade}</strong></td>
            <td style="padding:0.5rem;text-align:center;">${actionCell}</td>
          </tr>`;
      }).join("")
    : `<tr><td colspan="14" style="text-align:center;padding:2rem;color:var(--gray);">📭 មិនមានសិស្សក្នុងជំនាន់នេះ</td></tr>`;

  openModal(`
    <h3>📚 សិស្សក្នុងមុខវិជ្ជា — ${currentSubjectName}</h3>

    <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);padding:0.9rem;border-radius:12px;margin-bottom:1rem;font-size:0.8rem;color:#1e40af;">
      <div style="display:flex;gap:1.5rem;flex-wrap:wrap;">
        <div>🎓 <strong>ជំនាន់:</strong> ${cohort?.cohort_name || '-'} ${cohort?.is_current ? '⭐' : ''}</div>
        <div>👥 <strong>សិស្ស:</strong> ${students.length} នាក់</div>
        <div>📆 <strong>សប្តាហ៍:</strong> ${totalWeeks}</div>
      </div>
      <div style="margin-top:0.4rem;font-size:0.72rem;">
        <strong>⚖️ ទម្ងន់:</strong> Att ${w.attendance_weight}% · HW ${w.homework_weight}% · Quiz ${w.quiz_weight}% · Mid ${w.midterm_weight}% · Asg ${w.assignment_weight}% · Final ${w.final_weight}%
      </div>
    </div>

    <div style="display:flex;gap:0.4rem;margin-bottom:0.8rem;flex-wrap:wrap;align-items:center;">
      <button type="button" class="btn btn-success btn-sm" id="subjStuCheckAll">✅ ជ្រើសទាំងអស់</button>
      <button type="button" class="btn btn-warning btn-sm" id="subjStuUncheckAll">❌ ដកទាំងអស់</button>
      <button type="button" class="btn btn-primary btn-sm" id="subjStuBulkComplete">🎓 បញ្ចប់ដែលជ្រើស</button>
      <span id="subjStuCount" style="margin-left:auto;font-size:0.78rem;color:var(--gray);">
        បានជ្រើស: <strong>0</strong>
      </span>
    </div>

    <div style="max-height:60vh;overflow:auto;border:1px solid var(--border);border-radius:12px;background:white;">
      <table style="width:100%;border-collapse:collapse;font-size:0.75rem;">
        <thead>
          <tr style="background:#f8fafc;position:sticky;top:0;z-index:10;">
            <th style="padding:0.5rem;width:40px;"></th>
            <th style="padding:0.5rem;">#</th>
            <th style="padding:0.5rem;">រូបថត</th>
            <th style="padding:0.5rem;text-align:left;">ឈ្មោះ</th>
            <th style="padding:0.5rem;">🎓 ជំនាន់</th>
            <th style="padding:0.5rem;">វត្តមាន</th>
            <th style="padding:0.5rem;">HW</th>
            <th style="padding:0.5rem;">Quiz</th>
            <th style="padding:0.5rem;">Mid</th>
            <th style="padding:0.5rem;">Asg</th>
            <th style="padding:0.5rem;">Final</th>
            <th style="padding:0.5rem;">សរុប</th>
            <th style="padding:0.5rem;">និទ្ទេស</th>
            <th style="padding:0.5rem;">សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="modal-actions" style="margin-top:1rem;">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">បិទ</button>
    </div>`);

  // Bindings
  $("#subjStuCheckAll").off("click").on("click", function () {
    $(".subj-stu-check").prop("checked", true);
    updateSubjStuCount();
  });

  $("#subjStuUncheckAll").off("click").on("click", function () {
    $(".subj-stu-check").prop("checked", false);
    updateSubjStuCount();
  });

  $("#subjStuBulkComplete").off("click").on("click", completeBulkSubject);

  $(document).off("click", ".complete-single-btn").on("click", ".complete-single-btn", function () {
    completeSingleSubject(parseInt($(this).data("sid")));
  });

  $(document).off("change", ".subj-stu-check").on("change", ".subj-stu-check", updateSubjStuCount);
}

function updateSubjStuCount() {
  const n = $(".subj-stu-check:checked").length;
  $("#subjStuCount").html(`បានជ្រើស: <strong>${n}</strong>`);
}

async function completeSingleSubject(studentId) {
  if (!confirm("បញ្ចប់មុខវិជ្ជាសម្រាប់សិស្សនេះ?\n\n(ត្រូវបំពេញពិន្ទុទាំងអស់ លើកលែង Final)")) return;

  const res = await api("enrollment.php", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      subject_id: currentSubjectId,
      status: 'completed',
    }),
  });

  if (res?.success) {
    showToast("✅ បញ្ចប់ជោគជ័យ");
    openSubjectStudents(currentSubjectId, currentSubjectName);
    loadSubjects();
  } else if (res?.missing) {
    alert(`⚠️ មិនអាចបញ្ចប់បាន!\n\nត្រូវបំពេញ:\n${res.missing.map(m => '• ' + m).join('\n')}`);
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
  }
}

async function completeBulkSubject() {
  const ids = $('.subj-stu-check:checked').map(function () {
    return parseInt($(this).val());
  }).get();

  if (!ids.length) return showToast("សូមជ្រើសសិស្ស", "error");
  if (!confirm(`បញ្ចប់សម្រាប់ ${ids.length} នាក់?`)) return;

  let done = 0;
  const errors = [];

  for (const sid of ids) {
    const res = await api("enrollment.php", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: sid,
        subject_id: currentSubjectId,
        status: 'completed',
      }),
    });

    if (res?.success) done++;
    else if (res?.missing) {
      const $row = $(`.subj-stu-check[value="${sid}"]`).closest('tr');
      const name = $row.find('td:nth-child(4) div:first').text() || `ID ${sid}`;
      errors.push(`${name}: ខ្វះ ${res.missing.length}`);
    }
  }

  if (done > 0) showToast(`✅ ${done}/${ids.length}`);
  if (errors.length) setTimeout(() => alert(`⚠️ ${errors.slice(0, 10).join('\n')}`), 500);

  openSubjectStudents(currentSubjectId, currentSubjectName);
  loadSubjects();
}
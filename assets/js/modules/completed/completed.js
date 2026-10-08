/**
 * ============================================================
 * COMPLETED STUDENTS — សិស្សបញ្ចប់ + Re-Enroll
 * ============================================================
 *
 * Features:
 *   - List សិស្សបញ្ចប់ (Filter: ជំនាន់/ឆ្នាំ/ឆមាស/មុខវិជ្ជា)
 *   - Export Excel
 *   - 📝 ចុះឈ្មោះថ្មី — បន្តទៅឆមាស/ឆ្នាំថ្មី
 */

// ============================================================
// LOAD COMPLETED LIST
// ============================================================
async function loadCompleted() {
  const cohort = $("#compCohortFilter").val() || "";
  const year = $("#compYearFilter").val() || "";
  const studyYear = $("#compStudyYearFilter").val() || "";
  const semester = $("#compSemesterFilter").val() || "";
  const subject = $("#compSubjectFilter").val() || "";
  const studentStatus = $("#compStudentStatusFilter").val() || "";
  const search = $("#compSearch").val() || "";

  let url = "completed_students.php?";
  const p = [];
  if (cohort) p.push(`cohort_id=${cohort}`);
  if (year) p.push(`year_id=${year}`);
  if (studyYear) p.push(`study_year=${studyYear}`);
  if (semester) p.push(`semester=${semester}`);
  if (subject) p.push(`subject_id=${subject}`);
  if (studentStatus) p.push(`student_status=${studentStatus}`);
  if (search) p.push(`search=${encodeURIComponent(search)}`);
  url += p.join("&");

  const data = await api(url);
  if (!data) return;

  $("#compCount").text(`${data.length} នាក់`);

  const $tbody = $("#compTable tbody");
  if (!$tbody.length) return;

  if (!data.length) {
    $tbody.html(
      '<tr><td colspan="11" style="text-align:center;padding:2rem;color:var(--gray);">មិនមានទិន្នន័យ</td></tr>',
    );
    return;
  }

  $tbody.html(
    data
      .map((r, idx) => {
        const dateStr = r.completed_at
          ? new Date(r.completed_at).toLocaleDateString("km-KH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "-";

        return `
      <tr style="background:#f0fdf4;">
        <td><strong>${idx + 1}</strong></td>
        <td>
          ${
            r.photo
              ? `<img class="avatar" src="${r.photo}" style="border-color:#10b981;">`
              : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-size:1.3rem;border:2px solid #10b981;">${r.gender === "M" ? "👨" : "👩"}</div>`
          }
        </td>
        <td><strong>${r.student_code}</strong></td>
        <td>
          <div style="font-weight:600;">${r.full_name}</div>
          <div style="font-size:0.72rem;color:var(--gray);">${r.gender === "M" ? "ប្រុស" : "ស្រី"}</div>
        </td>
        <td style="font-size:0.78rem;color:var(--gray);">${r.cohort_name || "-"}</td>
        <td>
          <strong>${r.subject_code}</strong><br>
          <small style="color:var(--gray);">${r.subject_name}</small>
        </td>
        <td style="font-size:0.75rem;">
          📖 ឆ្នាំទី ${r.study_year}<br>
          📅 ឆមាស ${r.semester}<br>
          🗓️ ${r.year_name || "-"}
        </td>
        <td style="font-size:0.72rem;line-height:1.6;">
          <div>📝 HW: <strong>${r.hw_score}</strong></div>
          <div>❓ Quiz: <strong>${r.quiz_score}</strong></div>
          <div>📖 Mid: <strong style="color:#3b82f6;">${r.mid_score}</strong></div>
          <div>📋 Asg: <strong>${r.asg_score}</strong></div>
          <div>🎓 Final: <strong style="color:#8b5cf6;">${r.fin_score}</strong></div>
        </td>
        <td style="text-align:center;">
          <strong style="color:#6366f1;font-size:1.05rem;">${r.total_score || "-"}</strong>
        </td>
        <td style="text-align:center;">
          <strong class="grade-${r.grade}" style="font-size:1rem;">${r.grade || "-"}</strong>
        </td>
        <td style="font-size:0.75rem;color:#065f46;font-weight:600;white-space:nowrap;">
          <div style="background:#d1fae5;padding:4px 10px;border-radius:10px;display:inline-block;">
            ✅ ${dateStr}
          </div>
        </td>
      </tr>`;
      })
      .join(""),
  );
}

function exportCompletedExcel() {
  const t = document.querySelector("#compTable");
  if (!t) return showToast("មិនមានទិន្នន័យ", "error");
  const wb = XLSX.utils.table_to_book(t, { sheet: "Completed" });
  XLSX.writeFile(wb, `completed_students_${Date.now()}.xlsx`);
}

async function populateCompletedFilters() {
  const cohortOpts =
    '<option value="">-- ជំនាន់ --</option>' +
    allCohorts
      .map(
        (c) =>
          `<option value="${c.id}">${c.cohort_name}${c.is_current ? " ⭐" : ""}</option>`,
      )
      .join("");
  $("#compCohortFilter").html(cohortOpts);

  const yearOpts =
    '<option value="">-- ឆ្នាំសិក្សា --</option>' +
    allYears
      .map((y) => `<option value="${y.id}">${y.year_name}</option>`)
      .join("");
  $("#compYearFilter").html(yearOpts);

  // ✅ Subject ទាំងអស់ (រួមទាំងចាស់)
  const subjOpts =
    '<option value="">-- មុខវិជ្ជា --</option>' +
    allSubjects
      .map(
        (s) =>
          `<option value="${s.id}">${s.subject_code} - ${s.subject_name}</option>`,
      )
      .join("");
  $("#compSubjectFilter").html(subjOpts);
}

// ============================================================
// EXPORT EXCEL
// ============================================================
function exportCompletedExcel() {
  const t = document.querySelector("#compTable");
  if (!t) return showToast("មិនមានទិន្នន័យ", "error");
  const wb = XLSX.utils.table_to_book(t, { sheet: "Completed" });
  XLSX.writeFile(wb, `completed_students_${Date.now()}.xlsx`);
}

// ============================================================
// POPULATE FILTERS
// ============================================================
async function populateCompletedFilters() {
  const cohortOpts =
    '<option value="">-- ជំនាន់ --</option>' +
    allCohorts
      .map(
        (c) =>
          `<option value="${c.id}">${c.cohort_name}${c.is_current ? " ⭐" : ""}</option>`,
      )
      .join("");
  $("#compCohortFilter").html(cohortOpts);

  const yearOpts =
    '<option value="">-- ឆ្នាំសិក្សា --</option>' +
    allYears
      .map((y) => `<option value="${y.id}">${y.year_name}</option>`)
      .join("");
  $("#compYearFilter").html(yearOpts);

  const subjOpts =
    '<option value="">-- មុខវិជ្ជា --</option>' +
    allSubjects
      .map(
        (s) =>
          `<option value="${s.id}">${s.subject_code} - ${s.subject_name}</option>`,
      )
      .join("");
  $("#compSubjectFilter").html(subjOpts);
}

// ============================================================
// 🎓 RE-ENROLL — ចុះឈ្មោះថ្មីសម្រាប់សិស្សបញ្ចប់
// ============================================================
async function openReEnrollModal(studentId, studentName) {
  log("🔵 openReEnrollModal:", { studentId, studentName });

  // ១. ទាញបញ្ជីមុខវិជ្ជាទាំងអស់
  const subjectsData = await api("subjects.php");
  if (!subjectsData) return;

  // ២. ទាញប្រវត្តិសិស្ស (មុខវិជ្ជាដែលបានរៀនរួច)
  const history = await api(`enrollment.php?history=1&student_id=${studentId}`);
  const enrolledIds = history ? history.map((h) => parseInt(h.subject_id)) : [];

  // ៣. ពិនិត្យមុខវិជ្ជាដែលសិស្សមិនទាន់រៀន
  const availableSubjects = subjectsData.filter(
    (s) => !enrolledIds.includes(parseInt(s.id)),
  );

  // ៤. ពិនិត្យ active subject
  const activeSubject = history
    ? history.find((h) => h.status === "active")
    : null;
  if (activeSubject) {
    return showToast(
      `⚠️ សិស្សកំពុងរៀន "${activeSubject.subject_name}" — ត្រូវបញ្ចប់ជាមុន`,
      "error",
    );
  }

  if (!availableSubjects.length) {
    return showToast("សិស្សបានរៀនមុខវិជ្ជាទាំងអស់ហើយ", "error");
  }

  // ៥. Group តាមឆ្នាំ + ឆមាស
  const grouped = {};
  availableSubjects.forEach((s) => {
    const key = `Y${s.study_year}S${s.semester}`;
    if (!grouped[key]) {
      grouped[key] = {
        study_year: s.study_year,
        semester: s.semester,
        year_name: s.year_name,
        items: [],
      };
    }
    grouped[key].items.push(s);
  });

  // ៦. Sort by study_year, semester
  const sortedGroups = Object.values(grouped).sort((a, b) => {
    if (a.study_year !== b.study_year) return a.study_year - b.study_year;
    return a.semester - b.semester;
  });

  const optsHtml = sortedGroups
    .map(
      (g) => `
    <optgroup label="📖 ឆ្នាំទី ${g.study_year} · 📅 ឆមាស ${g.semester} · 🗓️ ${g.year_name}">
      ${g.items
        .map(
          (s) =>
            `<option value="${s.id}">${s.subject_code} - ${s.subject_name}</option>`,
        )
        .join("")}
    </optgroup>
  `,
    )
    .join("");

  // ៧. Render modal
  openModal(`
    <h3>📝 ចុះឈ្មោះថ្មី — ${studentName}</h3>

    <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);padding:1rem;border-radius:12px;margin-bottom:1.2rem;font-size:0.85rem;color:#1e40af;line-height:1.7;">
      📌 <strong>ច្បាប់៖</strong> សិស្សអាចរៀនបានតែ <strong>១ មុខវិជ្ជា</strong> ក្នុងពេលតែមួយ
    </div>

    <form id="reEnrollForm">
      <input type="hidden" name="student_id" value="${studentId}">

      <label>📚 ជ្រើសមុខវិជ្ជាថ្មី *</label>
      <select name="subject_id" required 
              style="width:100%;padding:0.7rem;border:1.5px solid var(--border);border-radius:10px;font-family:inherit;font-size:0.9rem;">
        <option value="">-- ជ្រើសមុខវិជ្ជា --</option>
        ${optsHtml}
      </select>

      <div style="background:#f0fdf4;padding:0.8rem;border-radius:10px;margin-top:1rem;font-size:0.82rem;color:#065f46;">
        ✅ បន្ទាប់ពីចុះឈ្មោះ → មុខវិជ្ជាចាស់ៗនៅរក្សាទុកក្នុងប្រវត្តិ
      </div>

      <div class="modal-actions" style="margin-top:1.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">បោះបង់</button>
        <button type="submit" class="btn btn-primary">💾 ចុះឈ្មោះ</button>
      </div>
    </form>
  `);

  $("#reEnrollForm").on("submit", submitReEnroll);
}

// ============================================================
// SUBMIT RE-ENROLL
// ============================================================
async function submitReEnroll(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));

  if (!data.subject_id) return showToast("សូមជ្រើសមុខវិជ្ជា", "error");

  const res = await api("enrollment.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject_id: parseInt(data.subject_id),
      students: [{ id: parseInt(data.student_id), status: "active" }],
    }),
  });

  if (res?.success) {
    showToast("✅ ចុះឈ្មោះជោគជ័យ");
    closeModal();
    loadCompleted();
    loadStudents();
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
    if (res?.conflicts) {
      setTimeout(() => alert(`⚠️ ${res.message}`), 500);
    }
  }
}

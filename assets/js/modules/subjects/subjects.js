/**
 * SUBJECTS — មុខវិជ្ជា + Filters + Grouping
 */

// ============================================================
// LOAD SUBJECTS
// ============================================================
async function loadSubjects() {
  const yf = $("#subjectYearFilter").val() || "";
  const studyYear = $("#subjectStudyYearFilter").val() || "";
  const semester = $("#subjectSemesterFilter").val() || "";
  const cohort = $("#subjectCohortFilter").val() || "";
  const search = $("#subjectSearch")?.val() || "";

  let url = "subjects.php?";
  const p = [];
  // ✅ បើគ្មាន filter ឆ្នាំ → បង្ហាញតែឆ្នាំ Active
  if (yf) {
    p.push(`year_id=${yf}`);
  } else {
    p.push(`current_only=1`);
  }
  if (search) p.push(`search=${encodeURIComponent(search)}`);
  url += p.join("&");

  if (yf) p.push(`year_id=${yf}`);
  if (studyYear) p.push(`study_year=${studyYear}`);
  if (semester) p.push(`semester=${semester}`);
  if (cohort) p.push(`cohort_id=${cohort}`);
  if (search) p.push(`search=${encodeURIComponent(search)}`);
  url += p.join("&");

  const data = await api(url);
  if (!data) return;

  allSubjects = data;
  log("📚 Subjects loaded:", data.length);

  // Populate all subject selects
  const options =
    '<option value="">-- ជ្រើសមុខវិជ្ជា --</option>' +
    data
      .map((s) => {
        const y = s.study_year || 1;
        const sem = s.semester || 1;
        const yr = s.year_name || "";
        return `<option value="${s.id}">
      ${s.subject_code} — ${s.subject_name} (ឆ្នាំ ${y} · ឆមាស ${sem} · ${yr})
    </option>`;
      })
      .join("");

  $(
    "#enrollSubject, #attSubject, #attReportSubject, #hwSubject, " +
      "#scoreSubject, #finalSubject, #reportSubject, #weightSubject, #ruleSubject",
  ).each(function () {
    const cur = $(this).val();
    $(this).html(options);
    if (cur && $(this).find(`option[value="${cur}"]`).length) {
      $(this).val(cur);
    }
  });

  renderSubjectsGrid(data);
}

// ============================================================
// RENDER GRID — Group by Year + Semester
// ============================================================
function renderSubjectsGrid(data) {
  const $grid = $("#subjectsGrid");
  if (!$grid.length) return;

  if (!data.length) {
    $grid.html(
      '<p style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--gray);">មិនមានមុខវិជ្ជា</p>',
    );
    return;
  }

  const groupBy = $("#subjectGroupBy").val() || "year_sem";

  // Group data
  const groups = {};
  data.forEach((s) => {
    let key;
    if (groupBy === "year_sem") {
      key = `Y${s.study_year || 1}_S${s.semester || 1}`;
    } else if (groupBy === "year") {
      key = `Y${s.study_year || 1}`;
    } else {
      key = "all";
    }

    if (!groups[key]) {
      groups[key] = {
        study_year: s.study_year || 1,
        semester: s.semester || 1,
        year_name: s.year_name,
        items: [],
      };
    }
    groups[key].items.push(s);
  });

  // Sort groups
  const sortedGroups = Object.entries(groups).sort(([kA], [kB]) =>
    kA.localeCompare(kB),
  );

  let html = "";
  sortedGroups.forEach(([key, g]) => {
    if (groupBy !== "none") {
      // Group header
      let headerTitle;
      if (groupBy === "year_sem") {
        headerTitle = `📖 ឆ្នាំទី ${g.study_year} · 📅 ឆមាស ${g.semester}`;
      } else {
        headerTitle = `📖 ឆ្នាំទី ${g.study_year}`;
      }

      const totalStudents = g.items.reduce(
        (sum, s) => sum + parseInt(s.student_count || 0),
        0,
      );
      const totalCompleted = g.items.reduce(
        (sum, s) => sum + parseInt(s.completed_count || 0),
        0,
      );

      html += `
        <div class="subj-group-header">
          <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
            <div class="subj-group-title">${headerTitle}</div>
            <div class="subj-group-stats">
              📚 ${g.items.length} មុខវិជ្ជា
              · 👥 ${totalStudents} សិស្សកំពុងរៀន
              ${totalCompleted > 0 ? `· ✅ ${totalCompleted} បញ្ចប់` : ""}
            </div>
          </div>
        </div>
      `;
    }

    // Cards
    html += `<div class="subjects-group-row">`;
    html += g.items.map((s) => renderSubjectCard(s)).join("");
    html += `</div>`;
  });

  $grid.html(html);
  $grid.css({
    display: "block",
    padding: "0",
  });
}

// ============================================================
// RENDER SINGLE CARD
// ============================================================
function renderSubjectCard(s) {
  const studyYear = s.study_year || 1;
  const semester = s.semester || 1;
  const cohortInfo = s.cohorts_info || "";

  return `
    <div class="subject-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.4rem;">
        <div class="code">${s.subject_code}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <span class="subj-chip">📖 ឆ្នាំ ${studyYear}</span>
          <span class="subj-chip">📅 ឆមាស ${semester}</span>
        </div>
      </div>
      <h4>${s.subject_name}</h4>
      <div class="year">🗓️ ${s.year_name || "-"}</div>
      
      ${
        cohortInfo
          ? `
        <div style="font-size:0.7rem;color:var(--gray);margin-bottom:0.5rem;line-height:1.5;">
          🎓 <strong>ជំនាន់:</strong> ${cohortInfo}
        </div>
      `
          : ""
      }
      
      <div class="stats">
        <span class="subject-student-count"
              onclick='openSubjectStudents(${s.id}, "${esc(s.subject_name)}")'
              title="ចុចដើម្បីមើលបញ្ជីសិស្ស">
          👥 ${s.student_count || 0} សិស្ស
        </span>
        <span>📆 ${s.total_weeks} សប្តាហ៍</span>
        ${s.completed_count > 0 ? `<span style="background:#d1fae5;color:#065f46;">✅ ${s.completed_count} បញ្ចប់</span>` : ""}
      </div>
      <div class="actions">
        <button onclick='editSubject(${s.id})'>✏️ កែ</button>
        <button class="del" onclick='deleteSubject(${s.id})'>🗑️ លុប</button>
      </div>
    </div>`;
}

// ============================================================
// OPEN SUBJECT FORM
// ============================================================
function openSubjectForm() {
  const yearOpts = allYears
    .map((y) => `<option value="${y.id}">${y.year_name}</option>`)
    .join("");

  openModal(`
    <h3>➕ បន្ថែមមុខវិជ្ជាថ្មី</h3>
    <form id="subjectForm">
      <label>លេខកូដ *</label>
      <input name="subject_code" required placeholder="ឧ. AND101">
      <label>ឈ្មោះមុខវិជ្ជា *</label>
      <input name="subject_name" required>
      <label>🗓️ ឆ្នាំសិក្សា *</label>
      <select name="academic_year_id" required>
        <option value="">-- ជ្រើស --</option>
        ${yearOpts}
      </select>
      <label>📖 ឆ្នាំទី (Study Year) *</label>
      <select name="study_year" required>
        <option value="1">ឆ្នាំទី ១</option>
        <option value="2">ឆ្នាំទី ២</option>
        <option value="3">ឆ្នាំទី ៣</option>
        <option value="4">ឆ្នាំទី ៤</option>
      </select>
      <label>📅 ឆមាស (Semester) *</label>
      <select name="semester" required>
        <option value="1">ឆមាស ១</option>
        <option value="2">ឆមាស ២</option>
      </select>
      <label>ចំនួនសប្តាហ៍ *</label>
      <select name="total_weeks">
        <option value="13">13 សប្តាហ៍</option>
        <option value="15" selected>15 សប្តាហ៍</option>
      </select>
      <label>ការពិពណ៌នា</label>
      <textarea name="description" rows="2"></textarea>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">បោះបង់</button>
        <button type="submit" class="btn btn-primary">💾 រក្សាទុក</button>
      </div>
    </form>`);

  $("#subjectForm").on("submit", saveSubject);
}

// ============================================================
// EDIT SUBJECT
// ============================================================
function editSubject(id) {
  const s = allSubjects.find((x) => x.id === id);
  if (!s) return;

  const yearOpts = allYears
    .map(
      (y) =>
        `<option value="${y.id}" ${y.id == s.academic_year_id ? "selected" : ""}>${y.year_name}</option>`,
    )
    .join("");

  openModal(`
    <h3>✏️ កែមុខវិជ្ជា</h3>
    <form id="subjectForm">
      <input type="hidden" name="id" value="${s.id}">
      <label>លេខកូដ *</label>
      <input name="subject_code" required value="${s.subject_code}">
      <label>ឈ្មោះ *</label>
      <input name="subject_name" required value="${s.subject_name}">
      <label>🗓️ ឆ្នាំសិក្សា *</label>
      <select name="academic_year_id" required>${yearOpts}</select>
      <label>📖 ឆ្នាំទី *</label>
      <select name="study_year" required>
        <option value="1" ${s.study_year == 1 ? "selected" : ""}>ឆ្នាំទី ១</option>
        <option value="2" ${s.study_year == 2 ? "selected" : ""}>ឆ្នាំទី ២</option>
        <option value="3" ${s.study_year == 3 ? "selected" : ""}>ឆ្នាំទី ៣</option>
        <option value="4" ${s.study_year == 4 ? "selected" : ""}>ឆ្នាំទី ៤</option>
      </select>
      <label>📅 ឆមាស *</label>
      <select name="semester" required>
        <option value="1" ${s.semester == 1 ? "selected" : ""}>ឆមាស ១</option>
        <option value="2" ${s.semester == 2 ? "selected" : ""}>ឆមាស ២</option>
      </select>
      <label>ចំនួនសប្តាហ៍</label>
      <select name="total_weeks">
        <option value="13" ${s.total_weeks == 13 ? "selected" : ""}>13 សប្តាហ៍</option>
        <option value="15" ${s.total_weeks == 15 ? "selected" : ""}>15 សប្តាហ៍</option>
      </select>
      <label>ការពិពណ៌នា</label>
      <textarea name="description" rows="2">${s.description || ""}</textarea>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">បោះបង់</button>
        <button type="submit" class="btn btn-primary">💾 រក្សាទុក</button>
      </div>
    </form>`);

  $("#subjectForm").on("submit", saveSubject);
}

// ============================================================
// SAVE
// ============================================================
async function saveSubject(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const isEdit = !!data.id;

  const res = await api("subjects.php", {
    method: isEdit ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res?.success) {
    showToast("✅ រក្សាទុកជោគជ័យ");
    closeModal();
    loadSubjects();
  }
}

// ============================================================
// DELETE
// ============================================================
async function deleteSubject(id) {
  if (!confirm("លុបមុខវិជ្ជានេះ?")) return;
  await api(`subjects.php?id=${id}`, { method: "DELETE" });
  showToast("✅ លុបជោគជ័យ");
  loadSubjects();
}

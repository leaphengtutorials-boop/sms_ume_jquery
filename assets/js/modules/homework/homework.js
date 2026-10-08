/**
 * ============================================================
 * HOMEWORK — កិច្ចការ / Quiz / Assignment
 * ============================================================
 */

// ============================================================
// LOAD SUBJECTS
// ============================================================
async function loadHomeworkSubjects() {
  // ✅ Filter ឆ្នាំបច្ចុប្បន្នតែប៉ុណ្ណោះ
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

  $("#hwSubject").html(options);
  if (data.length === 1) $("#hwSubject").val(data[0].id);
}

// ============================================================
// COHORT STATUS (READ-ONLY WARNING)
// ============================================================
function updateHwCohortStatus(cohortId) {
  const $status    = $("#hwCohortStatus");
  const $warn      = $("#hwReadonlyWarning");
  const $createBtn = $("#hwCreateBtn");

  if (!cohortId) {
    $status.html("").hide();
    $warn.hide();
    $createBtn.prop("disabled", false).show();
    return;
  }

  const cohort = allCohorts.find((c) => c.id == cohortId);
  if (!cohort) return;

  if (cohort.is_current) {
    $status.html(`<span style="background:#dbeafe;color:#1e40af;padding:4px 12px;border-radius:20px;font-size:0.78rem;font-weight:600;">⭐ ជំនាន់បច្ចុប្បន្ន — កែបាន</span>`).show();
    $warn.hide();
    $createBtn.prop("disabled", false).show();
  } else {
    $status.html(`<span style="background:#d1fae5;color:#065f46;padding:4px 12px;border-radius:20px;font-size:0.78rem;font-weight:600;">✅ បញ្ចប់ — Read-only</span>`).show();
    $warn.show();
    $createBtn.hide();
  }
}

// ============================================================
// LOAD HOMEWORK LIST
// ============================================================
async function loadHomework() {
  const sid        = $("#hwSubject").val();
  const cohort     = $("#hwCohortFilter").val() || "";
  const year       = $("#hwYearFilter")?.val() || "";
  const studyYear  = $("#hwStudyYearFilter")?.val() || "";
  const semester   = $("#hwSemesterFilter")?.val() || "";
  const type       = $("#hwType").val();
  const search     = $("#hwFilterSearch").val() || "";

  updateHwCohortStatus(cohort);

  if (!sid) {
    $("#hwList").html('<p style="text-align:center;padding:2rem;">សូមជ្រើសមុខវិជ្ជា</p>');
    return;
  }

  let url = `homework.php?subject_id=${sid}`;
  if (cohort)     url += `&cohort_id=${cohort}`;
  if (year)       url += `&year_id=${year}`;
  if (studyYear)  url += `&study_year=${studyYear}`;
  if (semester)   url += `&semester=${semester}`;
  if (type)       url += `&type=${type}`;
  if (search)     url += `&search=${encodeURIComponent(search)}`;

  const data = await api(url);
  if (!data) return;

  const typeLabels = { homework: "📝 Homework", quiz: "❓ Quiz", assignment: "📋 Assignment" };
  const typeColors = { homework: "#3b82f6", quiz: "#8b5cf6", assignment: "#f59e0b" };

  if (!data.length) {
    $("#hwList").html(`
      <div style="text-align:center;padding:3rem;background:white;border-radius:14px;">
        <div style="font-size:3rem;opacity:0.3;">📋</div>
        <p style="color:var(--gray);margin-top:1rem;">
          ${cohort ? 'មិនមានកិច្ចការសម្រាប់ជំនាន់នេះ' : 'មិនមានកិច្ចការ'}
        </p>
      </div>`);
    return;
  }

  $("#hwList").html(data.map((h) => {
    const isReadonly = parseInt(h.is_current) === 0;

    const cohortBadge = h.cohort_name
      ? `<span style="font-size:0.7rem;background:${isReadonly ? '#fef3c7' : '#dbeafe'};color:${isReadonly ? '#92400e' : '#1e40af'};padding:2px 8px;border-radius:10px;font-weight:600;margin-left:0.3rem;">
          🎓 ${h.cohort_name}${isReadonly ? ' · ✅ បញ្ចប់' : ''}
        </span>`
      : '';

    return `
      <div class="hw-card" style="border-top-color:${typeColors[h.type] || "#6366f1"};${isReadonly ? 'opacity:0.85;' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem;">
          <div style="font-size:0.72rem;background:${typeColors[h.type]}20;color:${typeColors[h.type]};padding:3px 10px;border-radius:20px;font-weight:700;display:inline-block;">
            ${typeLabels[h.type] || h.type}
          </div>
          ${isReadonly ? '<span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;">✅ បញ្ចប់</span>' : ''}
        </div>
        <h4>${h.title}${cohortBadge}</h4>
        <p>${h.description || ""}</p>
        <p><small>📅 ផុតកំណត់: ${h.due_date || "-"} · ពិន្ទុពេញ: ${h.max_score}</small></p>
        <p><small>✅ បានដាក់: <strong>${h.submitted_count || 0}</strong> នាក់</small></p>
        <div class="actions">
          <button class="btn ${isReadonly ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="viewHomework(${h.id})">
            ${isReadonly ? '👁️ មើល' : '📝 ដាក់ពិន្ទុ'}
          </button>
          ${!isReadonly ? `<button class="btn btn-danger btn-sm" onclick="deleteHomework(${h.id})">🗑️</button>` : ''}
        </div>
      </div>`;
  }).join(""));
}

// ============================================================
// CREATE FORM
// ============================================================
function openHomeworkForm() {
  const sid = $("#hwSubject").val();
  if (!sid) return showToast("សូមជ្រើសមុខវិជ្ជាមុន", "error");

  const cohortId = $("#hwCohortFilter").val() || currentCohortId || "";
  const cohort   = allCohorts.find((c) => c.id == cohortId);

  if (cohort && !cohort.is_current) {
    return showToast("មិនអាចបង្កើតកិច្ចការឱ្យជំនាន់ចាស់បានទេ", "error");
  }

  // ✅ ទាញ Subject Info
  const subject = allSubjects.find((s) => s.id == sid);
  const subjYear     = subject?.year_name || '-';
  const subjStudy    = subject?.study_year || '-';
  const subjSemester = subject?.semester || '-';
  const subjCode     = subject?.subject_code || '';
  const subjName     = subject?.subject_name || '';

  const cohortOpts = allCohorts
    .filter((c) => c.is_current)
    .map((c) => `<option value="${c.id}" ${c.id == cohortId ? 'selected' : ''}>${c.cohort_name} ⭐</option>`)
    .join("");

  openModal(`
    <h3>➕ បង្កើតកិច្ចការថ្មី</h3>

    <!-- ✅ បង្ហាញ Subject Info -->
    <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);padding:1rem;border-radius:12px;margin-bottom:1rem;font-size:0.85rem;color:#1e40af;line-height:1.8;">
      <div style="font-weight:700;font-size:0.95rem;margin-bottom:0.5rem;">
        📚 ${subjCode} — ${subjName}
      </div>
      <div style="display:flex;gap:0.8rem;flex-wrap:wrap;">
        <span style="background:white;padding:3px 10px;border-radius:12px;font-size:0.75rem;font-weight:600;">
          📖 ឆ្នាំទី ${subjStudy}
        </span>
        <span style="background:white;padding:3px 10px;border-radius:12px;font-size:0.75rem;font-weight:600;">
          📅 ឆមាស ${subjSemester}
        </span>
        <span style="background:white;padding:3px 10px;border-radius:12px;font-size:0.75rem;font-weight:600;">
          🗓️ ${subjYear}
        </span>
      </div>
    </div>

    <form id="hwForm">
      <input type="hidden" name="subject_id" value="${sid}">

      <label>🎓 ជំនាន់ *</label>
      <select name="cohort_id" required>
        <option value="">-- ជ្រើស --</option>
        ${cohortOpts}
      </select>

      <label>ប្រភេទ *</label>
      <select name="type" required>
        <option value="homework">📝 Homework</option>
        <option value="quiz">❓ Quiz</option>
        <option value="assignment">📋 Assignment</option>
      </select>

      <label>ចំណងជើង *</label>
      <input name="title" required>

      <label>ការពិពណ៌នា</label>
      <textarea name="description" rows="2"></textarea>

      <label>ផុតកំណត់</label>
      <input type="date" name="due_date">

      <label>ពិន្ទុពេញ *</label>
      <input type="number" name="max_score" value="100" step="0.5" required>

      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">បោះបង់</button>
        <button type="submit" class="btn btn-primary">💾 រក្សាទុក</button>
      </div>
    </form>`);

  $("#hwForm").on("submit", saveHomework);
}

async function saveHomework(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));

  if (!data.cohort_id) return showToast("សូមជ្រើសជំនាន់", "error");
  if (!data.title)     return showToast("សូមបំពេញចំណងជើង", "error");

  const res = await api("homework.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res?.success) {
    showToast("✅ បង្កើតជោគជ័យ");
    closeModal();
    loadHomework();
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
  }
}

// ============================================================
// VIEW HOMEWORK (submissions)
// ============================================================
async function viewHomework(id) {
  const data = await api(`homework.php?id=${id}`);
  if (!data || data.error) return showToast(data?.error || "រកមិនឃើញ", "error");

  const hw         = data.homework;
  const students   = data.students;
  const isReadonly = data.is_readonly || (parseInt(hw.is_current) === 0);
  const maxScore   = parseFloat(hw.max_score);
  const typeLabels = { homework: "📝 Homework", quiz: "❓ Quiz", assignment: "📋 Assignment" };

  const readonlyBanner = isReadonly
    ? `<div style="background:#fef3c7;padding:1rem;border-radius:12px;margin-bottom:1rem;border-left:4px solid #f59e0b;">
        <strong style="color:#92400e;">✅ ជំនាន់បានបញ្ចប់</strong>
        <div style="color:#78350f;font-size:0.82rem;margin-top:0.3rem;">Read-only — មិនអាចកែបានទេ</div>
      </div>`
    : "";

  if (!students.length) {
    openModal(`
      <h3>${typeLabels[hw.type] || "📝"} — ${hw.title}</h3>
      ${readonlyBanner}
      <div style="background:#fef3c7;padding:1rem;border-radius:12px;font-size:0.85rem;">
        ⚠️ មិនមានសិស្សក្នុងជំនាន់នេះ
      </div>
      <div class="modal-actions" style="margin-top:1rem;">
        <button class="btn btn-secondary" onclick="closeModal()">បិទ</button>
      </div>`);
    return;
  }

  const actionButtons = isReadonly ? '' : `
    <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap;">
      <button type="button" class="btn btn-success btn-sm" onclick="hwMarkAll(true, ${maxScore})">✅ ទាំងអស់</button>
      <button type="button" class="btn btn-danger btn-sm" onclick="hwMarkAll(false)">❌ មិនដាក់</button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="hwFillFull(${maxScore})">⭐ ពេញ</button>
    </div>`;

  const rows = students.map((s) => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:0.6rem;">
        <div style="font-size:0.85rem;font-weight:600;">${s.full_name}</div>
        <div style="font-size:0.7rem;color:var(--gray);">${s.student_code}${s.cohort_name ? ` · 🎓 ${s.cohort_name}` : ''}</div>
      </td>
      <td style="padding:0.6rem;text-align:center;">
        <input type="checkbox" class="hw-submit-check" data-sid="${s.student_id}" 
               ${s.submitted ? "checked" : ""} 
               ${isReadonly ? "disabled" : `onchange="hwToggleScore(this)"`}>
      </td>
      <td style="padding:0.6rem;text-align:center;">
        <input type="number" class="hw-score-input" data-sid="${s.student_id}" 
               min="0" max="${maxScore}" step="0.25" 
               value="${s.score !== null && s.score !== undefined ? s.score : ""}" 
               ${!s.submitted || isReadonly ? "disabled" : ""}>
      </td>
    </tr>`).join("");

  openModal(`
    <h3>${typeLabels[hw.type] || "📝"} — ${hw.title}</h3>
    ${readonlyBanner}
    <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);padding:0.8rem 1rem;border-radius:12px;margin-bottom:1rem;font-size:0.82rem;color:#1e40af;">
      <div style="display:flex;gap:1.2rem;flex-wrap:wrap;">
        <div>🎓 <strong>ជំនាន់:</strong> ${hw.cohort_name || '-'}</div>
        <div>👥 <strong>សិស្ស:</strong> ${students.length}</div>
        <div>🎯 <strong>ពិន្ទុពេញ:</strong> ${maxScore}</div>
      </div>
    </div>
    ${actionButtons}
    <div style="max-height:50vh;overflow-y:auto;border:1px solid var(--border);border-radius:12px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;position:sticky;top:0;">
            <th style="padding:0.7rem;text-align:left;font-size:0.75rem;">ឈ្មោះ</th>
            <th style="padding:0.7rem;text-align:center;font-size:0.75rem;">បានដាក់</th>
            <th style="padding:0.7rem;text-align:center;font-size:0.75rem;">ពិន្ទុ /${maxScore}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="modal-actions" style="margin-top:1rem;">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">បិទ</button>
      ${!isReadonly ? `<button type="button" class="btn btn-primary" onclick="saveSubmissions(${hw.id})">💾 រក្សាទុក</button>` : ''}
    </div>`);
}

function hwToggleScore(chk) {
  const sid = $(chk).data("sid");
  const $i  = $(`.hw-score-input[data-sid="${sid}"]`);
  if ($i.length) {
    $i.prop("disabled", !chk.checked);
    if (!chk.checked) $i.val("");
  }
}

function hwMarkAll(sub, ms = 0) {
  $(".hw-submit-check").each(function () {
    this.checked = sub;
    hwToggleScore(this);
    if (sub && ms > 0) {
      const $i = $(`.hw-score-input[data-sid="${$(this).data("sid")}"]`);
      if ($i.length && !$i.val()) $i.val(ms);
    }
  });
}

function hwFillFull(ms) {
  $(".hw-score-input").each(function () {
    const sid  = $(this).data("sid");
    const $chk = $(`.hw-submit-check[data-sid="${sid}"]`);
    if ($chk.length) { $chk.prop("checked", true); $(this).prop("disabled", false); }
    $(this).val(ms);
  });
}

async function saveSubmissions(hid) {
  const subs = [];
  $(".hw-submit-check").each(function () {
    const sid = parseInt($(this).data("sid"));
    const $i  = $(`.hw-score-input[data-sid="${sid}"]`);
    let score = null;
    if (this.checked && $i.length && $i.val() !== "") {
      score = parseFloat($i.val());
      if (isNaN(score)) score = null;
    }
    subs.push({ student_id: sid, submitted: this.checked, score });
  });

  if (!subs.length) return showToast("គ្មាន", "error");

  const res = await api("homework.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ homework_id: hid, submissions: subs }),
  });

  if (res?.success) {
    showToast(res.message);
    closeModal();
    loadHomework();
  }
}

async function deleteHomework(id) {
  if (!confirm("លុប?")) return;
  const res = await api(`homework.php?id=${id}`, { method: "DELETE" });
  if (res?.success) {
    showToast("✅");
    loadHomework();
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
  }
}

async function refreshHomework() {
  try {
    const sid = $("#hwSubject").val();
    if (!sid) return showToast("សូមជ្រើសមុខវិជ្ជា", "error");
    await loadHomework();
    showToast("✅ ផ្ទុករួចរាល់", "success");
  } catch (e) {
    showToast("មានបញ្ហា: " + e.message, "error");
  }
}
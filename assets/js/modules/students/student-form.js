/**
 * STUDENT FORM
 */

function openStudentForm(s = null) {
  const isEdit = !!s;

  const statusOpts = [
    { v: "active",    l: "🟢 កំពុងរៀន" },
    { v: "graduated", l: "🎓 បញ្ចប់" },
    { v: "dropped",   l: "🔴 ឈប់" },
  ].map((o) => `<option value="${o.v}" ${s?.status === o.v ? "selected" : ""}>${o.l}</option>`).join("");

  const cohortOpts = allCohorts.map((c) =>
    `<option value="${c.id}" ${s?.cohort_id == c.id ? "selected" : ""}>${c.cohort_name}${c.is_current ? ' ⭐' : ''}</option>`
  ).join("");

  const yearOpts = allYears.map((y) =>
    `<option value="${y.id}" ${s?.entry_year_id == y.id ? "selected" : ""}>${y.year_name}</option>`
  ).join("");

  openModal(`
    <h3>${isEdit ? "✏️ កែសិស្ស" : "➕ បន្ថែមសិស្ស"}</h3>
    <form id="studentForm">
      ${s ? `<input type="hidden" name="id" value="${s.id}">` : ""}
      <label>លេខកូដ *</label>
      <input name="student_code" required value="${s?.student_code || ""}" ${isEdit ? "readonly" : ""}>
      <label>ឈ្មោះ *</label>
      <input name="full_name" required value="${s?.full_name || ""}">
      <label>ភេទ *</label>
      <select name="gender" required>
        <option value="M" ${s?.gender === "M" ? "selected" : ""}>ប្រុស</option>
        <option value="F" ${s?.gender === "F" ? "selected" : ""}>ស្រី</option>
      </select>
      <label>🎓 ជំនាន់</label>
      <select name="cohort_id"><option value="">-- ជ្រើស --</option>${cohortOpts}</select>
      <label>📅 ឆ្នាំចូលរៀន</label>
      <select name="entry_year_id"><option value="">-- ជ្រើស --</option>${yearOpts}</select>
      <label>📊 ស្ថានភាព</label>
      <select name="status">${statusOpts}</select>
      <label>ថ្ងៃកំណើត</label>
      <input type="date" name="dob" value="${s?.dob || ""}">
      <label>ទូរស័ព្ទ</label>
      <input name="phone" value="${s?.phone || ""}">
      <label>Email</label>
      <input type="email" name="email" value="${s?.email || ""}">
      <label>អាសយដ្ឋាន</label>
      <textarea name="address" rows="2">${s?.address || ""}</textarea>
      ${!isEdit ? `
        <label>📸 រូបថត</label>
        <div class="photo-upload-zone" onclick="document.getElementById('formPhotoInput').click()">
          <div id="formPhotoPreview"><div class="icon">📷</div><p>ចុចដើម្បីជ្រើស</p></div>
        </div>
        <input type="file" id="formPhotoInput" name="photo" accept="image/*" style="display:none;" onchange="previewFormPhoto(this)">
      ` : ""}
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">បោះបង់</button>
        <button type="submit" class="btn btn-primary">💾 រក្សាទុក</button>
      </div>
    </form>`);

  $("#studentForm").on("submit", saveStudent);
}

function previewFormPhoto(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => $("#formPhotoPreview").html(`<img src="${e.target.result}" class="photo-preview">`);
    reader.readAsDataURL(input.files[0]);
  }
}

async function saveStudent(e) {
  e.preventDefault();
  const fd   = new FormData(e.target);
  const data = Object.fromEntries(fd);
  const isEdit = !!data.id;
  const photoInput = document.getElementById("formPhotoInput");
  const hasPhoto   = photoInput && photoInput.files && photoInput.files[0];

  let res;
  if (isEdit) {
    res = await api("students.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } else if (hasPhoto) {
    const fdNew = new FormData();
    Object.entries(data).forEach(([k, v]) => fdNew.append(k, v));
    fdNew.append("photo", photoInput.files[0]);
    res = await api("students.php", { method: "POST", body: fdNew });
  } else {
    res = await api("students.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  if (res && !res.error) {
    showToast("✅ រក្សាទុកជោគជ័យ");
    closeModal();
    loadStudents();
    loadDashboard();
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
  }
}
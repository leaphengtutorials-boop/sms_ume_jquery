/**
 * ============================================================
 * STUDENT IMPORT — CSV Import + Bulk Photo
 * ============================================================
 */

// ============================================================
// CSV IMPORT
// ============================================================
function openImportModal() {
  openModal(`
    <h3>📥 Import សិស្សពី Excel/CSV</h3>
    <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);padding:1rem;border-radius:12px;margin-bottom:1.2rem;font-size:0.85rem;color:#1e40af;">
      <strong>📌 ជំហាន៖</strong><br>
      1️⃣ ចុច <strong>"ទាញគំរូ"</strong><br>
      2️⃣ បំពេញទិន្នន័យ<br>
      3️⃣ Save ជា <strong>CSV UTF-8</strong><br>
      4️⃣ Upload
    </div>
    <form id="importForm" enctype="multipart/form-data">
      <label>📁 File CSV *</label>
      <input type="file" name="file" accept=".csv,.txt" required>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">បោះបង់</button>
        <button type="button" class="btn btn-info" onclick="downloadTemplate()">📄 ទាញគំរូ</button>
        <button type="submit" class="btn btn-success">📥 Import</button>
      </div>
    </form>`);

  $("#importForm").on("submit", submitImport);
}

async function submitImport(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const $btn = $(e.target).find('button[type="submit"]');
  $btn.prop("disabled", true).text("⏳...");

  const res = await api("import.php", { method: "POST", body: fd });
  if (res?.success) {
    showToast(res.message);
    closeModal();
    loadStudents();
    loadSubjects();
    loadDashboard();
  } else {
    $btn.prop("disabled", false).text("📥 Import");
  }
}

function downloadTemplate() {
  window.location.href = `${API}/template.php`;
}


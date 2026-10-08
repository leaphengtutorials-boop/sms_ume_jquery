/**
 * ============================================================
 * STUDENT PHOTO — Upload / Delete
 * ============================================================
 */

function openPhotoModal(studentId, studentName, currentPhoto) {
  openModal(`
    <h3>📸 គ្រប់គ្រងរូបថត</h3>
    <p style="text-align:center;color:var(--gray);margin-bottom:1rem;">${studentName}</p>
    <div class="photo-upload-zone" onclick="document.getElementById('modalPhotoInput').click()">
      <div id="modalPhotoPreview">
        ${currentPhoto ? `<img src="${currentPhoto}" class="photo-preview">` : `<div class="icon">📷</div><p>ចុចដើម្បីជ្រើស</p>`}
      </div>
    </div>
    <input type="file" id="modalPhotoInput" accept="image/*" style="display:none;" onchange="previewModalPhoto(this)">
    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">បោះបង់</button>
      ${currentPhoto ? `<button class="btn btn-danger" onclick="deletePhotoFromModal(${studentId})">🗑️ លុប</button>` : ""}
      <button class="btn btn-primary" onclick="uploadPhoto(${studentId})" id="uploadBtn">📤 Upload</button>
    </div>`);
}

function previewModalPhoto(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => $("#modalPhotoPreview").html(`<img src="${e.target.result}" class="photo-preview">`);
    reader.readAsDataURL(input.files[0]);
  }
}

async function uploadPhoto(studentId) {
  const input = document.getElementById("modalPhotoInput");
  if (!input.files || !input.files[0]) return showToast("សូមជ្រើសរូបថត", "error");

  const $btn = $("#uploadBtn");
  $btn.prop("disabled", true).text("⏳...");

  const fd = new FormData();
  fd.append("student_id", studentId);
  fd.append("photo", input.files[0]);

  const res = await api("photo.php", { method: "POST", body: fd });
  if (res?.success) {
    showToast("✅ Upload ជោគជ័យ");
    closeModal();
    loadStudents();
  } else {
    $btn.prop("disabled", false).text("📤 Upload");
  }
}

async function deletePhoto(studentId) {
  if (!confirm("លុបរូបថត?")) return;
  const res = await api(`photo.php?student_id=${studentId}`, { method: "DELETE" });
  if (res?.success) {
    showToast("✅ លុបជោគជ័យ");
    loadStudents();
  }
}

function deletePhotoFromModal(studentId) {
  closeModal();
  setTimeout(() => deletePhoto(studentId), 300);
}
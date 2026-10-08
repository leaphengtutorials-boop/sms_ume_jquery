/**
 * STUDENTS
 */

async function loadStudents() {
  const data = await api("students.php");
  if (!data) return;

  allStudents = data;

  const subjOpts = '<option value="">-- មុខវិជ្ជា --</option>' +
    allSubjects.map((s) => `<option value="${s.id}">${s.subject_code} - ${s.subject_name}</option>`).join("");
  $("#studentSubjectFilter").html(subjOpts);

  filterStudents();
}

function filterStudents() {
  const q       = ($("#studentSearch").val() || "").toLowerCase();
  const gender  = $("#studentGenderFilter").val() || "";
  const pf      = $("#studentPhotoFilter").val() || "";
  const status  = $("#studentStatusFilter").val() || "";
  const subject = $("#studentSubjectFilter").val() || "";

  let filtered = allStudents;

  if (q) filtered = filtered.filter((s) =>
    s.full_name.toLowerCase().includes(q) ||
    s.student_code.toLowerCase().includes(q) ||
    (s.phone && s.phone.includes(q))
  );
  if (gender) filtered = filtered.filter((s) => s.gender === gender);
  if (pf === "has")  filtered = filtered.filter((s) => s.photo);
  else if (pf === "none") filtered = filtered.filter((s) => !s.photo);
  if (status) filtered = filtered.filter((s) => s.status === status);

  if (subject) {
    filtered = filtered.filter((s) =>
      s.subjects && s.subjects.includes(parseInt(subject))
    );
  }

  renderStudents(filtered);
}

function statusBadge(s) {
  if (s.status === "graduated") {
    return '<span class="badge" style="background:#d1fae5;color:#065f46;padding:4px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;">🎓 បញ្ចប់</span>';
  }
  if (s.status === "dropped") {
    return '<span class="badge" style="background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;">🔴 ឈប់</span>';
  }
  return '<span class="badge" style="background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;">🟢 កំពុងរៀន</span>';
}

function renderStudents(data) {
  $("#studentCount").text(`${data.length} នាក់`);

  const $listView = $("#studentsListView");
  if (!$listView.length) return;

  if (!data.length) {
    $listView.html(`
      <div class="empty-state">
        <div class="icon">👥</div>
        <p>មិនមានសិស្ស</p>
        <button class="btn btn-primary" onclick="openStudentForm()">➕ បន្ថែម</button>
      </div>`);
    return;
  }

  let html = `
    <div class="student-list-header">
      <div>#</div>
      <div>រូបថត</div>
      <div>ឈ្មោះ</div>
      <div>ស្ថានភាព</div>
      <div>មុខវិជ្ជា</div>
      <div style="text-align:right;">សកម្មភាព</div>
    </div>`;

  data.forEach((s, idx) => {
    const photoHtml = s.photo
      ? `<img src="${s.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
      : `<span style="font-size:1.5rem;">${s.gender === "M" ? "👨" : "👩"}</span>`;

    html += `
      <div class="student-list-item">
        <div class="index">${idx + 1}</div>
        <div class="photo">${photoHtml}</div>
        <div class="info">
          <div class="name"
               style="cursor:pointer;color:var(--primary);"
               onclick="openStudentHistory(${s.id}, '${esc(s.full_name)}')"
               title="ចុចដើម្បីមើលប្រវត្តិ">
            ${s.full_name}
          </div>
          <div class="code">📌 ${s.student_code}</div>
        </div>
        <div>${statusBadge(s)}</div>
        <div>
          <button class="btn btn-sm btn-info"
                  onclick="openStudentHistory(${s.id}, '${esc(s.full_name)}')"
                  style="font-size:0.72rem;">📚 ប្រវត្តិ</button>
        </div>
        <div class="actions">
          <button onclick="editStudentById(${s.id})" title="កែ">✏️</button>
          <button onclick="openPhotoModal(${s.id}, '${esc(s.full_name)}', '${s.photo || ""}')" title="រូបថត">📸</button>
          <button onclick="deleteStudent(${s.id})" title="លុប">🗑️</button>
        </div>
      </div>`;
  });

  $listView.html(html);
}

function editStudentById(id) {
  const s = allStudents.find((x) => x.id == id);
  if (!s) return;
  openStudentForm(s);
}

async function deleteStudent(id) {
  if (!confirm("លុបសិស្សនេះ?")) return;
  const res = await api(`students.php?id=${id}`, { method: "DELETE" });
  if (res?.success) {
    showToast("✅ លុបជោគជ័យ");
    loadStudents();
    loadDashboard();
  }
}
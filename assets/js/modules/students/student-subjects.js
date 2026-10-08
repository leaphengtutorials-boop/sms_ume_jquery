/**
 * ============================================================
 * STUDENT SUBJECTS — មើលមុខវិជ្ជាសិស្ស + បញ្ចប់
 * ============================================================
 */

async function openStudentSubjects(studentId, studentName) {
  log("🔵 openStudentSubjects:", { studentId, studentName });

  const data = await api(`enrollment.php?history=1&student_id=${studentId}`);
  if (!data) return;

  const statusMap = {
    active:    { emoji: "🟢", label: "កំពុងរៀន", color: "#1e40af", bg: "#dbeafe" },
    completed: { emoji: "✅", label: "បញ្ចប់",   color: "#065f46", bg: "#d1fae5" },
    dropped:   { emoji: "🔴", label: "ឈប់",     color: "#991b1b", bg: "#fee2e2" },
  };

  const activeSubjects = data.filter((h) => h.status === 'active');

  if (!data.length) {
    openModal(`
      <h3>📚 មុខវិជ្ជារបស់ — ${studentName}</h3>
      <p style="text-align:center;color:var(--gray);padding:2rem;">
        📭 មិនមានមុខវិជ្ជា
      </p>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">បិទ</button>
      </div>`);
    return;
  }

  // Render table
  const rows = data.map((h) => {
    const st = statusMap[h.status] || statusMap.active;
    const actionCell = h.status === 'active'
      ? `<button class="btn btn-success btn-sm complete-subject-btn" 
                data-sid="${studentId}" 
                data-subjid="${h.subject_id}"
                data-subjname="${esc(h.subject_name)}"
                style="padding:0.3rem 0.6rem;font-size:0.72rem;">
          ✅ បញ្ចប់
        </button>`
      : '<span style="color:var(--gray);font-size:0.72rem;">-</span>';

    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:0.7rem;">
          <strong>${h.subject_code}</strong><br>
          <small style="color:var(--gray);">${h.subject_name}</small>
        </td>
        <td style="padding:0.7rem;font-size:0.82rem;">${h.year_name || '-'}</td>
        <td style="padding:0.7rem;text-align:center;">
          <span style="background:${st.bg};color:${st.color};padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;">
            ${st.emoji} ${st.label}
          </span>
        </td>
        <td style="padding:0.7rem;text-align:center;">
          <strong style="color:#6366f1;">${h.total_score || '-'}</strong>
        </td>
        <td style="padding:0.7rem;text-align:center;">
          <strong class="grade-${h.grade}">${h.grade || '-'}</strong>
        </td>
        <td style="padding:0.7rem;text-align:center;">${actionCell}</td>
      </tr>`;
  }).join("");

  openModal(`
    <h3>📚 មុខវិជ្ជារបស់ — ${studentName}</h3>
    
    <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);padding:1rem;border-radius:12px;margin-bottom:1.2rem;font-size:0.85rem;color:#1e40af;">
      <strong>សរុប:</strong> ${data.length} · 
      <strong>✅ បញ្ចប់:</strong> ${data.filter(h => h.status === 'completed').length} · 
      <strong>🟢 កំពុងរៀន:</strong> ${activeSubjects.length}
    </div>

    <div style="max-height:55vh;overflow-y:auto;border:1px solid var(--border);border-radius:12px;">
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead>
          <tr style="background:#f8fafc;position:sticky;top:0;z-index:10;">
            <th style="padding:0.7rem;text-align:left;">មុខវិជ្ជា</th>
            <th style="padding:0.7rem;text-align:left;">ឆ្នាំ</th>
            <th style="padding:0.7rem;text-align:center;">ស្ថានភាព</th>
            <th style="padding:0.7rem;text-align:center;">ពិន្ទុសរុប</th>
            <th style="padding:0.7rem;text-align:center;">និទ្ទេស</th>
            <th style="padding:0.7rem;text-align:center;">សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <div class="modal-actions" style="margin-top:1rem;">
      <button class="btn btn-secondary" onclick="closeModal()">បិទ</button>
    </div>`);

  // ✅ Bind complete buttons
  $(document).off("click", ".complete-subject-btn")
             .on("click", ".complete-subject-btn", function () {
    const studentId = parseInt($(this).data("sid"));
    const subjectId = parseInt($(this).data("subjid"));
    const subjectName = $(this).data("subjname");
    const studentName = $("h3").text().replace("📚 មុខវិជ្ជារបស់ — ", "");
    completeStudentSubject(studentId, subjectId, subjectName, studentName);
  });
}

// ============================================================
// COMPLETE SUBJECT FOR STUDENT
// ============================================================
async function completeStudentSubject(studentId, subjectId, subjectName, studentName) {
  if (!confirm(`បញ្ចប់មុខវិជ្ជា "${subjectName}" សម្រាប់ "${studentName}"?\n\n(ត្រូវបំពេញពិន្ទុទាំងអស់ លើកលែង Final)`)) return;

  const res = await api("enrollment.php", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      subject_id: subjectId,
      status: 'completed',
    }),
  });

  if (res?.success) {
    showToast("✅ បញ្ចប់មុខវិជ្ជាជោគជ័យ");
    openStudentSubjects(studentId, studentName);   // Reload popup
    loadStudents();                                 // Refresh list
  } else if (res?.missing) {
    alert(`⚠️ មិនអាចបញ្ចប់បាន!\n\nត្រូវបំពេញពិន្ទុទាំងនេះជាមុន:\n${res.missing.map(m => '• ' + m).join('\n')}`);
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
  }
}
/**
 * STUDENT HISTORY — ប្រវត្តិមុខវិជ្ជា + Button បញ្ចប់
 */

async function openStudentHistory(studentId, studentName) {
  const data = await api(`enrollment.php?history=1&student_id=${studentId}`);
  if (!data) return;

  const statusMap = {
    active:    { emoji: "🟢", label: "កំពុងរៀន", color: "#1e40af", bg: "#dbeafe" },
    completed: { emoji: "✅", label: "បញ្ចប់",   color: "#065f46", bg: "#d1fae5" },
    dropped:   { emoji: "🔴", label: "ឈប់",     color: "#991b1b", bg: "#fee2e2" },
  };

  const rows = data.map((h) => {
    const st = statusMap[h.status] || statusMap.active;
    const actionCell = h.status === 'active'
      ? `<button class="btn btn-success btn-sm complete-subject-btn"
                data-sid="${studentId}"
                data-subjid="${h.subject_id}"
                data-subjname="${esc(h.subject_name)}"
                data-studentname="${esc(studentName)}"
                style="padding:0.3rem 0.6rem;font-size:0.72rem;">✅ បញ្ចប់</button>`
      : '-';

    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:0.7rem;">
          <strong>${h.subject_code}</strong><br>
          <small style="color:var(--gray);">${h.subject_name}</small>
        </td>
        <td style="padding:0.7rem;font-size:0.75rem;">
          📖 ឆ្នាំ ${h.study_year} · 📅 ឆមាស ${h.semester}<br>
          🗓️ ${h.year_name || '-'}
        </td>
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

  const completed = data.filter(h => h.status === 'completed').length;
  const active    = data.filter(h => h.status === 'active').length;

  openModal(`
    <h3>📚 ប្រវត្តិមុខវិជ្ជា — ${studentName}</h3>
    <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);padding:1rem;border-radius:12px;margin-bottom:1.2rem;font-size:0.85rem;color:#1e40af;">
      <strong>សរុប:</strong> ${data.length} ·
      <strong>✅ បញ្ចប់:</strong> ${completed} ·
      <strong>🟢 កំពុងរៀន:</strong> ${active}
    </div>
    <div style="max-height:55vh;overflow-y:auto;border:1px solid var(--border);border-radius:12px;">
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
        <thead>
          <tr style="background:#f8fafc;position:sticky;top:0;z-index:10;">
            <th style="padding:0.7rem;text-align:left;">មុខវិជ្ជា</th>
            <th style="padding:0.7rem;text-align:left;">ឆ្នាំ/ឆមាស</th>
            <th style="padding:0.7rem;text-align:center;">ស្ថានភាព</th>
            <th style="padding:0.7rem;text-align:center;">ពិន្ទុ</th>
            <th style="padding:0.7rem;text-align:center;">និទ្ទេស</th>
            <th style="padding:0.7rem;text-align:center;">សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" style="padding:2rem;text-align:center;color:var(--gray);">មិនមាន</td></tr>'}</tbody>
      </table>
    </div>
    <div class="modal-actions" style="margin-top:1rem;">
      <button class="btn btn-secondary" onclick="closeModal()">បិទ</button>
    </div>`);

  $(document).off("click", ".complete-subject-btn")
             .on("click", ".complete-subject-btn", function () {
    const sid   = parseInt($(this).data("sid"));
    const subjid = parseInt($(this).data("subjid"));
    const subjname = $(this).data("subjname");
    const sname = $(this).data("studentname");
    completeStudentSubject(sid, subjid, subjname, sname);
  });
}

async function completeStudentSubject(studentId, subjectId, subjectName, studentName) {
  if (!confirm(`បញ្ចប់មុខវិជ្ជា "${subjectName}" សម្រាប់ "${studentName}"?\n\n(ត្រូវបំពេញពិន្ទុទាំងអស់ លើកលែង Final)`)) return;

  const res = await api("enrollment.php", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, subject_id: subjectId, status: 'completed' }),
  });

  if (res?.success) {
    showToast("✅ បញ្ចប់មុខវិជ្ជាជោគជ័យ");
    openStudentHistory(studentId, studentName);
    loadStudents();
  } else if (res?.missing) {
    alert(`⚠️ មិនអាចបញ្ចប់បាន!\n\nត្រូវបំពេញ:\n${res.missing.map(m => '• ' + m).join('\n')}`);
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
  }
}
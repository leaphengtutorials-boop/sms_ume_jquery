/**
 * ============================================================
 * DASHBOARD
 * ============================================================
 */

async function loadDashboard() {
  const [students, subjects, years] = await Promise.all([
    api("students.php"),
    api("subjects.php"),
    api("academic_years.php"),
  ]);

  if (!students || !subjects) return;

  const active = students.filter((s) => s.status === "active").length;
  const grad   = students.filter((s) => s.status === "graduated").length;

  $("#statsGrid").html(`
    <div class="stat-card"><div class="icon">👥</div><h3>${active}</h3><p>សិស្សកំពុងរៀន</p></div>
    <div class="stat-card green"><div class="icon">📚</div><h3>${subjects.length}</h3><p>មុខវិជ្ជា</p></div>
    <div class="stat-card orange"><div class="icon">📅</div><h3>${years?.length || 0}</h3><p>ឆ្នាំ</p></div>
    <div class="stat-card red"><div class="icon">🎓</div><h3>${grad}</h3><p>បញ្ចប់</p></div>`);

  $("#activeSubjects").html(
    subjects.slice(0, 5).map((s) => `
      <div style="padding:0.6rem 0;border-bottom:1px solid var(--light);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong style="font-size:0.9rem;">${s.subject_name}</strong>
          <div style="font-size:0.72rem;color:var(--gray);">${s.subject_code} · ${s.total_weeks} សប្តាហ៍</div>
        </div>
        <span style="background:var(--primary-light);color:var(--primary);padding:3px 8px;border-radius:20px;font-size:0.7rem;font-weight:700;">${s.student_count || 0} សិស្ស</span>
      </div>`).join("") || '<p style="color:var(--gray);">មិនមាន</p>'
  );

  $("#topStudents").html('<p style="color:var(--gray);">មើលក្នុងលទ្ធផល</p>');
}
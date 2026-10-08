/**
 * ============================================================
 * ATTENDANCE WEEKS — Auto Week Selection
 * ============================================================
 */

async function loadAttendanceWeeks() {
  const sid      = $("#attSubject").val();
  const cohortId = $("#attFilterCohort").val() || "";
  const $weekEl  = $("#attWeek");
  if (!$weekEl.length) return;

  if (!sid) {
    $weekEl.html('<option value="">-- សប្តាហ៍ --</option>');
    return;
  }

  const key        = `${sid}_${cohortId || 'all'}`;
  const subj       = allSubjects.find((s) => s.id == sid);
  const totalWeeks = subj?.total_weeks || 15;

  // Fetch last week from server
  let lastWeek = 0;
  let completed = false;
  try {
    let url = `attendance.php?last_week=1&subject_id=${sid}`;
    if (cohortId) url += `&cohort_id=${cohortId}`;
    const res = await api(url);
    if (res) {
      lastWeek  = parseInt(res.last_week || 0);
      completed = !!res.completed;
    }
  } catch (e) {}

  // Show "completed"
  if (completed) {
    $weekEl.html(`<option value="${lastWeek}" selected>✅ បានបញ្ចប់ (${lastWeek}/${totalWeeks})</option>`);
    $weekEl.val(lastWeek);
    const $info = $("#attWeekInfo");
    if ($info.length) {
      $info.html(`<span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;">✅ បានបញ្ចប់គ្រប់សប្តាហ៍</span>`);
    }
    return;
  }

  // Memory
  let targetWeek;
  if (attendanceWeekSelected[key] !== undefined) {
    targetWeek = attendanceWeekSelected[key];
  } else {
    if (lastWeek === 0) targetWeek = 1;
    else if (lastWeek >= totalWeeks) targetWeek = totalWeeks;
    else targetWeek = lastWeek + 1;
    attendanceWeekSelected[key] = targetWeek;
  }

  if (targetWeek < 1) targetWeek = 1;
  if (targetWeek > totalWeeks) targetWeek = totalWeeks;

  let html = '<option value="">-- សប្តាហ៍ --</option>';
  for (let i = 1; i <= totalWeeks; i++) {
    const sel  = (i === targetWeek) ? 'selected' : '';
    const done = (i <= lastWeek) ? ' ✓' : '';
    html += `<option value="${i}" ${sel}>សប្តាហ៍ ${i}${done}</option>`;
  }
  $weekEl.html(html);
  $weekEl.val(targetWeek);

  const $info = $("#attWeekInfo");
  if ($info.length) {
    if (lastWeek === 0) {
      $info.html(`<span style="background:#dbeafe;color:#1e40af;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;">📅 ចាប់ផ្តើម</span>`);
    } else {
      $info.html(`<span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;">📌 ស្រង់រួច: ${lastWeek}/${totalWeeks}</span>`);
    }
  }
}

async function refreshAttendance() {
  try {
    const sid      = $("#attSubject").val();
    const cohortId = $("#attFilterCohort").val() || "";
    if (!sid) return showToast("សូមជ្រើសមុខវិជ្ជា", "error");

    const key = `${sid}_${cohortId || 'all'}`;
    delete attendanceWeekSelected[key];

    await loadAttendanceWeeks();
    await loadAttendance();
    showToast("✅ ផ្ទុករួចរាល់", "success");
  } catch (e) {
    console.error(e);
    showToast("មានបញ្ហា: " + e.message, "error");
  }
}
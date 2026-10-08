/**
 * CORE / INIT — Entry Point
 */

$(function () {
  log("🚀 App initializing...");

  setupTabs();
  setupSettingsTabs();
  setDefaultDates();

  Promise.all([loadYears(), loadCohorts()])
    .then(() => Promise.all([loadSubjects(), loadStudents()]))
    .then(() => {
      applyDefaultFilters();
      setupCohortYearLinks();
      loadDashboard();
      log("✅ App ready");
    });

  bindSubjectsEvents();
  bindStudentsEvents();
  bindEnrollmentEvents();
  bindAttendanceEvents();
  bindHomeworkEvents();
  bindScoresEvents();
  bindFinalEvents();
  bindReportEvents();
  bindSettingsEvents();
  bindCompletedEvents();

  $("#modal").on("click", function (e) {
    if (e.target.id === "modal") closeModal();
  });
});

function bindSubjectsEvents() {
  $("#subjectYearFilter, #subjectStudyYearFilter, #subjectSemesterFilter, " +
    "#subjectCohortFilter, #subjectGroupBy").on("change", loadSubjects);
  $("#subjectSearch").on("input", debounce(loadSubjects, 400));
}

function bindStudentsEvents() {
  $("#studentSearch").on("input", debounce(filterStudents, 300));
  $("#studentGenderFilter, #studentPhotoFilter, #studentStatusFilter, #studentSubjectFilter")
    .on("change", filterStudents);
}

function bindEnrollmentEvents() {
  $("#enrollSubject").on("change", loadEnrollment);
  $("#enrollSearch").on("input", debounce(loadEnrollment, 400));
  $("#enrollCohortFilter, #enrollYearFilter, #enrollStatusFilter, " +
    "#enrollStudentStatusFilter, #enrollViewMode").on("change", loadEnrollment);
}

function bindAttendanceEvents() {
  $("#attSubject").on("change", async function () {
    await loadAttendanceWeeks();
    loadAttendance();
  });
  $("#attWeek").on("change", loadAttendance);
  $("#attFilterSearch").on("input", debounce(loadAttendance, 400));
  $("#attFilterCohort").on("change", async function () {
    if ($("#attReportView").is(":visible")) loadAttReport();
    else { await loadAttendanceWeeks(); loadAttendance(); }
  });
  $("#attOnlyCurrent").on("change", function () {
    loadAttendance();
    if ($("#attReportView").is(":visible")) loadAttReport();
  });
  $("#attReportSubject").on("change", loadAttReport);
  $("#attReportSearch").on("input", debounce(loadAttReport, 400));
}

function bindHomeworkEvents() {
  // Subject + Filters
  $("#hwSubject, #hwCohortFilter, #hwYearFilter, #hwStudyYearFilter, #hwSemesterFilter, #hwType")
    .on("change", loadHomework);
  $("#hwFilterSearch").on("input", debounce(loadHomework, 400));
}

function bindScoresEvents() {
  $("#scoreSubject, #scoreFilterCohort").on("change", loadScoreSheet);
  $("#scoreFilterSearch").on("input", debounce(loadScoreSheet, 400));
}

function bindFinalEvents() {
  $("#finalSubject, #finalFilterCohort").on("change", loadFinalScores);
  $("#finalFilterSearch").on("input", debounce(loadFinalScores, 400));
}

function bindReportEvents() {
  $("#reportSubject, #reportFilterCohort, #reportViewMode").on("change", loadReport);
  $("#reportFilterSearch").on("input", debounce(loadReport, 400));
}

function bindSettingsEvents() {
  $("#w_attendance, #w_homework, #w_quiz, #w_midterm, #w_assignment, #w_final")
    .on("input", updateWeightTotal);
}

function bindCompletedEvents() {
  $("#compCohortFilter, #compYearFilter, #compStudyYearFilter, " +
    "#compSemesterFilter, #compSubjectFilter, #compStudentStatusFilter")
    .on("change", loadCompleted);
  $("#compSearch").on("input", debounce(loadCompleted, 400));
}
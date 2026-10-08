/**
 * UI / TABS — Tab Navigation
 */

function setupTabs() {
  $(".menu a").on("click", function () {
    $(".menu a").removeClass("active");
    $(this).addClass("active");
    $(".tab").removeClass("active");
    $("#" + $(this).data("tab")).addClass("active");
    $("#sidebar").removeClass("open");

    const tab = $(this).data("tab");

    if (tab === "dashboard")  loadDashboard();
    if (tab === "subjects")   loadSubjects();
    if (tab === "students")   loadStudents();
    if (tab === "enrollment") onEnterEnrollment();
    if (tab === "attendance") onEnterAttendance();
    if (tab === "homework")   onEnterHomework();
    if (tab === "scores")     loadScoreSheet();
    if (tab === "final")      onEnterFinal();
    if (tab === "results")    loadReport();
    if (tab === "completed")  onEnterCompleted();
    if (tab === "settings")   onEnterSettings();
  });
}

function onEnterEnrollment() {
  loadSubjects().then(() => {
    if (!$("#enrollSubject").val() && $("#enrollSubject option").length > 1) {
      $("#enrollSubject").val($("#enrollSubject option:eq(1)").val());
    }
    loadEnrollment();
  });
}

function onEnterAttendance() {
  loadAttendanceWeeks();
  loadAttendance();
}

function onEnterHomework() {
  loadCohorts().then(() => {
    loadHomeworkSubjects().then(() => {
      // ✅ Populate filters
      populateHwFilters();
      updateHwCohortStatus($("#hwCohortFilter").val());
      loadHomework();
    });
  });
}

// ✅ Function ថ្មី
function populateHwFilters() {
  // Years
  const yearOpts = '<option value="">-- ឆ្នាំសិក្សា --</option>' +
    allYears.map((y) => `<option value="${y.id}">${y.year_name}</option>`).join("");
  $("#hwYearFilter").html(yearOpts);
  
  // Auto-select current year
  if (allYears.length > 0) {
    $("#hwYearFilter").val(allYears[0].id);
  }
}

function onEnterFinal() {
  // ✅ រង់ចាំ loadFinalSubjects បញ្ចប់ សិនទើប loadFinalScores
  loadFinalSubjects().then(() => {
    loadFinalScores();
  });
}

function onEnterCompleted() {
  populateCompletedFilters().then(() => loadCompleted());
}

function onEnterSettings() {
  loadWeights();
  loadRules();
  loadYearsTable();
  loadCohortsTable();
}

function setupSettingsTabs() {
  $(".set-tab").on("click", function () {
    $(".set-tab").removeClass("active");
    $(this).addClass("active");
    $(".set-panel").removeClass("active");
    $("#set-" + $(this).data("set")).addClass("active");

    const s = $(this).data("set");
    if (s === "weights") loadWeights();
    if (s === "rules")   loadRules();
    if (s === "years")   loadYearsTable();
    if (s === "cohorts") loadCohortsTable();
  });
}
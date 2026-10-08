/**
 * UI / COHORT-YEAR LINK
 */

function getYearIdForCohort(cohortId) {
  if (!cohortId || !allCohorts.length || !allYears.length) return null;

  const cohortsAsc = [...allCohorts].sort((a, b) => a.id - b.id);
  const yearsAsc   = [...allYears].sort((a, b) => a.year_name.localeCompare(b.year_name));

  const idx = cohortsAsc.findIndex((c) => c.id == cohortId);
  if (idx === -1) return null;

  if (idx < yearsAsc.length) return yearsAsc[idx].id;
  return yearsAsc[yearsAsc.length - 1].id;
}

function linkCohortToYear(cohortSelector, yearSelector) {
  const $cohort = $(cohortSelector);
  const $year   = $(yearSelector);
  if (!$cohort.length || !$year.length) return;

  $year.prop("disabled", true);

  $cohort.off("change.cylink").on("change.cylink", function () {
    const cohortId = $(this).val();
    if (!cohortId) return;
    const yearId = getYearIdForCohort(cohortId);
    if (yearId) {
      $year.val(yearId);
      $year.trigger("change");
    }
  });

  const curCohort = $cohort.val();
  if (curCohort && !$year.val()) {
    const yearId = getYearIdForCohort(curCohort);
    if (yearId) $year.val(yearId);
  }
}

function setupCohortYearLinks() {
  linkCohortToYear("#enrollCohortFilter",  "#enrollYearFilter");
  linkCohortToYear("#studentCohortFilter", "#studentEntryYearFilter");
  linkCohortToYear("#attFilterCohort",     "#attFilterYear");
  linkCohortToYear("#hwCohortFilter",      "#hwFilterYear");
  linkCohortToYear("#scoreFilterCohort",   "#scoreFilterYear");
  linkCohortToYear("#finalFilterCohort",   "#finalFilterYear");
  linkCohortToYear("#reportFilterCohort",  "#reportFilterYear");
  log("✅ Cohort ↔ Year links ready");
}

function applyDefaultFilters() {
  const latestYearId = allYears.length > 0 ? allYears[0].id : "";

  const cohortTargets = [
    "#studentCohortFilter", "#attFilterCohort", "#hwCohortFilter",
    "#scoreFilterCohort", "#finalFilterCohort", "#reportFilterCohort",
    "#enrollCohortFilter",
  ].join(", ");
  $(cohortTargets).each(function () {
    if (!$(this).val() && currentCohortId) $(this).val(currentCohortId);
  });

  const yearTargets = [
    "#studentEntryYearFilter", "#attFilterYear", "#hwFilterYear",
    "#scoreFilterYear", "#finalFilterYear", "#reportFilterYear",
    "#enrollYearFilter",
  ].join(", ");
  $(yearTargets).each(function () {
    if (!$(this).val() && latestYearId) $(this).val(latestYearId);
  });

  if (!$("#subjectYearFilter").val() && latestYearId) {
    $("#subjectYearFilter").val(latestYearId);
  }
}
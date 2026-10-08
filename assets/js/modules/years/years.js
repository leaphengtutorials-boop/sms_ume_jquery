/**
 * ============================================================
 * YEARS — Academic Years
 * ============================================================
 */

async function loadYears() {
  const data = await api("academic_years.php");
  if (!data) return;

  allYears = data.sort((a, b) => b.year_name.localeCompare(a.year_name));

  // Subject year filter
  const optAll = '<option value="">-- ឆ្នាំ --</option>' +
    allYears.map((y) => `<option value="${y.id}">${y.year_name}</option>`).join("");
  const cur1 = $("#subjectYearFilter").val();
  $("#subjectYearFilter").html(optAll);
  if (cur1) $("#subjectYearFilter").val(cur1);
  else if (allYears.length > 0) $("#subjectYearFilter").val(allYears[0].id);

  // Entry year filters
  const optEntry = '<option value="">-- ឆ្នាំ --</option>' +
    allYears.map((y) => `<option value="${y.id}">${y.year_name}</option>`).join("");

  $("#studentEntryYearFilter, #attFilterYear, #hwFilterYear, " +
    "#scoreFilterYear, #finalFilterYear, #reportFilterYear, #enrollYearFilter")
    .each(function () {
      const cur = $(this).val();
      $(this).html(optEntry);
      if (cur) $(this).val(cur);
      else if (allYears.length > 0) $(this).val(allYears[0].id);
    });
}

async function loadYearsTable() {
  await loadYears();
  const $tbody = $("#yearsTable tbody");
  if (!$tbody.length) return;

  if (!allYears.length) {
    $tbody.html('<tr><td colspan="6" style="text-align:center;padding:2rem;">មិនមាន</td></tr>');
    return;
  }

  $tbody.html(allYears.map((y) => `
    <tr>
      <td>${y.id}</td>
      <td><strong>${y.year_name}</strong></td>
      <td>${y.start_date || "-"}</td>
      <td>${y.end_date || "-"}</td>
      <td>${y.is_active ? "✅" : "❌"}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteYear(${y.id})">🗑️</button></td>
    </tr>`).join(""));
}

async function createYear() {
  const name = $("#newYearName").val().trim();
  if (!name) return showToast("សូមបំពេញឈ្មោះ", "error");

  const res = await api("academic_years.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      year_name:  name,
      start_date: $("#newYearStart").val(),
      end_date:   $("#newYearEnd").val(),
    }),
  });

  if (res?.success) {
    showToast("✅ បង្កើតឆ្នាំជោគជ័យ");
    $("#newYearName").val("");
    loadYearsTable();
    loadYears();
  }
}

async function deleteYear(id) {
  if (!confirm("លុបឆ្នាំសិក្សានេះ?")) return;
  await api(`academic_years.php?id=${id}`, { method: "DELETE" });
  showToast("✅ លុបជោគជ័យ");
  loadYearsTable();
  loadYears();
  loadSubjects();
}
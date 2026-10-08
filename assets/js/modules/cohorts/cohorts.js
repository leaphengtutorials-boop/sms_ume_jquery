/**
 * ============================================================
 * COHORTS
 * ============================================================
 */

async function loadCohorts() {
  const data = await api("cohorts.php");
  if (!data) return;

  const list = data.list || data;
  allCohorts = list.sort((a, b) => b.id - a.id);
  currentCohortId = data.current_cohort_id || (allCohorts[0]?.id || null);

  log("✅ Cohorts:", allCohorts.length, "| Current:", currentCohortId);

  const opt = '<option value="">-- ជំនាន់ --</option>' +
    allCohorts.map((c) =>
      `<option value="${c.id}">${c.cohort_name}${c.is_current ? ' ⭐' : ''}</option>`
    ).join("");

  const targets = [
    "#studentCohortFilter", "#attFilterCohort", "#hwCohortFilter",
    "#scoreFilterCohort", "#finalFilterCohort", "#reportFilterCohort",
    "#enrollCohortFilter",
  ].join(", ");

  $(targets).each(function () {
    const cur = $(this).val();
    $(this).html(opt);

    const id = $(this).attr("id");
    if (id === "enrollCohortFilter" || id === "hwCohortFilter") {
      $(this).val(currentCohortId || "");
      return;
    }

    if (cur) $(this).val(cur);
    else if (currentCohortId) $(this).val(currentCohortId);
  });

  setTimeout(() => setupCohortYearLinks(), 100);
}

async function loadCohortsTable() {
  await loadCohorts();
  const $tbody = $("#cohortsTable tbody");
  if (!$tbody.length) return;

  if (!allCohorts.length) {
    $tbody.html('<tr><td colspan="6" style="text-align:center;padding:2rem;">មិនមាន</td></tr>');
    return;
  }

  const counts = {};
  allStudents.forEach(s => {
    if (s.cohort_id) counts[s.cohort_id] = (counts[s.cohort_id] || 0) + 1;
  });

  $tbody.html(allCohorts.map((c) => `
    <tr style="${c.is_current ? 'background:#f0fdf4;' : ''}">
      <td>${c.id}</td>
      <td><strong>${c.cohort_name}</strong>${c.is_current ? ' <span style="background:#10b981;color:white;padding:2px 8px;border-radius:10px;font-size:0.65rem;">⭐</span>' : ''}</td>
      <td>${c.description || "-"}</td>
      <td><span class="badge-info">${counts[c.id] || 0} នាក់</span></td>
      <td>${c.is_current ? '⭐' : ''}</td>
      <td>
        ${c.is_current ? '-' : `
          <button class="btn btn-success btn-sm" onclick="setCurrentCohort(${c.id})">⭐</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCohort(${c.id})">🗑️</button>
        `}
      </td>
    </tr>`).join(""));
}

async function createCohort() {
  const name = $("#newCohortName").val().trim();
  if (!name) return showToast("សូមបំពេញឈ្មោះ", "error");

  const res = await api("cohorts.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cohort_name: name,
      description: $("#newCohortDesc").val(),
    }),
  });

  if (res?.success) {
    showToast("✅ បង្កើតជំនាន់ជោគជ័យ");
    $("#newCohortName").val("");
    $("#newCohortDesc").val("");
    loadCohortsTable();
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
  }
}

async function setCurrentCohort(id) {
  if (!confirm("កំណត់ជំនាន់នេះជា 'ជំនាន់បច្ចុប្បន្ន'?")) return;
  const res = await api(`cohorts.php?id=${id}&set_current=1`, { method: "PUT" });
  if (res?.success) {
    showToast("✅ កំណត់ជោគជ័យ");
    loadCohortsTable();
    loadCohorts();
  }
}

async function deleteCohort(id) {
  if (!confirm("លុបជំនាន់នេះ?")) return;
  const res = await api(`cohorts.php?id=${id}`, { method: "DELETE" });
  if (res?.success) {
    showToast("✅ លុបជោគជ័យ");
    loadCohortsTable();
    loadStudents();
  } else {
    showToast(res?.error || "បរាជ័យ", "error");
  }
}
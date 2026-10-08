/**
 * CORE / API — Fetch Wrapper
 */

function api(path, opts = {}) {
  return new Promise((resolve) => {
    const cfg = {
      url: `${API}/${path}`,
      method: opts.method || "GET",
      dataType: "json",
      success: (data) => resolve(data),
      error: (xhr) => {
        let msg = `Error ${xhr.status}`;
        try {
          msg = JSON.parse(xhr.responseText).error || msg;
        } catch (e) {}
        showToast(msg, "error");
        resolve(null);
      },
    };

    if (opts.body instanceof FormData) {
      cfg.data = opts.body;
      cfg.processData = false;
      cfg.contentType = false;
    } else if (opts.body) {
      cfg.data = opts.body;
      cfg.contentType = (opts.headers && opts.headers["Content-Type"]) || "application/json";
    }

    $.ajax(cfg);
  });
}
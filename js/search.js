const formEl = document.getElementById("search-form");
const inputEl = document.getElementById("search-input");

setTimeout(focusInput, 100);

document.body.addEventListener("click", focusInput);

formEl.addEventListener("submit", function (e) {
  e.preventDefault();
  submitForm();
});

inputEl.addEventListener("keydown", function (e) {
  if (e?.code) {
    if (e.code === "Enter") {
      e.preventDefault();
      if (e.altKey || e.ctrlKey) return;
      submitForm(e.shiftKey);
    }
  }
});

function focusInput() {
  inputEl.focus();
}

function openUrl(url, isNewTab) {
  if (isNewTab) {
    chrome.runtime.sendMessage({ openURL: url });
    return;
  }
  location.href = url;
}

function serializeForm() {
  let url = formEl.action;
  url += url.indexOf("?") >= 0 ? "&" : "?";
  const formData = new FormData(formEl);
  const params = [];
  for (let pair of formData.entries()) {
    params.push(
      encodeURIComponent(pair[0]) + "=" + encodeURIComponent(pair[1])
    );
  }
  url += params.join("&");
  return url;
}

function submitForm(newTab) {
  const url = serializeForm();
  openUrl(url, newTab);
}

serializeForm();

// function loadData(id, url) {}

const tabURL = chrome.runtime.getURL("index.html");
const thanksURL = "https://incredibletab.com/search/thanks.php";
const uninstallURL = "https://incredibletab.com/search/uninstall.php";

function existNoneMsg(methodStr) {
  return methodStr + " is not exist";
}
function existOnNone(methodStr) {
  throw new Error(existNoneMsg(methodStr));
}
function existOnNonWarn(methodStr) {
  console.warn(existNoneMsg(methodStr));
}

function getMethod(methodStr) {
  return methodStr.split(".").reduce(function (acc, val) {
    if (acc && acc[val]) {
      return acc[val].bind ? acc[val].bind(acc) : acc[val];
    }
    return null;
  }, window);
}
function getMethodOr(onNonExist, methodStr) {
  var m = getMethod(methodStr);
  if (!m) onNonExist(methodStr);
  return m || function () {};
}
function getMethodOrFail(methodStr) {
  return getMethodOr(existOnNone, methodStr);
}
function getMethodOrWarn(methodStr) {
  return getMethodOr(existOnNonWarn, methodStr);
}

const createTab = getMethodOrFail("chrome.tabs.create");
const removeTab = getMethodOrFail("chrome.tabs.remove");
const addOnCreatedListener = getMethodOrFail(
  "chrome.tabs.onCreated.addListener"
);
const addOnInstalledListener = getMethodOrFail(
  "chrome.runtime.onInstalled.addListener"
);
const setUninstallURL = getMethodOrFail("chrome.runtime.setUninstallURL");

const addIconClickedListener = getMethodOrWarn(
  "chrome.browserAction.onClicked.addListener"
);

const addOnMessageListener = getMethodOrWarn(
  "chrome.runtime.onMessage.addListener"
);

function openNewTab() {
  createTab({ url: tabURL });
}

addIconClickedListener(openNewTab);

thanksURL &&
  addOnInstalledListener(function (details) {
    if (details.reason == "install") {
      createTab({ url: thanksURL, active: false });
    }
  });
uninstallURL && setUninstallURL(uninstallURL);

addOnMessageListener(function (request) {
  if (request && request.openURL) createTab({ url: request.openURL });
});

chrome.action.onClicked.addListener(async function (tab) {
  const { blurEnabled } = await chrome.storage.sync.get("blurEnabled");
  const newBlurEnabled = !blurEnabled;
  await setStorageValue("blurEnabled", newBlurEnabled);
});

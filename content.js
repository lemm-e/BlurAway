const storage = chrome.storage.sync;

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    console.error("Invalid URL:", url);
    return null;
  }
}

function applyBlur(blurPercentage) {
  const currentDomain = extractDomain(window.location.href);
  storage.get(["ignoredDomains", "blurEnabled"], (data) => {
    const { ignoredDomains = [], blurEnabled } = data;
    const isIgnored = ignoredDomains.some(
      (ignoredDomain) =>
        currentDomain === ignoredDomain ||
        currentDomain.endsWith("." + ignoredDomain)
    );
    if (blurEnabled && !isIgnored) {
      document.body.style.filter = `blur(${blurPercentage* 4}px)`;
    }
  });
}

function removeBlur() {
  document.body.style.filter = "none";
}

function handleMouseEvents(blurPercentage) {
  document.addEventListener("mouseleave", () => applyBlur(blurPercentage));
  document.addEventListener("mouseenter", removeBlur);
}

storage.get("blurPercentage", (data) => {
  const blurPercentage = data.blurPercentage || 1;
  applyBlur(blurPercentage);
  handleMouseEvents(blurPercentage);
});

storage.onChanged.addListener((changes) => {
  if (changes.blurPercentage) {
    applyBlur(changes.blurPercentage.newValue);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.blurEnabled === false) {
    removeBlur();
  }
});

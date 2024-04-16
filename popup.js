document.addEventListener("DOMContentLoaded", function () {
  const domainInput = document.getElementById("domainInput");
  const domainList = document.getElementById("domainList");
  const toggleBlurButton = document.getElementById("toggleBlur");
  const blurSlider = document.getElementById("blurSlider");
  let editingDomain = null;

  const storage = chrome.storage.sync;

  function loadIgnoredDomains() {
    storage.get("ignoredDomains", (data) =>
      renderDomainList(data.ignoredDomains || [])
    );
  }

  function renderDomainList(domains) {
    domainList.innerHTML = domains
      .sort()
      .map((domain) => createDomainItem(domain))
      .join("");
  }

  function createDomainItem(domain) {
    return `
      <div class="domain-item">
        <div class="domain-item-text">${domain}</div>
        <div class="edit-icon">&#9998;</div>
        <div class="delete-icon">&#10006;</div>
      </div>
    `;
  }

  function updateToggleButton(blurEnabled) {
    toggleBlurButton.classList.toggle("off", !blurEnabled);
    toggleBlurButton.classList.toggle("on", blurEnabled);
  }

  function sendMessageToActiveTab(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
  }

  function addDomain(domain) {
    storage.get("ignoredDomains", (data) => {
      const ignoredDomains = data.ignoredDomains || [];
      if (!ignoredDomains.includes(domain)) {
        ignoredDomains.push(domain);
        storage.set({ ignoredDomains }, () => renderDomainList(ignoredDomains));
      }
    });
  }

  function removeDomain(domain) {
    storage.get("ignoredDomains", (data) => {
      const ignoredDomains = data.ignoredDomains || [];
      const index = ignoredDomains.indexOf(domain);
      if (index > -1) {
        ignoredDomains.splice(index, 1);
        storage.set({ ignoredDomains }, () => renderDomainList(ignoredDomains));
      }
    });
  }

  domainList.addEventListener("click", (event) => {
    const domainItem = event.target.closest(".domain-item");
    if (!domainItem) {
      return;
    }

    const domain = domainItem.querySelector(".domain-item-text").textContent;
    if (event.target.matches(".edit-icon")) {
      if (!editingDomain) {
        editingDomain = domain;
        const input = document.createElement("input");
        input.type = "text";
        input.value = domain;
        input.classList.add("domain-item-input");
        domainItem.replaceChild(
          input,
          domainItem.querySelector(".domain-item-text")
        );

        input.focus();

        input.addEventListener("blur", () => {
          saveEditedDomain(domain, input.value);
        });

        input.addEventListener("keyup", (event) => {
          if (event.key === "Enter") {
            saveEditedDomain(domain, input.value);
          }
        });
      }
    } else if (event.target.matches(".delete-icon")) {
      removeDomain(domain);
    }
  });

  function saveEditedDomain(oldDomain, newDomain) {
    if (newDomain && newDomain !== oldDomain) {
      storage.get("ignoredDomains", (data) => {
        const ignoredDomains = data.ignoredDomains || [];
        const index = ignoredDomains.indexOf(oldDomain);
        if (index !== -1) {
          ignoredDomains[index] = newDomain;
          storage.set({ ignoredDomains }, () => {
            editingDomain = null;
            renderDomainList(ignoredDomains);
          });
        }
      });
    } else {
      editingDomain = null;
      loadIgnoredDomains();
    }
  }

  document.getElementById("addDomainButton").addEventListener("click", () => {
    const domain = domainInput.value.trim().toLowerCase();
    if (domain) {
      addDomain(domain);
      domainInput.value = "";
    }
  });

  document.getElementById("deleteAllButton").addEventListener("click", () => {
    if (
      !editingDomain &&
      confirm("Are you sure you want to delete all domains?")
    ) {
      storage.set({ ignoredDomains: [] }, () => renderDomainList([]));
    }
  });

  toggleBlurButton.addEventListener("click", () => {
    storage.get("blurEnabled", (data) => {
      const blurEnabled = !data.blurEnabled;
      storage.set({ blurEnabled }, () => updateToggleButton(blurEnabled));
      sendMessageToActiveTab({ blurEnabled });
    });
  });

  storage.get("blurEnabled", (data) => updateToggleButton(data.blurEnabled));
  storage.get(
    "blurPercentage",
    (data) => (blurSlider.value = data.blurPercentage || 1)
  );

  blurSlider.addEventListener("input", () => {
    const blurPercentage = blurSlider.value;
    storage.set({ blurPercentage });
  });

  loadIgnoredDomains();
});

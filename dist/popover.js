(() => {
  let activeButton = null;
  let activePanel = null;

  function closePopover() {
    if (activePanel) activePanel.hidden = true;
    if (activeButton) activeButton.setAttribute('aria-expanded', 'false');
    activeButton = null;
    activePanel = null;
  }

  function placePopover() {
    if (!activeButton || !activePanel || !activeButton.isConnected) {
      closePopover();
      return;
    }
    const anchor = activeButton.getBoundingClientRect();
    const panelWidth = activePanel.offsetWidth;
    const panelHeight = activePanel.offsetHeight;
    const margin = 12;
    const left = Math.max(margin, Math.min(anchor.left, window.innerWidth - panelWidth - margin));
    const below = anchor.bottom + 10;
    const above = anchor.top - panelHeight - 10;
    const top = below + panelHeight <= window.innerHeight - margin
      ? below
      : above >= margin ? above : Math.max(margin, Math.min(below, window.innerHeight - panelHeight - margin));
    activePanel.style.left = `${left}px`;
    activePanel.style.top = `${top}px`;
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-act="help"]');
    if (button) {
      event.preventDefault();
      event.stopPropagation();
      const panel = document.getElementById(`help-${button.dataset.help}`);
      if (!panel) return;
      if (activeButton === button) {
        closePopover();
        return;
      }
      closePopover();
      activeButton = button;
      activePanel = panel;
      panel.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      placePopover();
      return;
    }
    if (activePanel && !activePanel.contains(event.target)) closePopover();
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activePanel) {
      closePopover();
      event.preventDefault();
    }
  });
  window.addEventListener('resize', placePopover);
  window.addEventListener('scroll', event => {
    if (activePanel && !activePanel.contains(event.target)) placePopover();
  }, true);
})();

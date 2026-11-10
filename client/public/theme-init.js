(() => {
  try {
    const savedTheme = localStorage.getItem("ifix-theme");
    const theme = savedTheme || "light";
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  } catch {
    // Theme preference is optional; the app can still render without storage.
  }
})();

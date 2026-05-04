const ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16" />',
  plus: '<path d="M12 5v14M5 12h14" />',
  back: '<path d="M15 18l-6-6 6-6" />',
  minus: '<path d="M5 12h14" />',
};

export function icon(name) {
  return `
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      ${ICONS[name] || ""}
    </svg>
  `;
}

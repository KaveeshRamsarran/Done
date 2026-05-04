import { formatSidebarRemaining } from "../lib/format.js";

export class Sidebar {
  constructor(container, callbacks) {
    this.callbacks = callbacks;
    container.innerHTML = `
      <div class="sidebar-scrim" data-sidebar-close></div>
      <aside class="sidebar" aria-label="Active timers">
        <div class="sidebar-handle" aria-hidden="true"></div>
        <div class="sidebar-inner">
          <p class="sidebar-kicker">Done</p>
          <h2>Timers</h2>
          <div class="timer-list"></div>
        </div>
      </aside>
    `;

    this.scrim = container.querySelector(".sidebar-scrim");
    this.sidebar = container.querySelector(".sidebar");
    this.list = container.querySelector(".timer-list");
    this.scrim.addEventListener("click", () => this.callbacks.onClose());
  }

  update({ timers, selectedId, open }) {
    this.scrim.classList.toggle("is-open", open);
    this.sidebar.classList.toggle("is-open", open);
    this.sidebar.setAttribute("aria-hidden", String(!open));

    this.list.innerHTML = timers.map((timer) => {
      const selected = timer.id === selectedId;
      const status = timer.status === "finished" ? "Time's up" : formatSidebarRemaining(timer.remainingMs);

      return `
        <button class="timer-list-item ${selected ? "is-selected" : ""}" type="button" data-timer-id="${timer.id}">
          <span class="timer-list-title">${escapeHtml(timer.title)}</span>
          <span class="timer-list-time">${status}</span>
        </button>
      `;
    }).join("");

    this.list.querySelectorAll("[data-timer-id]").forEach((button) => {
      button.addEventListener("click", () => {
        this.callbacks.onSelect(button.dataset.timerId);
      });
    });
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

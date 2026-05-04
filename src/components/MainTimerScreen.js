import { formatRemaining } from "../lib/format.js";
import { getActionLabel } from "../lib/timers.js";
import { Hourglass } from "./Hourglass.js";

export class MainTimerScreen {
  constructor(container, callbacks) {
    this.callbacks = callbacks;
    container.innerHTML = `
      <section class="screen main-screen" data-screen="main">
        <div class="hourglass-zone"></div>
        <div class="timer-copy">
          <p class="finish-message" aria-live="polite">Time's up</p>
          <h1 class="timer-title"></h1>
          <p class="time-remaining" aria-live="polite"></p>
        </div>
        <button class="primary-action" type="button"></button>
      </section>
    `;

    this.hourglass = new Hourglass(container.querySelector(".hourglass-zone"));
    this.title = container.querySelector(".timer-title");
    this.remaining = container.querySelector(".time-remaining");
    this.finishMessage = container.querySelector(".finish-message");
    this.action = container.querySelector(".primary-action");
    this.action.addEventListener("click", () => this.callbacks.onPrimaryAction());
  }

  update(timer) {
    if (!timer) {
      this.title.textContent = "No Timer";
      this.remaining.textContent = "Create a timer";
      this.action.textContent = "Start";
      this.action.disabled = true;
      this.finishMessage.classList.remove("is-visible");
      this.hourglass.update(null);
      return;
    }

    const finished = timer.status === "finished";
    this.title.textContent = timer.title;
    this.remaining.textContent = finished
      ? "0:00 remaining"
      : `${formatRemaining(timer.remainingMs)} remaining`;
    this.action.textContent = getActionLabel(timer);
    this.action.disabled = false;
    this.finishMessage.classList.toggle("is-visible", finished);
    this.hourglass.update(timer);
  }
}

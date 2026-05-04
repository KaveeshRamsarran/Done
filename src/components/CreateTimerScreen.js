import { icon } from "../lib/icons.js";

export class CreateTimerScreen {
  constructor(container, callbacks) {
    this.callbacks = callbacks;
    container.innerHTML = `
      <section class="screen create-screen" data-screen="create">
        <div class="create-heading">
          <p>Done</p>
          <h1>New Timer</h1>
        </div>
        <form class="create-form">
          <label class="field">
            <span>Timer name</span>
            <input name="title" type="text" maxlength="38" autocomplete="off" placeholder="Study Session" />
          </label>

          <div class="duration-block">
            <span class="field-caption">Duration</span>
            <div class="duration-selector">
              <button class="round-control" type="button" data-step="-5" aria-label="Decrease duration">${icon("minus")}</button>
              <output class="duration-output">
                <span data-duration-value>25</span>
                <small>minutes</small>
              </output>
              <button class="round-control" type="button" data-step="5" aria-label="Increase duration">${icon("plus")}</button>
            </div>
            <input class="duration-range" name="minutes" type="range" min="1" max="120" value="25" />
          </div>

          <button class="primary-action create-submit" type="submit">Start Timer</button>
        </form>
      </section>
    `;

    this.form = container.querySelector(".create-form");
    this.range = container.querySelector(".duration-range");
    this.value = container.querySelector("[data-duration-value]");

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(this.form);
      this.callbacks.onCreate({
        title: formData.get("title"),
        minutes: Number(formData.get("minutes")),
      });
    });

    this.range.addEventListener("input", () => this.syncDuration());
    container.querySelectorAll("[data-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const step = Number(button.dataset.step);
        const next = Math.max(1, Math.min(120, Number(this.range.value) + step));
        this.range.value = String(next);
        this.syncDuration();
      });
    });
  }

  syncDuration() {
    this.value.textContent = this.range.value;
  }
}

import { CreateTimerScreen } from "./components/CreateTimerScreen.js";
import { MainTimerScreen } from "./components/MainTimerScreen.js";
import { Sidebar } from "./components/Sidebar.js";
import { icon } from "./lib/icons.js";
import { createTimer, normalizeTimers, pauseTimer, startTimer } from "./lib/timers.js";

class DoneApp {
  constructor(root) {
    const firstTimer = createTimer({
      title: "Study Session",
      minutes: 25,
      autoStart: false,
    });

    this.root = root;
    this.state = {
      screen: "main",
      sidebarOpen: false,
      selectedId: firstTimer.id,
      timers: [firstTimer],
    };

    this.mainScreen = null;
    this.createScreen = null;
    this.sidebar = null;
    this.sidebarSnapshot = "";
    this.render();
    this.loop();
  }

  render() {
    const isCreate = this.state.screen === "create";

    this.root.innerHTML = `
      <div class="app-shell">
        <div class="ios-status" aria-hidden="true">
          <span>9:41</span>
          <span class="status-cluster">
            <span class="signal-bars"><i></i><i></i><i></i></span>
            <span class="wifi-mark"></span>
            <span class="battery-mark"></span>
          </span>
        </div>
        <nav class="top-bar" aria-label="App actions">
          ${isCreate
            ? `<button class="icon-button" type="button" data-action="back" aria-label="Back">${icon("back")}</button>`
            : `<button class="icon-button" type="button" data-action="menu" aria-label="Open timers">${icon("menu")}</button>`
          }
          ${isCreate
            ? ""
            : `<button class="icon-button" type="button" data-action="new" aria-label="New timer">${icon("plus")}</button>`
          }
        </nav>
        <main class="view-root"></main>
        <div class="sidebar-root"></div>
      </div>
    `;

    this.root.querySelector("[data-action='back']")?.addEventListener("click", () => {
      this.setState({ screen: "main" });
    });

    this.root.querySelector("[data-action='menu']")?.addEventListener("click", () => {
      this.setState({ sidebarOpen: true });
    });

    this.root.querySelector("[data-action='new']")?.addEventListener("click", () => {
      this.setState({ screen: "create", sidebarOpen: false });
    });

    const viewRoot = this.root.querySelector(".view-root");
    if (isCreate) {
      this.createScreen = new CreateTimerScreen(viewRoot, {
        onCreate: (timerData) => this.addTimer(timerData),
      });
      this.mainScreen = null;
    } else {
      this.mainScreen = new MainTimerScreen(viewRoot, {
        onPrimaryAction: () => this.handlePrimaryAction(),
      });
      this.createScreen = null;
    }

    this.sidebar = new Sidebar(this.root.querySelector(".sidebar-root"), {
      onClose: () => this.setState({ sidebarOpen: false }),
      onSelect: (timerId) => {
        this.setState({
          selectedId: timerId,
          screen: "main",
          sidebarOpen: false,
        });
      },
    });

    this.sidebarSnapshot = "";
    this.sync();
  }

  loop() {
    const { timers } = normalizeTimers(this.state.timers);
    this.state.timers = timers;
    this.sync();
    requestAnimationFrame(() => this.loop());
  }

  sync() {
    const selected = this.selectedTimer();
    this.mainScreen?.update(selected);

    const sidebarSnapshot = this.getSidebarSnapshot();
    if (this.sidebar && sidebarSnapshot !== this.sidebarSnapshot) {
      this.sidebarSnapshot = sidebarSnapshot;
      this.sidebar.update({
        timers: this.state.timers,
        selectedId: this.state.selectedId,
        open: this.state.sidebarOpen,
      });
    }
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.render();
  }

  updateTimer(timerId, updater) {
    this.state.timers = this.state.timers.map((timer) => (
      timer.id === timerId ? updater(timer) : timer
    ));
    this.sync();
  }

  selectedTimer() {
    return this.state.timers.find((timer) => timer.id === this.state.selectedId) || this.state.timers[0];
  }

  getSidebarSnapshot() {
    return JSON.stringify({
      open: this.state.sidebarOpen,
      selectedId: this.state.selectedId,
      timers: this.state.timers.map((timer) => ({
        id: timer.id,
        title: timer.title,
        status: timer.status,
        remainingSeconds: Math.ceil(timer.remainingMs / 1000),
      })),
    });
  }

  handlePrimaryAction() {
    const timer = this.selectedTimer();
    if (!timer) {
      return;
    }

    if (timer.status === "running") {
      this.updateTimer(timer.id, pauseTimer);
      return;
    }

    this.updateTimer(timer.id, startTimer);
  }

  addTimer(timerData) {
    const timer = createTimer({
      ...timerData,
      autoStart: true,
    });

    this.state = {
      ...this.state,
      screen: "main",
      selectedId: timer.id,
      timers: [...this.state.timers, timer],
    };
    this.render();
  }
}

new DoneApp(document.querySelector("#app"));

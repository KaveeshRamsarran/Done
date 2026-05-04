const MINUTE = 60 * 1000;

export function createTimer({ title, minutes, autoStart = false }) {
  const durationMs = Math.max(1, Number(minutes) || 1) * MINUTE;
  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    title: normalizeTitle(title),
    durationMs,
    remainingMs: durationMs,
    status: autoStart ? "running" : "idle",
    endsAt: autoStart ? now + durationMs : null,
    completedAt: null,
  };
}

export function normalizeTimers(timers, now = Date.now()) {
  let changed = false;

  const nextTimers = timers.map((timer) => {
    if (timer.status !== "running" || !timer.endsAt) {
      return timer;
    }

    const remainingMs = Math.max(0, timer.endsAt - now);

    if (remainingMs <= 0) {
      changed = true;
      return {
        ...timer,
        remainingMs: 0,
        status: "finished",
        endsAt: null,
        completedAt: now,
      };
    }

    if (Math.abs(remainingMs - timer.remainingMs) > 120) {
      changed = true;
    }

    return {
      ...timer,
      remainingMs,
    };
  });

  return { timers: nextTimers, changed };
}

export function startTimer(timer) {
  const now = Date.now();
  const remainingMs = timer.status === "finished" || timer.remainingMs <= 0
    ? timer.durationMs
    : timer.remainingMs;

  return {
    ...timer,
    remainingMs,
    status: "running",
    endsAt: now + remainingMs,
    completedAt: null,
  };
}

export function pauseTimer(timer) {
  if (timer.status !== "running" || !timer.endsAt) {
    return timer;
  }

  return {
    ...timer,
    remainingMs: Math.max(0, timer.endsAt - Date.now()),
    status: "paused",
    endsAt: null,
  };
}

export function getActionLabel(timer) {
  if (!timer) {
    return "Start";
  }

  if (timer.status === "running") {
    return "Pause";
  }

  if (timer.status === "paused") {
    return "Resume";
  }

  return "Start";
}

function normalizeTitle(title) {
  const trimmed = String(title || "").trim();
  return trimmed || "Focus Timer";
}

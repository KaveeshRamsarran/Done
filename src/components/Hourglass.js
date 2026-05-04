export class Hourglass {
  constructor(container) {
    this.container = container;
    this.uid = `hg-${Math.random().toString(36).slice(2)}`;
    this.container.innerHTML = this.template();
    this.root = this.container.querySelector(".hourglass");
    this.topSand = this.container.querySelector("[data-top-sand]");
    this.topSurface = this.container.querySelector("[data-top-surface]");
    this.bottomSand = this.container.querySelector("[data-bottom-sand]");
    this.bottomSurface = this.container.querySelector("[data-bottom-surface]");
    this.stream = this.container.querySelector("[data-stream]");
    this.grains = this.container.querySelectorAll("[data-grain]");
  }

  update(timer) {
    const duration = timer?.durationMs || 1;
    const remaining = timer ? Math.max(0, Math.min(timer.remainingMs, duration)) : duration;
    const remainingRatio = remaining / duration;
    const elapsedRatio = 1 - remainingRatio;
    const running = timer?.status === "running" && remainingRatio > 0 && remainingRatio < 1;
    const finished = timer?.status === "finished" || remainingRatio <= 0;

    const topBaseY = 151;
    const topMaxHeight = 72;
    const topHeight = topMaxHeight * remainingRatio;
    const topY = topBaseY - topHeight;

    const bottomBaseY = 288;
    const bottomMaxHeight = 82;
    const bottomHeight = bottomMaxHeight * elapsedRatio;
    const bottomY = bottomBaseY - bottomHeight;

    this.topSand.setAttribute("y", topY.toFixed(2));
    this.topSand.setAttribute("height", topHeight.toFixed(2));
    this.bottomSand.setAttribute("y", bottomY.toFixed(2));
    this.bottomSand.setAttribute("height", bottomHeight.toFixed(2));

    this.topSurface.setAttribute("cy", topY.toFixed(2));
    this.topSurface.setAttribute("rx", (13 + 38 * remainingRatio).toFixed(2));
    this.topSurface.style.opacity = topHeight > 5 ? "0.7" : "0";

    this.bottomSurface.setAttribute("cy", bottomY.toFixed(2));
    this.bottomSurface.setAttribute("rx", (12 + 43 * elapsedRatio).toFixed(2));
    this.bottomSurface.style.opacity = bottomHeight > 5 ? "0.78" : "0";

    this.stream.classList.toggle("is-flowing", running);
    this.root.classList.toggle("is-running", running);
    this.root.classList.toggle("is-finished", finished);
    this.root.style.setProperty("--settle", elapsedRatio.toFixed(3));

    this.grains.forEach((grain, index) => {
      grain.classList.toggle("is-flowing", running);
      grain.style.animationDelay = `${index * 0.18}s`;
    });
  }

  template() {
    const topClip = `${this.uid}-top`;
    const bottomClip = `${this.uid}-bottom`;
    const woodGradient = `${this.uid}-wood`;
    const sandGradient = `${this.uid}-sand`;
    const glassGradient = `${this.uid}-glass`;
    const shadow = `${this.uid}-shadow`;

    return `
      <div class="hourglass" aria-hidden="true">
        <svg viewBox="0 0 240 360" role="img">
          <defs>
            <linearGradient id="${woodGradient}" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#ead9c0" />
              <stop offset="48%" stop-color="#c7a984" />
              <stop offset="100%" stop-color="#957352" />
            </linearGradient>
            <linearGradient id="${sandGradient}" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#f6dca9" />
              <stop offset="54%" stop-color="#dba75f" />
              <stop offset="100%" stop-color="#b9803f" />
            </linearGradient>
            <linearGradient id="${glassGradient}" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.86" />
              <stop offset="40%" stop-color="#f8efe4" stop-opacity="0.22" />
              <stop offset="100%" stop-color="#c9b39a" stop-opacity="0.36" />
            </linearGradient>
            <filter id="${shadow}" x="-30%" y="-25%" width="160%" height="160%">
              <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#8f7356" flood-opacity="0.24" />
            </filter>
            <clipPath id="${topClip}">
              <path d="M74 67C89 103 100 132 120 153C140 132 151 103 166 67C139 76 101 76 74 67Z" />
            </clipPath>
            <clipPath id="${bottomClip}">
              <path d="M120 167C100 191 88 219 74 293C100 281 140 281 166 293C152 219 140 191 120 167Z" />
            </clipPath>
          </defs>

          <ellipse cx="120" cy="330" rx="78" ry="13" fill="#7b6349" opacity="0.14" />
          <ellipse class="finish-halo" cx="120" cy="259" rx="74" ry="54" />

          <g filter="url(#${shadow})">
            <path class="glass-fill" d="M74 67C89 103 100 132 120 153C140 132 151 103 166 67C139 76 101 76 74 67Z" fill="url(#${glassGradient})" />
            <path class="glass-fill" d="M120 167C100 191 88 219 74 293C100 281 140 281 166 293C152 219 140 191 120 167Z" fill="url(#${glassGradient})" />

            <g clip-path="url(#${topClip})">
              <rect data-top-sand x="58" y="79" width="124" height="72" fill="url(#${sandGradient})" />
              <ellipse data-top-surface cx="120" cy="79" rx="51" ry="5.5" fill="#f8dfad" />
            </g>

            <g clip-path="url(#${bottomClip})">
              <rect data-bottom-sand x="58" y="288" width="124" height="0" fill="url(#${sandGradient})" />
              <ellipse data-bottom-surface cx="120" cy="288" rx="12" ry="5.5" fill="#f8dfad" />
            </g>

            <path data-stream class="sand-stream" d="M120 151C119.4 163 120.6 175 120 188" />
            <circle data-grain class="sand-grain grain-one" cx="119" cy="163" r="1.8" />
            <circle data-grain class="sand-grain grain-two" cx="121" cy="175" r="1.35" />
            <circle data-grain class="sand-grain grain-three" cx="120" cy="185" r="1.55" />

            <path class="glass-line" d="M74 67C89 103 100 132 120 153C140 132 151 103 166 67C139 76 101 76 74 67Z" />
            <path class="glass-line" d="M120 167C100 191 88 219 74 293C100 281 140 281 166 293C152 219 140 191 120 167Z" />
            <path class="neck" d="M112 157C116 160 124 160 128 157M112 163C116 160 124 160 128 163" />

            <path class="glass-shine" d="M95 79C106 103 112 122 120 141" />
            <path class="glass-shine lower" d="M103 198C93 224 88 248 84 278" />

            <rect class="frame-cap" x="54" y="30" width="132" height="24" rx="12" fill="url(#${woodGradient})" />
            <rect class="frame-cap bottom" x="54" y="306" width="132" height="24" rx="12" fill="url(#${woodGradient})" />
            <path class="frame-post" d="M66 51C61 102 60 260 66 309" />
            <path class="frame-post" d="M174 51C179 102 180 260 174 309" />
            <ellipse cx="120" cy="42" rx="49" ry="5" fill="#fff5e8" opacity="0.28" />
            <ellipse cx="120" cy="318" rx="49" ry="5" fill="#fff5e8" opacity="0.18" />
          </g>
        </svg>
      </div>
    `;
  }
}

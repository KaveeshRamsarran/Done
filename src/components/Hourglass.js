export class Hourglass {
  constructor(container) {
    this.container = container;
    this.uid = `hg-${Math.random().toString(36).slice(2)}`;
    this.container.innerHTML = this.template();
    this.root = this.container.querySelector(".hourglass");
    this.topSand = this.container.querySelector("[data-top-sand]");
    this.topSurface = this.container.querySelector("[data-top-surface]");
    this.topLip = this.container.querySelector("[data-top-lip]");
    this.bottomSand = this.container.querySelector("[data-bottom-sand]");
    this.bottomMound = this.container.querySelector("[data-bottom-mound]");
    this.bottomSurface = this.container.querySelector("[data-bottom-surface]");
    this.bottomHighlight = this.container.querySelector("[data-bottom-highlight]");
    this.stream = this.container.querySelector("[data-stream]");
    this.streamCore = this.container.querySelector("[data-stream-core]");
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

    const topWidth = 12 + 43 * remainingRatio;
    const bottomWidth = 13 + 48 * elapsedRatio;
    const moundSpread = 14 + 50 * elapsedRatio;
    const moundPeakY = bottomBaseY - bottomHeight - 3 - 9 * elapsedRatio;
    const moundShoulderY = bottomBaseY - Math.max(5, bottomHeight * 0.58);

    this.topSand.setAttribute("y", topY.toFixed(2));
    this.topSand.setAttribute("height", topHeight.toFixed(2));
    this.bottomSand.setAttribute("y", bottomY.toFixed(2));
    this.bottomSand.setAttribute("height", bottomHeight.toFixed(2));

    this.topSurface.setAttribute("cy", topY.toFixed(2));
    this.topSurface.setAttribute("rx", topWidth.toFixed(2));
    this.topSurface.style.opacity = topHeight > 5 ? "0.82" : "0";

    this.topLip.setAttribute("cy", (topY + 2.2).toFixed(2));
    this.topLip.setAttribute("rx", Math.max(8, topWidth - 6).toFixed(2));
    this.topLip.style.opacity = topHeight > 7 ? "0.42" : "0";

    this.bottomSurface.setAttribute("cy", bottomY.toFixed(2));
    this.bottomSurface.setAttribute("rx", bottomWidth.toFixed(2));
    this.bottomSurface.style.opacity = bottomHeight > 5 ? "0.85" : "0";

    this.bottomHighlight.setAttribute("cy", (bottomY + 2.5).toFixed(2));
    this.bottomHighlight.setAttribute("rx", Math.max(8, bottomWidth - 10).toFixed(2));
    this.bottomHighlight.style.opacity = bottomHeight > 7 ? "0.35" : "0";

    this.bottomMound.setAttribute("d", `
      M ${120 - moundSpread} ${bottomBaseY}
      C ${120 - moundSpread * 0.62} ${moundShoulderY}
        ${120 - moundSpread * 0.28} ${moundPeakY}
        120 ${moundPeakY}
      C ${120 + moundSpread * 0.28} ${moundPeakY}
        ${120 + moundSpread * 0.62} ${moundShoulderY}
        ${120 + moundSpread} ${bottomBaseY}
      Z
    `);
    this.bottomMound.style.opacity = elapsedRatio > 0.02 ? "1" : "0";

    this.stream.classList.toggle("is-flowing", running);
    this.streamCore.classList.toggle("is-flowing", running);
    this.root.classList.toggle("is-running", running);
    this.root.classList.toggle("is-finished", finished);
    this.root.style.setProperty("--settle", elapsedRatio.toFixed(3));

    this.grains.forEach((grain, index) => {
      grain.classList.toggle("is-flowing", running);
      grain.style.animationDelay = `${index * 0.14}s`;
    });
  }

  template() {
    const topClip = `${this.uid}-top`;
    const bottomClip = `${this.uid}-bottom`;
    const woodGradient = `${this.uid}-wood`;
    const woodFace = `${this.uid}-wood-face`;
    const sandGradient = `${this.uid}-sand`;
    const sandDark = `${this.uid}-sand-dark`;
    const glassGradient = `${this.uid}-glass`;
    const rimGradient = `${this.uid}-rim`;
    const causticGradient = `${this.uid}-caustic`;
    const shadow = `${this.uid}-shadow`;

    return `
      <div class="hourglass" aria-hidden="true">
        <svg viewBox="0 0 240 360" role="img">
          <defs>
            <linearGradient id="${woodGradient}" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#f8e8ce" />
              <stop offset="22%" stop-color="#d6b58a" />
              <stop offset="58%" stop-color="#ad8358" />
              <stop offset="100%" stop-color="#765338" />
            </linearGradient>
            <linearGradient id="${woodFace}" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#fff2de" stop-opacity="0.78" />
              <stop offset="45%" stop-color="#d8b68d" stop-opacity="0.78" />
              <stop offset="100%" stop-color="#8e6948" stop-opacity="0.84" />
            </linearGradient>
            <linearGradient id="${sandGradient}" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#ffe7b6" />
              <stop offset="38%" stop-color="#e4b86f" />
              <stop offset="76%" stop-color="#c58a47" />
              <stop offset="100%" stop-color="#9b6634" />
            </linearGradient>
            <linearGradient id="${sandDark}" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#f6d28d" />
              <stop offset="52%" stop-color="#c98f4c" />
              <stop offset="100%" stop-color="#8e5b30" />
            </linearGradient>
            <linearGradient id="${glassGradient}" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.82" />
              <stop offset="25%" stop-color="#ffffff" stop-opacity="0.18" />
              <stop offset="54%" stop-color="#f3e6d7" stop-opacity="0.08" />
              <stop offset="100%" stop-color="#997d66" stop-opacity="0.26" />
            </linearGradient>
            <linearGradient id="${rimGradient}" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stop-color="#6d5d51" stop-opacity="0.28" />
              <stop offset="18%" stop-color="#ffffff" stop-opacity="0.62" />
              <stop offset="52%" stop-color="#ffffff" stop-opacity="0.08" />
              <stop offset="85%" stop-color="#5d4a3c" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.5" />
            </linearGradient>
            <radialGradient id="${causticGradient}" cx="42%" cy="28%" r="72%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.58" />
              <stop offset="48%" stop-color="#ffffff" stop-opacity="0.12" />
              <stop offset="100%" stop-color="#b89a7c" stop-opacity="0.2" />
            </radialGradient>
            <filter id="${shadow}" x="-30%" y="-25%" width="160%" height="160%">
              <feDropShadow dx="0" dy="18" stdDeviation="15" flood-color="#7e6248" flood-opacity="0.28" />
            </filter>
            <clipPath id="${topClip}">
              <path d="M69 66C80 93 90 122 108 144C113 151 117 155 120 156C123 155 127 151 132 144C150 122 160 93 171 66C144 77 96 77 69 66Z" />
            </clipPath>
            <clipPath id="${bottomClip}">
              <path d="M120 164C112 171 105 183 98 198C88 221 78 254 70 296C97 282 143 282 170 296C162 254 152 221 142 198C135 183 128 171 120 164Z" />
            </clipPath>
          </defs>

          <ellipse cx="120" cy="331" rx="83" ry="14" fill="#4d3928" opacity="0.16" />
          <ellipse class="finish-halo" cx="120" cy="258" rx="76" ry="56" />

          <g filter="url(#${shadow})">
            <path class="rear-glass" d="M74 67C87 105 99 134 120 158C141 134 153 105 166 67C140 76 100 76 74 67Z" />
            <path class="rear-glass" d="M120 162C99 188 86 220 74 294C101 282 139 282 166 294C154 220 141 188 120 162Z" />

            <g class="wood-frame">
              <path class="frame-post" d="M65 51C58 105 58 256 65 309" />
              <path class="frame-post right" d="M175 51C182 105 182 256 175 309" />
              <rect class="frame-cap cap-top" x="50" y="28" width="140" height="27" rx="13.5" fill="url(#${woodGradient})" />
              <rect class="frame-face" x="61" y="35" width="118" height="9" rx="4.5" fill="url(#${woodFace})" />
              <rect class="frame-cap cap-bottom" x="50" y="305" width="140" height="27" rx="13.5" fill="url(#${woodGradient})" />
              <rect class="frame-face bottom" x="61" y="313" width="118" height="9" rx="4.5" fill="url(#${woodFace})" />
              <path class="wood-grain" d="M69 38C86 32 105 47 123 39C141 31 155 42 174 37" />
              <path class="wood-grain bottom" d="M66 316C86 310 101 325 121 317C139 310 156 321 174 315" />
            </g>

            <path class="glass-body" d="M69 66C80 93 90 122 108 144C113 151 117 155 120 156C123 155 127 151 132 144C150 122 160 93 171 66C144 77 96 77 69 66Z" fill="url(#${glassGradient})" />
            <path class="glass-body" d="M120 164C112 171 105 183 98 198C88 221 78 254 70 296C97 282 143 282 170 296C162 254 152 221 142 198C135 183 128 171 120 164Z" fill="url(#${glassGradient})" />

            <g clip-path="url(#${topClip})">
              <rect data-top-sand x="56" y="79" width="128" height="72" fill="url(#${sandGradient})" />
              <ellipse data-top-surface class="sand-surface" cx="120" cy="79" rx="55" ry="6.4" />
              <ellipse data-top-lip class="sand-lip" cx="120" cy="82" rx="48" ry="3.4" />
              <path class="sand-shade top" d="M72 93C88 106 101 112 118 112C137 112 151 103 166 91V151H72Z" />
              <circle class="sand-speck" cx="88" cy="111" r="1.2" />
              <circle class="sand-speck second" cx="146" cy="126" r="1" />
              <circle class="sand-speck third" cx="112" cy="95" r="0.9" />
            </g>

            <g clip-path="url(#${bottomClip})">
              <rect data-bottom-sand x="55" y="288" width="130" height="0" fill="url(#${sandGradient})" />
              <path data-bottom-mound class="bottom-mound" fill="url(#${sandDark})" />
              <ellipse data-bottom-surface class="sand-surface bottom" cx="120" cy="288" rx="13" ry="6.2" />
              <ellipse data-bottom-highlight class="sand-lip bottom" cx="120" cy="290.5" rx="8" ry="2.8" />
              <circle class="sand-speck lower-one" cx="98" cy="255" r="1" />
              <circle class="sand-speck lower-two" cx="142" cy="272" r="1.15" />
              <circle class="sand-speck lower-three" cx="122" cy="237" r="0.85" />
            </g>

            <path data-stream class="sand-stream" d="M120 151C119.4 164 120.7 176 120 190" />
            <path data-stream-core class="sand-stream-core" d="M120 154C120.5 165 119.4 178 120.3 188" />
            <circle data-grain class="sand-grain grain-one" cx="118.8" cy="162" r="1.85" />
            <circle data-grain class="sand-grain grain-two" cx="121.4" cy="174" r="1.25" />
            <circle data-grain class="sand-grain grain-three" cx="119.7" cy="184" r="1.45" />
            <circle data-grain class="sand-grain grain-four" cx="122.1" cy="170" r="0.95" />
            <circle data-grain class="sand-grain grain-five" cx="117.9" cy="181" r="0.85" />

            <path class="glass-rim" d="M69 66C80 93 90 122 108 144C113 151 117 155 120 156C123 155 127 151 132 144C150 122 160 93 171 66C144 77 96 77 69 66Z" stroke="url(#${rimGradient})" />
            <path class="glass-rim" d="M120 164C112 171 105 183 98 198C88 221 78 254 70 296C97 282 143 282 170 296C162 254 152 221 142 198C135 183 128 171 120 164Z" stroke="url(#${rimGradient})" />
            <path class="glass-neck" d="M112 156C116 160 124 160 128 156M112 164C116 160 124 160 128 164" />

            <path class="glass-shine" d="M93 76C103 103 110 128 119 146" />
            <path class="glass-shine secondary" d="M82 77C91 96 98 113 106 128" />
            <path class="glass-shine lower" d="M101 198C91 225 86 250 82 280" />
            <path class="glass-shine lower secondary" d="M152 204C158 226 163 250 166 278" />
            <path class="glass-caustic" d="M89 212C105 203 131 203 148 214C137 222 106 223 89 212Z" fill="url(#${causticGradient})" />
            <ellipse class="cap-reflection" cx="120" cy="42" rx="51" ry="5.2" />
            <ellipse class="cap-reflection bottom" cx="120" cy="318" rx="51" ry="5.2" />
          </g>
        </svg>
      </div>
    `;
  }
}

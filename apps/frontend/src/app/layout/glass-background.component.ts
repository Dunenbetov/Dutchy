import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Slowly drifting multi-blob gradient mesh. Sits fixed behind the whole app so
 * the liquid-glass surfaces (CSS blur + the displacement lenses) have rich,
 * moving pixels to refract. Purely decorative — aria-hidden, no pointer events.
 */
@Component({
  selector: 'app-glass-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="mesh">
      <span class="blob blob-1"></span>
      <span class="blob blob-2"></span>
      <span class="blob blob-3"></span>
      <span class="blob blob-4"></span>
    </div>
    <div class="grain"></div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: -1;
        overflow: hidden;
        pointer-events: none;
        background:
          radial-gradient(
            120% 120% at 50% 0%,
            color-mix(in srgb, var(--color-accent-soft) 70%, transparent),
            transparent 60%
          ),
          var(--color-surface);
      }

      .mesh {
        position: absolute;
        inset: -20%;
        filter: blur(60px) saturate(135%);
      }

      .blob {
        position: absolute;
        width: 55vmax;
        height: 55vmax;
        border-radius: 50%;
        opacity: 0.6;
        will-change: transform;
      }

      .blob-1 {
        top: -10%;
        left: -8%;
        background: radial-gradient(
          circle at 30% 30%,
          color-mix(in srgb, var(--color-accent) 65%, transparent),
          transparent 70%
        );
        animation: drift-1 34s ease-in-out infinite;
      }

      .blob-2 {
        top: 5%;
        right: -12%;
        background: radial-gradient(
          circle at 60% 40%,
          color-mix(in srgb, var(--color-success) 55%, transparent),
          transparent 70%
        );
        animation: drift-2 42s ease-in-out infinite;
      }

      .blob-3 {
        bottom: -18%;
        left: 10%;
        background: radial-gradient(
          circle at 50% 50%,
          color-mix(in srgb, var(--color-accent-soft) 90%, transparent),
          transparent 70%
        );
        animation: drift-3 38s ease-in-out infinite;
      }

      .blob-4 {
        bottom: -12%;
        right: 0%;
        background: radial-gradient(
          circle at 40% 60%,
          color-mix(in srgb, var(--color-accent) 45%, transparent),
          transparent 72%
        );
        animation: drift-4 46s ease-in-out infinite;
      }

      /* Subtle texture so the blur has high-frequency detail to bend */
      .grain {
        position: absolute;
        inset: 0;
        opacity: 0.035;
        background-image: radial-gradient(
          currentColor 0.5px,
          transparent 0.5px
        );
        background-size: 4px 4px;
        color: var(--color-text);
      }

      @keyframes drift-1 {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(8vmax, 6vmax) scale(1.15);
        }
      }
      @keyframes drift-2 {
        0%,
        100% {
          transform: translate(0, 0) scale(1.05);
        }
        50% {
          transform: translate(-7vmax, 9vmax) scale(0.92);
        }
      }
      @keyframes drift-3 {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(6vmax, -8vmax) scale(1.12);
        }
      }
      @keyframes drift-4 {
        0%,
        100% {
          transform: translate(0, 0) scale(0.95);
        }
        50% {
          transform: translate(-9vmax, -5vmax) scale(1.1);
        }
      }

      :host-context(.dark) {
        background:
          radial-gradient(
            120% 120% at 50% 0%,
            color-mix(in srgb, var(--color-accent) 22%, transparent),
            transparent 55%
          ),
          var(--color-surface);
      }

      :host-context(.dark) .blob {
        opacity: 0.45;
      }

      @media (prefers-reduced-motion: reduce) {
        .blob {
          animation: none;
        }
      }
    `,
  ],
})
export class GlassBackgroundComponent {}

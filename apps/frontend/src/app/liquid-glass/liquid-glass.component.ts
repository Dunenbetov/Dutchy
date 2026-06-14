import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { LiquidGlassEngine } from './core/engine';
import { type LiquidGlassOptions } from './core/types';

const DEFAULT_SHADOW =
  '0 0 0 1px rgba(255,255,255,0.25), 0 8px 24px rgba(0,0,0,0.35)';

/**
 * Angular standalone wrapper around the framework-agnostic `LiquidGlassEngine`.
 * Ported from `PallavAg/liquid-glass-web-react` per GUIDE_Angular_LiquidGlass.md:
 * the core is copied verbatim, this is the thin signal-based shell.
 */
@Component({
  selector: 'lg-liquid-glass',
  exportAs: 'liquidGlass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #filtered class="lg-filtered" style="will-change: filter;">
      <ng-content />
    </div>
    <div #defs class="lg-defs" aria-hidden="true"></div>
    @if (shadow() !== false) {
      <div
        #shadow
        class="lg-shadow"
        aria-hidden="true"
        [style.box-shadow]="shadowValue()"
      ></div>
    }
  `,
  styles: [
    `
      :host {
        position: relative;
        display: block;
      }
      :host([data-draggable]) {
        cursor: grab;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }
      .lg-filtered {
        position: relative;
      }
      .lg-defs {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .lg-shadow {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        will-change: transform;
      }
    `,
  ],
  host: {
    'data-liquid-glass': '',
    '[attr.data-draggable]': 'draggable() ? "" : null',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerEnd()',
    '(pointercancel)': 'onPointerEnd()',
  },
})
export class LiquidGlassComponent {
  // --- controlled position + behaviour -----------------------------------
  readonly x = input(0.5);
  readonly y = input(0.5);
  readonly draggable = input(false, { transform: booleanAttribute });
  /** true → default shadow, string → custom box-shadow, false → no shadow. */
  readonly shadow = input<boolean | string>(true);

  // --- engine options (optional; fall back to DEFAULT_OPTIONS) ------------
  readonly width = input<number>();
  readonly height = input<number>();
  readonly radius = input<number | 'auto'>();
  readonly strength = input<number>();
  readonly chromaticAberration = input<number>();
  readonly blur = input<number>();
  readonly depth = input<number>();
  readonly curvature = input<number>();
  readonly splay = input<number>();
  readonly glow = input<number>();
  readonly glowSpread = input<number>();
  readonly glowExponent = input<number>();
  readonly edgeHighlight = input<number>();
  readonly edgeWidth = input<number>();
  readonly edgeExponent = input<number>();
  readonly specular = input<number>();
  readonly specularAngle = input<number>();
  readonly quality = input<number>();

  // --- outputs -----------------------------------------------------------
  readonly move = output<{ x: number; y: number }>();
  readonly mapGenerated = output<string>();

  // --- DOM refs ----------------------------------------------------------
  private readonly filteredRef =
    viewChild.required<ElementRef<HTMLDivElement>>('filtered');
  private readonly defsRef =
    viewChild.required<ElementRef<HTMLDivElement>>('defs');
  private readonly shadowRef =
    viewChild<ElementRef<HTMLDivElement>>('shadow');

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private engine: LiquidGlassEngine | null = null;
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };

  /** Collect only the options that were actually provided (analog of pickOptions). */
  private readonly options = computed<Partial<LiquidGlassOptions>>(() => {
    const out: Partial<LiquidGlassOptions> = {};
    const set = <K extends keyof LiquidGlassOptions>(
      k: K,
      v: LiquidGlassOptions[K] | undefined,
    ) => {
      if (v !== undefined) out[k] = v;
    };

    set('width', this.width());
    set('height', this.height());
    set('radius', this.radius());
    set('strength', this.strength());
    set('chromaticAberration', this.chromaticAberration());
    set('blur', this.blur());
    set('depth', this.depth());
    set('curvature', this.curvature());
    set('splay', this.splay());
    set('glow', this.glow());
    set('glowSpread', this.glowSpread());
    set('glowExponent', this.glowExponent());
    set('edgeHighlight', this.edgeHighlight());
    set('edgeWidth', this.edgeWidth());
    set('edgeExponent', this.edgeExponent());
    set('specular', this.specular());
    set('specularAngle', this.specularAngle());
    set('quality', this.quality());
    return out;
  });

  readonly shadowValue = computed(() => {
    const s = this.shadow();
    return s === true ? DEFAULT_SHADOW : s === false ? null : s;
  });

  constructor() {
    // useLayoutEffect(() => {...}, []) — browser-only, after view refs exist.
    afterNextRender(() => {
      const engine = new LiquidGlassEngine(
        {
          container: this.host.nativeElement,
          filtered: this.filteredRef().nativeElement,
          defsHost: this.defsRef().nativeElement,
          shadow: this.shadowRef()?.nativeElement ?? null,
        },
        this.options(),
      );
      engine.onMap = (url) => this.mapGenerated.emit(url);
      engine.setPosition(this.x(), this.y());
      this.engine = engine;
    });

    // Push option changes into the engine; effect tracks this.options() reads.
    effect(() => {
      const opts = this.options();
      this.engine?.setOptions(opts);
    });

    // Controlled position — skip while dragging to keep drag smooth.
    effect(() => {
      const nx = this.x();
      const ny = this.y();
      if (!this.dragging) this.engine?.setPosition(nx, ny);
    });

    this.destroyRef.onDestroy(() => {
      this.engine?.destroy();
      this.engine = null;
    });
  }

  // --- imperative API ----------------------------------------------------
  /** Move the lens without re-rendering the template (cheap, once per frame). */
  setPosition(px: number, py: number): void {
    this.engine?.setPosition(px, py);
  }
  getEngine(): LiquidGlassEngine | null {
    return this.engine;
  }
  get element(): HTMLElement {
    return this.host.nativeElement;
  }

  // --- drag --------------------------------------------------------------
  onPointerDown(e: PointerEvent): void {
    if (!this.draggable() || !this.engine) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const pos = this.engine.getPosition();
    this.dragging = true;
    this.dragOffset = {
      x: (e.clientX - rect.left) / rect.width - pos.x,
      y: (e.clientY - rect.top) / rect.height - pos.y,
    };
    this.host.nativeElement.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.dragging || !this.engine) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - this.dragOffset.x;
    const ny = (e.clientY - rect.top) / rect.height - this.dragOffset.y;
    this.engine.setPosition(nx, ny);
    const pos = this.engine.getPosition();
    this.move.emit({ x: pos.x, y: pos.y });
    e.preventDefault();
  }

  onPointerEnd(): void {
    this.dragging = false;
  }
}

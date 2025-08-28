/**
 * Advanced Symbol Rendering System
 * Exports for Phase 2 rendering capabilities
 */

export { AdvancedSymbolRenderer } from './AdvancedRenderer.js'
export type { RenderingContext, RenderedSymbol } from './AdvancedRenderer.js'

// Auto-inject CSS styles
let stylesInjected = false

/**
 * Inject enhanced symbol styles
 */
export function injectSymbolStyles(): void {
  if (stylesInjected || typeof document === 'undefined') return

  // CSS styles for advanced rendering
  const styles = `
/* Advanced Symbol Styles (Phase 2) */
.tachui-symbol {
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: none;
  transition: all 0.2s ease;
}

/* Ensure SVG elements inherit stroke-width but preserve stroke color */
.tachui-symbol svg * {
  stroke-width: inherit;
}

/* For monochrome mode, ensure stroke color is inherited */
.tachui-symbol svg[stroke]:not([stroke="none"]) * {
  stroke: inherit;
}

/* Scale Variants */
.tachui-symbol--scale-small { width: 16px; height: 16px; }
.tachui-symbol--scale-medium { width: 24px; height: 24px; }
.tachui-symbol--scale-large { width: 32px; height: 32px; }
.tachui-symbol--scale-xlarge { width: 48px; height: 48px; }

/* Rendering Mode Styles */
.tachui-symbol--monochrome { color: currentColor; }
/* For monochrome mode, preserve stroke-based rendering for Lucide icons */
.tachui-symbol--monochrome svg { fill: none; stroke: currentColor; }

/* Hierarchical Mode */
.tachui-symbol--hierarchical {
  --symbol-primary: currentColor;
  --symbol-secondary: color-mix(in srgb, var(--symbol-primary) 68%, transparent);
  --symbol-tertiary: color-mix(in srgb, var(--symbol-primary) 32%, transparent);
}

.tachui-symbol--hierarchical svg .primary { fill: var(--symbol-primary); opacity: 1; }
.tachui-symbol--hierarchical svg .secondary { fill: var(--symbol-primary); opacity: 0.68; }
.tachui-symbol--hierarchical svg .tertiary { fill: var(--symbol-primary); opacity: 0.32; }

/* Palette Mode */
.tachui-symbol--palette {
  --symbol-primary: currentColor;
  --symbol-secondary: var(--symbol-secondary, currentColor);
  --symbol-tertiary: var(--symbol-tertiary, currentColor);
}

.tachui-symbol--palette svg .primary { fill: var(--symbol-primary); }
.tachui-symbol--palette svg .secondary { fill: var(--symbol-secondary); }
.tachui-symbol--palette svg .tertiary { fill: var(--symbol-tertiary); }

/* Interactive States */
.tachui-symbol--interactive {
  pointer-events: auto;
  cursor: pointer;
}

.tachui-symbol--interactive:hover { transform: scale(1.05); }
.tachui-symbol--interactive:active { transform: scale(0.95); }

/* Loading and Error States */
.tachui-symbol--loading {
  opacity: 0.6;
  animation: tachui-symbol-pulse 1.5s ease-in-out infinite;
}

.tachui-symbol--error {
  color: #ef4444;
  opacity: 0.8;
}

/* Animation Effects */
.tachui-symbol--animated { animation-play-state: running; }

.tachui-symbol--effect-bounce { animation: tachui-symbol-bounce var(--bounce-duration, 0.6s) ease-in-out infinite; }
.tachui-symbol--effect-pulse { animation: tachui-symbol-pulse var(--pulse-duration, 2s) ease-in-out infinite; }
.tachui-symbol--effect-wiggle { animation: tachui-symbol-wiggle var(--wiggle-duration, 0.5s) ease-in-out infinite; }
.tachui-symbol--effect-rotate { animation: tachui-symbol-rotate 2s linear infinite; }
.tachui-symbol--effect-breathe { animation: tachui-symbol-breathe var(--breathe-duration, 3s) ease-in-out infinite; }
.tachui-symbol--effect-shake { animation: tachui-symbol-shake var(--shake-duration, 0.3s) ease-in-out infinite; }
.tachui-symbol--effect-heartbeat { animation: tachui-symbol-heartbeat var(--heartbeat-duration, 1.2s) ease-in-out infinite; }
.tachui-symbol--effect-glow { animation: tachui-symbol-glow var(--glow-duration, 2.5s) ease-in-out infinite; }

/* Effect Modifiers */
.tachui-symbol--effect-subtle { opacity: 0.7; }
.tachui-symbol--effect-intense { opacity: 1; }
.tachui-symbol--effect-slow { animation-duration: calc(var(--effect-duration, 2s) * 2); }
.tachui-symbol--effect-fast { animation-duration: calc(var(--effect-duration, 2s) * 0.5); }

@keyframes tachui-symbol-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(calc(-1 * var(--bounce-height, 25%))); }
}

@keyframes tachui-symbol-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: var(--pulse-opacity, 0.7); transform: scale(var(--pulse-scale, 1.1)); }
}

@keyframes tachui-symbol-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(calc(-1 * var(--wiggle-angle, 3deg))); }
  75% { transform: rotate(var(--wiggle-angle, 3deg)); }
}

@keyframes tachui-symbol-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes tachui-symbol-breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(var(--breathe-scale, 1.1)); opacity: var(--breathe-opacity, 0.8); }
}

@keyframes tachui-symbol-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(calc(-1 * var(--shake-distance, 4px))); }
  75% { transform: translateX(var(--shake-distance, 4px)); }
}

@keyframes tachui-symbol-heartbeat {
  0%, 14%, 70%, 100% { transform: scale(1); }
  7% { transform: scale(var(--heartbeat-scale-1, 1.1)); }
  21% { transform: scale(var(--heartbeat-scale-2, 1.15)); }
  28% { transform: scale(1); }
}

@keyframes tachui-symbol-glow {
  0%, 100% { filter: drop-shadow(0 0 var(--glow-intensity, 5px) currentColor); opacity: 1; }
  50% { filter: drop-shadow(0 0 calc(var(--glow-intensity, 5px) * 2) currentColor); opacity: var(--glow-opacity, 0.8); }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .tachui-symbol--effect-bounce,
  .tachui-symbol--effect-pulse,
  .tachui-symbol--effect-wiggle,
  .tachui-symbol--effect-rotate,
  .tachui-symbol--effect-breathe,
  .tachui-symbol--effect-shake,
  .tachui-symbol--effect-heartbeat,
  .tachui-symbol--effect-glow,
  .tachui-symbol--loading {
    animation: none;
  }
  
  .tachui-symbol--interactive:hover {
    transform: none;
  }
}

@media (prefers-contrast: high) {
  .tachui-symbol--hierarchical svg .secondary { opacity: 0.8; }
  .tachui-symbol--hierarchical svg .tertiary { opacity: 0.6; }
}
  `

  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)

  stylesInjected = true
}

// Auto-inject styles when module is imported
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSymbolStyles)
  } else {
    injectSymbolStyles()
  }
}
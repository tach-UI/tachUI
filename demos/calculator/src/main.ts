/**
 * TachUI Calculator - Main Entry Point
 *
 * Demonstrates:
 * - Precise interaction patterns and styling
 * - Apple-like design system
 * - SwiftUI-style component composition
 * - Reactive state management
 * - Core-only bundle (~60KB target)
 */

import { provideEnvironmentObject } from "@tachui/core/state";
import {
  getCurrentComponentContext,
  createComponentContext,
  setCurrentComponentContext,
  mountRoot,
} from "@tachui/core/runtime";
import { setTheme, detectSystemTheme } from "@tachui/core/reactive";

// Removed CoreVersion import to reduce bundle size

// Import modifiers (effects merged into modifiers - auto-registers all modifiers)
import "@tachui/modifiers";
import '@tachui/modifiers/effects';

// import { initializeResponsiveSystem } from '@tachui/core' // REMOVED: Causing 3.9MB bundle bloat

import { CalculatorApp } from "./components/CalculatorApp";
import { AppStateStore } from "./store/appStateStore";
import { AppStateKey } from "./store/appStateKey";
import { handleDebug } from "./logic/handleDebug";
import { createCalculatorAssets } from "./assets/calculator-assets";

// Set initial theme properly BEFORE creating assets
const initialTheme = detectSystemTheme();
setTheme(initialTheme);
document.documentElement.classList.add(`${initialTheme}-theme`);

// Initialize responsive system
// initializeResponsiveSystem() // REMOVED: Causing 3.9MB bundle bloat

// Initialize calculator color assets after theme is set
createCalculatorAssets();

// Setup Debug Mode (only in development)
if (import.meta.env.DEV) {
  const { enableDebug, debugManager } = await import("@tachui/devtools/debug");
  handleDebug(enableDebug, debugManager);
}

// Set up App State globally
const appState = new AppStateStore();

// Mount the app using standard TachUI mounting (like intro app)
mountRoot(() => {
  // Create a temporary context if none exists
  try {
    getCurrentComponentContext();
  } catch (_e) {
    const tempContext = createComponentContext("temp-calculator");
    setCurrentComponentContext(tempContext);
  }

  // Provide environment object within this context before calling CalculatorApp
  provideEnvironmentObject(AppStateKey, appState);

  // Create app AFTER assets are guaranteed to be available
  const app = CalculatorApp();
  return app;
});

// Log bundle info for development
if (import.meta.env.DEV) {
  // Show debug instructions only when relevant
  if (
    typeof window !== "undefined" &&
    !window.location?.search.includes("debug=true")
  ) {
  }

  // Log TachUI version info from local development packages
  async function logTachUIVersions() {
    try {
      // Now using workspace packages - this will work with our new exports!
      // const [core, primitives, modifiers] = await Promise.all([
      //   import("@tachui/core/minimal"),
      //   import("@tachui/primitives"),
      //   import("@tachui/modifiers"),
      // ]);
      //   `   ${primitives.TACHUI_PACKAGE}: v${primitives.TACHUI_PACKAGE_VERSION}`,
      // );
      //   `   ${modifiers.TACHUI_PACKAGE}: v${modifiers.TACHUI_PACKAGE_VERSION}`,
      // );
    } catch (error) {
      console.warn("Could not load TachUI version info:", error);
      // Fallback to manual versions
    }
  }

  logTachUIVersions();
}

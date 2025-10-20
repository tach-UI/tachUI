/**
 * Calculator App Color Assets
 *
 * Theme-adaptive color definitions for the calculator app
 * Demonstrates proper ColorAsset usage with light/dark mode support
 */

import {
  registerAsset,
  ColorAsset,
  ImageAsset,
  createColorAsset,
  LinearGradient,
  StateGradient,
} from "@tachui/core/assets";

/**
 * Initialize calculator-specific color assets
 * These will be globally accessible via Assets.calculatorBackground, etc.
 */
export function createCalculatorAssets() {
  // Images
  registerAsset(
    ImageAsset.init({
      // TachUI logo with theme-appropriate variants
      default: "/tachui-logo-light.png",
      light: "/tachui-logo-light.png",
      dark: "/tachui-logo-dark.png",
      name: "tachuiLogo",
    }),
  );

  // Main app container colors
  registerAsset(
    ColorAsset.init({
      // Orange logo text with reduced opacity in dark mode
      default: "hsla(35, 100%, 50%, 0.85)",
      light: "hsla(35, 100%, 50%, 0.85)",
      dark: "hsla(35, 100%, 50%, 0.45)",
      name: "logoText",
    }),
  );

  registerAsset(
    ColorAsset.init({
      // Main calculator body background - white in light, dark gray in dark
      default: "hsla(0, 0%, 100%, 0.95)",
      light: "hsla(0, 0%, 100%, 0.95)",
      dark: "hsla(220, 2%, 18%, 0.95)",
      name: "calculatorBackground",
    }),
  );

  registerAsset(
    ColorAsset.init({
      // Subtle border around calculator - light white/gray
      default: "hsla(0, 0%, 100%, 0.3)",
      light: "hsla(0, 0%, 100%, 0.3)",
      dark: "hsla(240, 2%, 34%, 0.3)",
      name: "calculatorBorder",
    }),
  );

  registerAsset(
    ColorAsset.init({
      // Drop shadow for calculator depth - black with varying opacity
      default: "hsla(0, 0%, 0%, 0.3)",
      light: "hsla(0, 0%, 0%, 0.3)",
      dark: "hsla(0, 100%, 100%, 0.3)",
      name: "calculatorShadow",
    }),
  );

  // Display colors
  registerAsset(
    ColorAsset.init({
      // Calculator display background - very subtle tint
      default: "hsla(0, 0%, 0%, 0.05)",
      light: "hsla(0, 0%, 0%, 0.05)",
      dark: "hsla(0, 0%, 100%, 0.05)",
      name: "displayBackground",
    }),
  );

  registerAsset(
    ColorAsset.init({
      // Display text color - dark in light mode, light in dark mode
      default: "hsl(240, 3%, 12%)",
      light: "hsl(240, 3%, 12%)",
      dark: "hsl(240, 10%, 96%)",
      name: "displayText",
    }),
  );

  // Button colors - Numbers
  registerAsset(
    ColorAsset.init({
      // Number button background - light gray in light mode, darker gray in dark
      default: "hsl(240, 10%, 96%)",
      light: "hsl(240, 10%, 96%)",
      dark: "hsl(0, 0%, 31%)",
      name: "numberButtonBackground",
    }),
  );

  // Button border - Numbers
  registerAsset(
    ColorAsset.init({
      // Subtle border for number buttons - dark/light based on theme
      default: "hsla(0, 0%, 0%, 0.05)",
      light: "hsla(0, 0%, 0%, 0.05)",
      dark: "hsla(0, 0%, 100%, 0.05)",
      name: "numberButtonBorder",
    }),
  );

  registerAsset(
    ColorAsset.init({
      // Number button text color - black in light, white in dark
      default: "hsl(0, 0%, 0%)",
      light: "hsl(0, 0%, 0%)",
      dark: "hsl(0, 0%, 100%)",
      name: "numberButtonForeground",
    }),
  );

  // Button colors - Operators
  registerAsset(
    ColorAsset.init({
      // Operator button background - signature orange color
      default: "hsl(35, 100%, 50%)",
      light: "hsl(35, 100%, 50%)",
      dark: "hsl(37, 100%, 52%)",
      name: "operatorButtonBackground",
    }),
  );

  registerAsset(
    ColorAsset.init({
      // Active/pressed operator button background - white/dark inversion
      default: "hsl(0, 0%, 100%)",
      light: "hsl(0, 0%, 100%)",
      dark: "hsl(240, 3%, 11%)",
      name: "operatorButtonBackgroundActive",
    }),
  );

  registerAsset(
    ColorAsset.init({
      // Operator button text color - white text on orange background
      default: "hsl(0, 0%, 100%)",
      light: "hsl(0, 0%, 100%)",
      dark: "hsl(0, 0%, 0%)",
      name: "operatorButtonForeground",
    }),
  );

  registerAsset(
    ColorAsset.init({
      // Active operator text color - orange when button is pressed/active
      default: "hsl(35, 100%, 50%)",
      light: "hsl(35, 100%, 50%)",
      dark: "hsl(37, 100%, 52%)",
      name: "operatorButtonForegroundActive",
    }),
  );

  // Button colors - Functions (AC, ±, %)
  registerAsset(
    ColorAsset.init({
      // Function button background - medium gray for utility functions
      default: "hsl(0, 0%, 65%)",
      light: "hsl(0, 0%, 65%)",
      dark: "hsl(240, 2%, 39%)",
      name: "functionButtonBackground",
    }),
  );

  registerAsset(
    ColorAsset.init({
      // Function button text color - black/white based on theme
      default: "hsl(0, 0%, 0%)",
      light: "hsl(0, 0%, 0%)",
      dark: "hsl(0, 0%, 100%)",
      name: "functionButtonForeground",
    }),
  );

  // Button gradient overlays with hover effects
  // Creates interactive gradients that reverse color order on hover
  // Default: white-to-black gradient (subtle highlight effect)
  // Hover: black-to-white gradient (reversed for dynamic feedback)

  const buttonGradient = StateGradient("buttonGradientOverlay", {
      default: LinearGradient({
        colors: ["hsla(0, 0%, 100%, 0.15)", "hsla(0, 0%, 0%, 0.15)"],
        startPoint: "topLeading",
        endPoint: "bottomTrailing",
      }),
      hover: LinearGradient({
        colors: ["hsla(0, 0%, 0%, 0.15)", "hsla(0, 0%, 100%, 0.15)"],
        startPoint: "topLeading",
        endPoint: "bottomTrailing",
      }),
      animation: {
        duration: 150,
        easing: "ease-out",
      },
    });

  registerAsset("buttonGradientOverlay", buttonGradient);

  // App background gradient (for body element)
  registerAsset(
    createColorAsset(
      // App background gradient start - blue to dark purple
      "hsl(228, 76%, 67%)", // Light mode: blue start
      "hsl(252, 58%, 26%)", // Dark mode: dark purple start
      "appBackgroundStart",
    ),
  );

  registerAsset(
    createColorAsset(
      // App background gradient end - purple to very dark
      "hsl(267, 37%, 46%)", // Light mode: purple end
      "hsl(248, 29%, 9%)", // Dark mode: very dark end
      "appBackgroundEnd",
    ),
  );
}

/**
 * CSS custom properties for gradient backgrounds
 * These are harder to handle with ColorAssets, so we use CSS custom properties
 */
export function updateGradientColors(isDark: boolean) {
  const root = document.documentElement;

  if (isDark) {
    root.style.setProperty("--gradient-start", "hsl(252, 58%, 26%)");
    root.style.setProperty("--gradient-end", "hsl(248, 29%, 9%)");
  } else {
    root.style.setProperty("--gradient-start", "hsl(228, 76%, 67%)");
    root.style.setProperty("--gradient-end", "hsl(267, 37%, 46%)");
  }
}

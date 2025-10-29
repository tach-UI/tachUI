/**
 * Theme Toggle Component
 *
 * Provides a toggle button for switching between light and dark themes
 * Demonstrates theme switching and reactive state management
 */
import { Button } from "@tachui/primitives/controls";
import { createSignal } from "@tachui/core/reactive";
import { ComponentInstance } from "@tachui/core/runtime/types";
import { Assets } from "@tachui/core/assets";
import { setTheme, getCurrentTheme } from "@tachui/core/reactive";
import { updateGradientColors } from "../assets/calculator-assets";
import { useThemeReactivity } from "../hooks/useTheme";
// Connect to TachUI's theme system
const [isDarkMode, setIsDarkMode] = createSignal(getCurrentTheme() === "dark");
// Function to toggle theme
export function toggleTheme() {
    const newTheme = !isDarkMode();
    console.log('Theme toggle clicked:', { currentDark: isDarkMode(), newDark: newTheme });
    setIsDarkMode(newTheme);
    // Use TachUI's built-in theme system
    setTheme(newTheme ? "dark" : "light");
    console.log('TachUI theme set to:', newTheme ? "dark" : "light");
    // Check if assets are responding to theme changes
    console.log('Assets after theme change:', {
        calculatorBackground: Assets.calculatorBackground,
        logoText: Assets.logoText,
        displayText: Assets.displayText
    });
    // Update document class for CSS gradient switching
    if (newTheme) {
        document.documentElement.classList.add("dark-theme");
        document.documentElement.classList.remove("light-theme");
    }
    else {
        document.documentElement.classList.add("light-theme");
        document.documentElement.classList.remove("dark-theme");
    }
    // Update gradient colors
    updateGradientColors(newTheme);
    // Dispatch theme changed event for useTheme hook
    const event = new CustomEvent('tachui-theme-changed', {
        detail: { theme: newTheme ? "dark" : "light" }
    });
    document.dispatchEvent(event);
}
export function ThemeToggle(): ComponentInstance {
    // Make this component reactive to theme changes
    useThemeReactivity();
    // Use ColorAssets directly - now that reactive system is fixed
    return Button(() => (isDarkMode() ? "𖤓" : "⏾"), toggleTheme)
        .backgroundColor(Assets.logoText)
        .foregroundColor(Assets.numberButtonForeground)
        .cornerRadius(18)
        .padding(0)
        .fontSize(24)
        .border(0)
        .frame({ width: 36, height: 36 })
        .fontWeight("500")
        .margin({ right: 16 })
        .build();
}
// Export the current theme state for other components
export const useIsDarkMode = () => isDarkMode();

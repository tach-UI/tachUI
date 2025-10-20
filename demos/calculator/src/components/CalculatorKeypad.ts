/**
 * Calculator Keypad Component
 *
 * Grid layout of calculator buttons with proper styling and interactions
 * Demonstrates layout systems and button interactions
 */

import { VStack, HStack } from "@tachui/primitives/layout";
import { Button } from "@tachui/primitives/controls";
import { createComputed } from "@tachui/core/reactive";
import { ComponentInstance } from "@tachui/core/runtime/types";
import { Assets } from "@tachui/core/assets";
import type { FontAssetProxy } from "@tachui/core/assets";
import { infinity } from "@tachui/core/constants/layout";

import {
  type CalculatorButton as CalculatorButtonType,
  type Operation,
} from "../logic/calculator-logic";
// Import font assets
import "../assets/calculator-fonts";

// Helper function to classify button types
const getButtonType = (button: string): "number" | "operator" | "function" => {
  if (
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."].includes(button)
  ) {
    return "number";
  }
  if (["+", "-", "×", "÷", "="].includes(button)) {
    return "operator";
  }
  return "function"; // AC, ±, %
};

export interface CalculatorKeypadProps {
  onButtonPress: (button: CalculatorButtonType) => void;
  currentOperation: () => Operation;
}

export function CalculatorKeypad({
  onButtonPress,
  currentOperation,
}: CalculatorKeypadProps): ComponentInstance {
  const calculatorBaseFont = Assets.calculatorBaseFont as FontAssetProxy;

  // Helper function to create a button with proper styling
  const createButton = (value: CalculatorButtonType, size: string = "1") => {
    const buttonType = getButtonType(value);

    // Check if this operator button should be active (highlighted) - make it reactive
    // Note: '=' button should never be active since it completes operations
    const isActive = createComputed(
      () => {
        const current = currentOperation();
        const shouldBeActive = buttonType === "operator" &&
          value !== "=" &&
          value === current;
        return shouldBeActive;
      }
    );

    const handlePress = () => {
      console.log(`Button ${value} clicked - about to call onButtonPress`);

      // Haptic feedback if available
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }

      onButtonPress(value);

      // Special case: blur the Tape button after pressing to prevent Enter key focus issues
      if (value === "Tape") {
        // Use setTimeout to allow the button press to complete first
        setTimeout(() => {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.blur) {
            activeElement.blur();
          }
        }, 10);
      }
    };

    // Get colors based on button type using ColorAssets for theme reactivity
    // ColorAssets are already theme-reactive, so we pass them directly
    let bgColor: any;
    let fgColor: any;

    switch (buttonType) {
      case "number":
        bgColor = Assets.numberButtonBackground;
        fgColor = Assets.numberButtonForeground;
        break;
      case "operator":
        // For operators, we need reactivity for active state
        bgColor = createComputed(() =>
          isActive() ? Assets.operatorButtonBackgroundActive : Assets.operatorButtonBackground
        );
        fgColor = createComputed(() =>
          isActive() ? Assets.operatorButtonForegroundActive : Assets.operatorButtonForeground
        );
        break;
      case "function":
        bgColor = Assets.functionButtonBackground;
        fgColor = Assets.functionButtonForeground;
        break;
      default:
        bgColor = Assets.numberButtonBackground;
        fgColor = Assets.numberButtonForeground;
    }

    const buttonWidth = (() => {
      switch (size) {
        case "2x2":
        case "2w":
          return 160;
        default:
          return 80;
      }
    })();
    const buttonHeight = (() => {
      switch (size) {
        case "2x2":
          return 160;
        case "2w":
        default:
          return 80;
      }
    })();

    // Get appropriate hover effect based on button type
    const getHoverEffect = () => {
      switch (buttonType) {
        case "operator":
          return {
            filter: "drop-shadow(0 0 5px hsla(35, 100%, 50%, 0.33))",
            transform: "scale(1.2)",
          };
        case "function":
          return {
            filter: "drop-shadow(0 0 3px hsla(0, 0%, 0%, 0.2))",
            transform: "scale(1.2)",
          };
        case "number":
        default:
          return {
            filter: "drop-shadow(0 0 2px hsla(0, 0%, 0%, 0.15))",
            transform: "scale(1.2)",
          };
      }
    };

    return Button(value, handlePress)
      .modifier.frame({ width: buttonWidth, height: buttonHeight })
      .background(Assets.buttonGradientOverlay as any)
      .backgroundColor(bgColor)
      .foregroundColor(fgColor)
      .font({
        family: calculatorBaseFont,
        size: 40,
        weight: 400,
      })
      .hover(getHoverEffect())
      .textAlign("center")
      .border(0)
      .letterSpacing("-0.25px")
      .build();
  };

  return VStack({
    spacing: 0,
    debugLabel: "Calculator Keypad",
    children: [
      HStack({
        spacing: 0,
        debugLabel: "Top Row (AC, ⓘ, Tape)",
        children: [
          createButton("AC", "2w"),
          createButton("⌫"),
          createButton("Tape", "2w"),
        ],
      })
        .modifier.frame({ maxWidth: infinity })
        .width("100%")
        .build(),
      HStack({
        spacing: 0,
        debugLabel: "Row 4 (7, 8, 9, -, ÷)",
        children: [
          createButton("7"),
          createButton("8"),
          createButton("9"),
          createButton("-"),
          createButton("÷"),
        ],
      })
        .modifier.frame({ maxWidth: infinity })
        .width("100%")
        .build(),
      HStack({
        spacing: 0,
        debugLabel: "Row 3 (4, 5, 6, +, ×)",
        children: [
          createButton("4"),
          createButton("5"),
          createButton("6"),
          createButton("+"),
          createButton("×"),
        ],
      })
        .modifier.frame({ maxWidth: infinity })
        .width("100%")
        .build(),
      HStack({
        spacing: 0,
        debugLabel: "Row 1+2",
        children: [
          VStack({
            spacing: 0,
            children: [createButton("1"), createButton("±")],
          }),
          VStack({
            spacing: 0,
            children: [createButton("2"), createButton("0")],
          }),
          VStack({
            spacing: 0,
            children: [createButton("3"), createButton(".")],
          }),
          createButton("=", "2x2"),
        ],
      })
        .modifier.frame({ maxWidth: infinity })
        .width("100%")
        .build(),
    ],
  })
    .modifier.frame({ maxWidth: infinity })
    .width("100%")
    .build();
}

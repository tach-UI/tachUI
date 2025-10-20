/**
 * Main Calculator App Component
 *
 * Demonstrates:
 * - SwiftUI-style component composition
 * - Reactive state management with signals
 * - Clean component architecture
 */

import { VStack, HStack, Spacer } from "@tachui/primitives/layout";
import { Text, Image } from "@tachui/primitives/display";
import { EnvironmentObject } from "@tachui/core/state";
import { createSignal, createComputed, type Signal } from "@tachui/core/reactive";
import { ComponentInstance } from "@tachui/core/runtime/types";
import { Assets } from "@tachui/core/assets";
import type { ImageAssetProxy, FontAssetProxy } from "@tachui/core/assets";
import { infinity } from "@tachui/core/constants/layout";

import { CalculatorKeypad } from "./CalculatorKeypad";
import { CalculatorDisplay } from "./CalculatorDisplay";
import {
  calculatorReducer,
  initialState,
  type CalculatorState,
  type CalculatorButton,
} from "../logic/calculator-logic";
import { useKeyboardSupport } from "../hooks/useKeyboardSupport";
import type { TapeEntry } from "../types/calculator-tape";
import { AppStateKey } from "../store/appStateKey";
import { AppStateStore } from "../store/appStateStore";

// Import font assets
import "../assets/calculator-fonts";
import { ThemeToggle } from "./ThemeToggle";

export function CalculatorApp(): ComponentInstance {
  // Calculator state using TachUI's reactive signals
  const [state, setState] = createSignal<CalculatorState>(initialState);

  const tachuiLogo = Assets.tachuiLogo as ImageAssetProxy;
  const calculatorLogoFont = Assets.calculatorLogoFont as FontAssetProxy;
  const calculatorBaseFont = Assets.calculatorBaseFont as FontAssetProxy;

  // Create computed value for display - CalculatorDisplay will handle formatting
  const displayValue = createComputed(() => {
    const currentState = state();
    return currentState.display;
  });

  // Get the app state from the environment
  const appState = EnvironmentObject(
    AppStateKey,
  ) as EnvironmentObject<AppStateStore>;

  // Handle tape entry creation using AppStateStore
  const handleTapeEntry = (entry: TapeEntry) => {
    appState.wrappedValue.addTapeEntry(entry.operation);
  };

  // Handle tape clearing using AppStateStore
  const handleClearTape = () => {
    appState.wrappedValue.clearTape();
  };

  // Handle tape visibility toggle
  const handleToggleTape = () => {
    appState.wrappedValue.toggleTape();
  };

  // Handle button press
  const handleButtonPress = (button: CalculatorButton) => {
    // Handle Tape button separately
    if (button === "Tape") {
      handleToggleTape();
      return;
    }

    setState(prevState => {
      const newState = calculatorReducer(
        prevState,
        button,
        handleTapeEntry,
        handleClearTape,
      );
      return newState;
    });
  };

  // Enable keyboard support
  useKeyboardSupport({
    onButtonPress: handleButtonPress,
    enabled: true, // Re-enabled
  });

  const tapeEntriesSignal: Signal<TapeEntry[]> =
    appState.wrappedValue.tapeEntriesSignal;
  const tapeVisibleSignal: Signal<boolean> =
    appState.wrappedValue.tapeDisplaySignal;

  const result = VStack({
    spacing: 0,
    children: [
      HStack({
        debugLabel: "Logo Row",
        children: [
          // App Logo
          Image(tachuiLogo).modifier.size({ height: 64 }).build(),

          Text("tachulator")
            .modifier.font({
              family: calculatorLogoFont,
              size: 36,
              weight: 200,
            })
            .foregroundColor(Assets.logoText)
            .lineHeight("1")
            .textCase("uppercase")
            .textAlign("left")
            .padding(0)
            .build(),

          Spacer(),

          ThemeToggle(),
        ],
      })
        .modifier.padding({ vertical: 8, horizontal: 16 })
        .frame({ maxWidth: infinity })
        .build(),

      // Calculator Display
      CalculatorDisplay({
        value: displayValue,
        tapeEntries: tapeEntriesSignal,
        tapeVisible: tapeVisibleSignal,
      }),

      // Calculator Keypad
      CalculatorKeypad({
        onButtonPress: handleButtonPress,
        currentOperation: () => state().operation,
      }),
    ],
  })
    .modifier.backgroundColor(Assets.calculatorBackground)
    .cornerRadius(24)
    .padding(0)
      .font({
        family: calculatorBaseFont,
        size: 36,
        weight: 200,
      })
    .frame({ maxWidth: 480 })
    .shadow({ x: 0, y: 20, blur: 40, color: Assets.calculatorShadow })
    .border(1, Assets.calculatorBorder)
    .clipped()
    .build();

  return result;
}

/**
 * Calculator Display Component
 *
 * Shows the current value with proper formatting and styling
 * Now includes integrated calculator tape above the main display
 */

import { VStack } from "@tachui/primitives/layout";
import { Text } from "@tachui/primitives/display";
import { ComponentInstance, withComponentContext } from "@tachui/core/runtime";
import { Assets } from "@tachui/core/assets";
import { infinity } from "@tachui/core/constants/layout";
import { Show } from "@tachui/flow-control/conditional";

import { CalculatorTape } from "./CalculatorTape";
import type { TapeEntry } from "../types/calculator-tape";
// Import font assets
import "../assets/calculator-fonts";

export interface CalculatorDisplayProps {
  value: string | (() => string); // Now expecting already formatted value
  /** Tape entries to display - signal with peek() method */
  tapeEntries?: { (): TapeEntry[]; peek: () => TapeEntry[] };
  /** Whether tape is visible - signal */
  tapeVisible?: { (): boolean; peek: () => boolean };
}

// Format display value for better presentation
const formatDisplayValue = (val: string): string => {
  if (val === "Error") return val;
  if (val === "0") return val;

  // Add thousand separators for large numbers
  const parts = val.split(".");
  if (parts[0].length > 3) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return parts.join(".");
};

function _CalculatorDisplay({
  value,
  tapeEntries,
  tapeVisible,
}: CalculatorDisplayProps): ComponentInstance {
  console.log("Tape Entries:", tapeEntries.peek());
  return VStack({
    spacing: 0,
    id: "trouble-vstack",
    children: [
      // Calculator Tape (collapsible) - Use Show for reactive conditional rendering
      Show({
        when: () => tapeVisible(),
        children: CalculatorTape({
          entries: tapeEntries.peek(),
          visible: true,
        }),
      }),

      // Main display value - using working textAlign function directly
      Text(value)
        .modifier.font({
          family: Assets.calculatorBaseFont,
          size: 48,
          weight: 400,
        })
        .foregroundColor(Assets.displayText)
        .letterSpacing("-0.5px")
        .padding(20)
        .width("100%")
        .textAlign("right") // Now using fixed ModifierBuilder method
        .build(),
    ],
  })
    .modifier.backgroundColor(Assets.displayBackground)
    .cornerRadius(0)
    .padding(8)
    .frame({ maxWidth: infinity, minHeight: 80 })
    .width("100%")
    .build();
}

// Export the wrapped version with component context
export const CalculatorDisplay = withComponentContext(
  _CalculatorDisplay,
  "CalculatorDisplay",
);

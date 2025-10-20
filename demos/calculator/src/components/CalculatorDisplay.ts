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
import type { FontAssetProxy } from "@tachui/core/assets";
import { infinity } from "@tachui/core/constants/layout";
import { Show } from "@tachui/flow-control/conditional";
import type { Signal } from "@tachui/core/reactive";

import { CalculatorTape } from "./CalculatorTape";
import type { TapeEntry } from "../types/calculator-tape";
import "../assets/calculator-fonts";

export interface CalculatorDisplayProps {
  value: string | (() => string);
  tapeEntries: Signal<TapeEntry[]>;
  tapeVisible: Signal<boolean>;
}

function _CalculatorDisplay({
  value,
  tapeEntries,
  tapeVisible,
}: CalculatorDisplayProps): ComponentInstance<CalculatorDisplayProps> {
  const calculatorBaseFont = Assets.calculatorBaseFont as FontAssetProxy;
  const component = VStack({
    spacing: 0,
    children: [
      // Calculator Tape (collapsible) - Use Show for reactive conditional rendering
      Show({
        when: () => tapeVisible(),
        children: CalculatorTape({
          visible: true,
        }),
      }),

      // Main display value - using working textAlign function directly
      Text(value)
        .modifier.font({
          family: calculatorBaseFont,
          size: 48,
          weight: 400,
        })
        .foregroundColor(Assets.displayText)
        .letterSpacing("-0.5px")
        .padding(20)
        .width("100%")
        .textAlign("right")
        .build(),
    ],
  })
    .modifier.backgroundColor(Assets.displayBackground)
    .cornerRadius(0)
    .padding(8)
    .frame({ maxWidth: infinity, minHeight: 80 })
    .width("100%")
    .build();

  return component as ComponentInstance<CalculatorDisplayProps>;
}

// Export the wrapped version with component context
export const CalculatorDisplay = withComponentContext(
  _CalculatorDisplay,
  "CalculatorDisplay",
);

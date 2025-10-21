/**
 * Calculator Tape Component
 *
 * Displays a scrollable history of calculator operations using ForEach for reactivity
 * Accesses tape entries directly from AppStateStore for proper reactive updates
 */

import { VStack } from "@tachui/primitives/layout";
import { Text, ScrollView } from "@tachui/primitives/display";
import { ForEach } from "@tachui/flow-control/iteration";
import { ComponentInstance } from "@tachui/core/runtime/types";
import { Assets } from "@tachui/core/assets";
import { infinity } from "@tachui/core/constants/layout";
import { EnvironmentObject } from "@tachui/core/state";

import type { TapeEntry } from "../types/calculator-tape";
import { AppStateKey } from "../store/appStateKey";
import { AppStateStore } from "../store/appStateStore";

export interface CalculatorTapeProps {
  /** Whether the tape is visible */
  visible?: boolean | (() => boolean);
}

export function CalculatorTape({}: CalculatorTapeProps): ComponentInstance {
  // Access the app state directly from environment
  const appState = EnvironmentObject(
    AppStateKey,
  ) as EnvironmentObject<AppStateStore>;

  // Get tape entries signal directly from store
  const tapeEntries = appState.wrappedValue.tapeEntriesSignal;

  // Create VStack with ForEach for reactive tape entries
  const tapeContent = VStack({
    children: [
      // Reactive debug text showing count
      Text(() => {
        const entries = tapeEntries();
        return `Entries: ${entries.length}`;
      })
        .modifier.fontSize(12)
        .foregroundColor(Assets.displayText)
        .opacity(0.5)
        .textAlign("center")
        .padding(4)
        .build(),

      // ForEach for reactive list of operations using items property
      ForEach({
        data: tapeEntries,
        children: (entry: TapeEntry) => {
          return Text(entry.operation)
            .modifier.fontSize(15)
            .fontWeight(500)
            .foregroundColor(Assets.displayText)
            .frame({ maxWidth: infinity })
            .textAlign("right")
            .padding({ vertical: 4, right: 12 })
            .build();
        },
      }),
    ],
    spacing: 2,
  });

  // Return ScrollView with VStack containing ForEach
  return ScrollView({
    children: [tapeContent],
    direction: "vertical",
  })
    .modifier.frame({ height: 120 }) // Fixed height as per design
    .backgroundColor(Assets.displayBackground)
    .cornerRadius(12)
    .paddingVertical(4)
    .build();
}

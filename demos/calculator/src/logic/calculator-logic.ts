/**
 * Calculator Logic
 *
 * Pure functions for calculator operations and state management
 * Demonstrates clean separation of logic from UI components
 */

import type { TapeEntry } from "../types/calculator-tape";

export type Operation = "+" | "-" | "×" | "÷" | "=" | null;
export type CalculatorButton =
  | "AC"
  | "±"
  | "%"
  | "⌫"
  | "Tape"
  | "7"
  | "8"
  | "9"
  | "÷"
  | "4"
  | "5"
  | "6"
  | "×"
  | "1"
  | "2"
  | "3"
  | "-"
  | "0"
  | "."
  | "+"
  | "=";

export interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: Operation;
  waitingForOperand: boolean;
  memory: number;
}

/**
 * Callback type for emitting tape entries
 */
export type TapeEntryCallback = (entry: TapeEntry) => void;

export const initialState: CalculatorState = {
  display: "0",
  previousValue: null,
  operation: null,
  waitingForOperand: false,
  memory: 0,
};

/**
 * Format display value with proper number formatting
 */
export function formatDisplay(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "0";

  // Handle very large or very small numbers with scientific notation
  if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(5);
  }

  // Format with appropriate decimal places
  const formatted = num.toString();

  // Limit display length
  if (formatted.length > 12) {
    if (formatted.includes(".")) {
      return num.toFixed(Math.max(0, 12 - formatted.split(".")[0].length - 1));
    }
    return num.toExponential(5);
  }

  return formatted;
}

/**
 * Perform arithmetic operations
 */
export function calculate(
  firstOperand: number,
  secondOperand: number,
  operation: Operation,
): number {
  switch (operation) {
    case "+":
      return firstOperand + secondOperand;
    case "-":
      return firstOperand - secondOperand;
    case "×":
      return firstOperand * secondOperand;
    case "÷":
      if (secondOperand === 0) {
        throw new Error("Division by zero");
      }
      return firstOperand / secondOperand;
    default:
      return secondOperand;
  }
}

/**
 * Handle number input
 */
export function inputNumber(
  state: CalculatorState,
  digit: string,
): CalculatorState {
  const { display, waitingForOperand } = state;

  if (waitingForOperand) {
    return {
      ...state,
      display: digit,
      waitingForOperand: false,
    };
  }

  if (display === "0") {
    return {
      ...state,
      display: digit,
    };
  }

  return {
    ...state,
    display: display + digit,
  };
}

/**
 * Handle decimal point input
 */
export function inputDecimal(state: CalculatorState): CalculatorState {
  const { display, waitingForOperand } = state;

  if (waitingForOperand) {
    return {
      ...state,
      display: "0.",
      waitingForOperand: false,
    };
  }

  if (display.indexOf(".") === -1) {
    return {
      ...state,
      display: display + ".",
    };
  }

  return state;
}

/**
 * Handle operation input
 */
export function inputOperation(
  state: CalculatorState,
  nextOperation: Operation,
  onTapeEntry?: TapeEntryCallback,
): CalculatorState {
  const { display, previousValue, operation, waitingForOperand } = state;
  const inputValue = parseFloat(display);

  if (previousValue === null) {
    return {
      ...state,
      previousValue: inputValue,
      operation: nextOperation,
      waitingForOperand: true,
    };
  }

  if (operation && waitingForOperand) {
    return {
      ...state,
      operation: nextOperation,
    };
  }

  try {
    const result = calculate(previousValue, inputValue, operation);

    // Create tape entry for completed operation
    if (onTapeEntry && operation) {
      const operationText = `${formatDisplay(previousValue)} ${operation} ${formatDisplay(inputValue)} = ${formatDisplay(result)}`;
      onTapeEntry({
        id: Date.now(),
        operation: operationText,
        timestamp: new Date(),
        historyIndex: Date.now(), // Unique index for ordering
      });
    }

    return {
      ...state,
      display: formatDisplay(result),
      previousValue: nextOperation === "=" ? null : result,
      operation: nextOperation === "=" ? null : nextOperation,
      waitingForOperand: true,
    };
  } catch (_error) {
    return {
      ...state,
      display: "Error",
      previousValue: null,
      operation: null,
      waitingForOperand: true,
    };
  }
}

/**
 * Handle all clear (AC)
 */
export function allClear(): CalculatorState {
  return { ...initialState };
}

/**
 * Handle plus/minus toggle
 */
export function toggleSign(state: CalculatorState): CalculatorState {
  const { display } = state;

  if (display === "0") {
    return state;
  }

  if (display.charAt(0) === "-") {
    return {
      ...state,
      display: display.substring(1),
    };
  }

  return {
    ...state,
    display: "-" + display,
  };
}

/**
 * Handle percentage
 */
export function percentage(state: CalculatorState): CalculatorState {
  const { display } = state;
  const value = parseFloat(display);

  if (isNaN(value)) {
    return state;
  }

  return {
    ...state,
    display: formatDisplay(value / 100),
  };
}

/**
 * Handle backspace operation
 */
export function backspace(state: CalculatorState): CalculatorState {
  const { display, waitingForOperand } = state;

  // If waiting for operand, don't allow backspace
  if (waitingForOperand) {
    return state;
  }

  // If display has only one character or is "0", reset to "0"
  if (display.length <= 1 || display === "0") {
    return {
      ...state,
      display: "0",
    };
  }

  // Remove last character
  const newDisplay = display.slice(0, -1);

  return {
    ...state,
    display: newDisplay || "0",
  };
}

/**
 * Main reducer function for calculator state
 */
export function calculatorReducer(
  state: CalculatorState,
  button: CalculatorButton,
  onTapeEntry?: TapeEntryCallback,
  onClearTape?: () => void,
): CalculatorState {
  switch (button) {
    case "AC":
      // Clear both calculator state and tape
      if (onClearTape) {
        onClearTape();
      }
      return allClear();

    case "±":
      return toggleSign(state);

    case "%":
      return percentage(state);

    case ".":
      return inputDecimal(state);

    case "÷":
    case "×":
    case "-":
    case "+":
    case "=":
      return inputOperation(state, button, onTapeEntry);

    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      return inputNumber(state, button);

    case "⌫":
      return backspace(state);

    case "Tape":
      // Tape button is handled in the UI layer, not here
      return state;

    default:
      return state;
  }
}

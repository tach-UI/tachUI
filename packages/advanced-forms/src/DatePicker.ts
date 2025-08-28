/**
 * DatePicker Component (TachUI)
 *
 * SwiftUI-inspired date and time selection component with multiple styles
 * and display modes. Supports reactive bindings and comprehensive customization.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import { createEffect, isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h } from '@tachui/core'
import type { ComponentInstance, ComponentProps, DOMNode } from '@tachui/core'
import { withModifiers } from '@tachui/core'

/**
 * Date picker display components
 */
export type DatePickerDisplayComponents = 'date' | 'time' | 'dateAndTime'

/**
 * Date picker style options
 */
export type DatePickerStyle = 'compact' | 'wheel' | 'graphical'

/**
 * DatePicker component properties
 */
export interface DatePickerProps extends ComponentProps {
  // Core properties
  title?: string
  selection: Signal<Date> | Date

  // Display options
  displayedComponents?: DatePickerDisplayComponents | Signal<DatePickerDisplayComponents>
  style?: DatePickerStyle | Signal<DatePickerStyle>

  // Constraints
  minimumDate?: Date | Signal<Date>
  maximumDate?: Date | Signal<Date>

  // Localization
  locale?: string | Signal<string>
  dateFormat?: string | Signal<string>
  timeFormat?: string | Signal<string>

  // Behavior
  onChange?: (date: Date) => void
  disabled?: boolean | Signal<boolean>

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * DatePicker theme configuration
 */
export interface DatePickerTheme {
  colors: {
    background: string
    border: string
    text: string
    selectedBackground: string
    selectedText: string
    disabledText: string
    accent: string
  }
  spacing: {
    padding: number
    gap: number
    itemHeight: number
  }
  borderRadius: number
  fontSize: number
  fontFamily: string
}

/**
 * Default DatePicker theme
 */
const defaultDatePickerTheme: DatePickerTheme = {
  colors: {
    background: '#FFFFFF',
    border: '#D1D1D6',
    text: '#000000',
    selectedBackground: '#007AFF',
    selectedText: '#FFFFFF',
    disabledText: '#8E8E93',
    accent: '#007AFF',
  },
  spacing: {
    padding: 12,
    gap: 8,
    itemHeight: 44,
  },
  borderRadius: 8,
  fontSize: 16,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

/**
 * DatePicker component implementation
 */
export class DatePickerComponent implements ComponentInstance<DatePickerProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: DatePickerProps
  private theme: DatePickerTheme = defaultDatePickerTheme
  private containerElement: HTMLElement | null = null

  constructor(props: DatePickerProps) {
    this.props = props
    this.id = `datepicker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private resolveValue<T>(value: T | Signal<T>): T {
    return isSignal(value) ? value() : value
  }

  private getSelectedDate(): Date {
    return this.resolveValue(this.props.selection)
  }

  private setSelectedDate(date: Date): void {
    if (isSignal(this.props.selection)) {
      // biome-ignore lint/suspicious/noExplicitAny: Signal setter requires dynamic typing
      ;(this.props.selection as any)(date)
    }

    if (this.props.onChange) {
      this.props.onChange(date)
    }
  }

  private getDisplayedComponents(): DatePickerDisplayComponents {
    return this.resolveValue(this.props.displayedComponents || 'date')
  }

  private getStyle(): DatePickerStyle {
    return this.resolveValue(this.props.style || 'compact')
  }

  private isDisabled(): boolean {
    return this.resolveValue(this.props.disabled || false)
  }

  private getMinimumDate(): Date | null {
    return this.props.minimumDate ? this.resolveValue(this.props.minimumDate) : null
  }

  private getMaximumDate(): Date | null {
    return this.props.maximumDate ? this.resolveValue(this.props.maximumDate) : null
  }

  private isDateInRange(date: Date): boolean {
    const min = this.getMinimumDate()
    const max = this.getMaximumDate()

    if (min && date < min) return false
    if (max && date > max) return false

    return true
  }

  private createCompactPicker(): DOMNode {
    const selectedDate = this.getSelectedDate()
    const components = this.getDisplayedComponents()

    const container = h('div', {
      style: {
        position: 'relative',
        display: 'inline-block',
      },
    })

    const input = h('input', {
      type: components === 'time' ? 'time' : components === 'date' ? 'date' : 'datetime-local',
      value: this.getInputValue(selectedDate, components),
      disabled: this.isDisabled(),
      min: this.getMinimumDate()?.toISOString().split('T')[0],
      max: this.getMaximumDate()?.toISOString().split('T')[0],
      style: {
        padding: `${this.theme.spacing.padding}px`,
        border: `1px solid ${this.theme.colors.border}`,
        borderRadius: `${this.theme.borderRadius}px`,
        backgroundColor: this.theme.colors.background,
        color: this.isDisabled() ? this.theme.colors.disabledText : this.theme.colors.text,
        fontSize: `${this.theme.fontSize}px`,
        fontFamily: this.theme.fontFamily,
        cursor: this.isDisabled() ? 'not-allowed' : 'pointer',
        outline: 'none',
      },
      onchange: (e: Event) => {
        const target = e.target as HTMLInputElement
        if (target.value) {
          const newDate = new Date(target.value)
          if (this.isDateInRange(newDate)) {
            this.setSelectedDate(newDate)
          }
        }
      },
      onfocus: (e: Event) => {
        const target = e.target as HTMLInputElement
        target.style.borderColor = this.theme.colors.accent
      },
      onblur: (e: Event) => {
        const target = e.target as HTMLInputElement
        target.style.borderColor = this.theme.colors.border
      },
    })

    const containerDOM = container.element as HTMLElement
    const inputDOM = input.element as HTMLElement

    if (containerDOM && inputDOM) {
      containerDOM.appendChild(inputDOM)
    }

    return container
  }

  private getInputValue(date: Date, components: DatePickerDisplayComponents): string {
    // Handle invalid dates gracefully
    if (Number.isNaN(date.getTime())) {
      switch (components) {
        case 'date':
          return ''
        case 'time':
          return '00:00'
        case 'dateAndTime':
          return ''
        default:
          return ''
      }
    }

    try {
      switch (components) {
        case 'date':
          return date.toISOString().split('T')[0]
        case 'time':
          return date.toTimeString().split(' ')[0].substring(0, 5)
        case 'dateAndTime':
          return date.toISOString().slice(0, 16)
        default:
          return date.toISOString().split('T')[0]
      }
    } catch {
      // Fallback for any date formatting errors
      return ''
    }
  }

  private createWheelPicker(): DOMNode {
    // Wheel picker with scrollable date/time components
    const container = h('div', {
      style: {
        display: 'flex',
        justifyContent: 'center',
        gap: `${this.theme.spacing.gap}px`,
        padding: `${this.theme.spacing.padding}px`,
        border: `1px solid ${this.theme.colors.border}`,
        borderRadius: `${this.theme.borderRadius}px`,
        backgroundColor: this.theme.colors.background,
      },
    })

    const components = this.getDisplayedComponents()
    const selectedDate = this.getSelectedDate()

    // Create wheel components based on display mode
    if (components === 'date' || components === 'dateAndTime') {
      this.createDateWheels(container, selectedDate)
    }

    if (components === 'time' || components === 'dateAndTime') {
      this.createTimeWheels(container, selectedDate)
    }

    return container
  }

  private createDateWheels(container: DOMNode, selectedDate: Date): void {
    // Month wheel
    const monthWheel = this.createWheel(
      Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: new Date(2024, i, 1).toLocaleDateString(
          this.resolveValue(this.props.locale || 'en-US'),
          { month: 'short' }
        ),
      })),
      selectedDate.getMonth(),
      (value) => {
        const newDate = new Date(selectedDate)
        newDate.setMonth(value)
        if (this.isDateInRange(newDate)) {
          this.setSelectedDate(newDate)
        }
      }
    )

    // Day wheel
    const daysInMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    ).getDate()
    const dayWheel = this.createWheel(
      Array.from({ length: daysInMonth }, (_, i) => ({
        value: i + 1,
        label: (i + 1).toString(),
      })),
      selectedDate.getDate(),
      (value) => {
        const newDate = new Date(selectedDate)
        newDate.setDate(value)
        if (this.isDateInRange(newDate)) {
          this.setSelectedDate(newDate)
        }
      }
    )

    // Year wheel
    const currentYear = selectedDate.getFullYear()
    const yearRange = 50
    const yearWheel = this.createWheel(
      Array.from({ length: yearRange * 2 }, (_, i) => {
        const year = currentYear - yearRange + i
        return { value: year, label: year.toString() }
      }),
      currentYear,
      (value) => {
        const newDate = new Date(selectedDate)
        newDate.setFullYear(value)
        if (this.isDateInRange(newDate)) {
          this.setSelectedDate(newDate)
        }
      }
    )

    const containerDOM = container.element as HTMLElement
    if (containerDOM) {
      const monthWheelDOM = monthWheel.element as HTMLElement
      const dayWheelDOM = dayWheel.element as HTMLElement
      const yearWheelDOM = yearWheel.element as HTMLElement

      if (monthWheelDOM) containerDOM.appendChild(monthWheelDOM)
      if (dayWheelDOM) containerDOM.appendChild(dayWheelDOM)
      if (yearWheelDOM) containerDOM.appendChild(yearWheelDOM)
    }
  }

  private createTimeWheels(container: DOMNode, selectedDate: Date): void {
    // Hour wheel
    const hourWheel = this.createWheel(
      Array.from({ length: 24 }, (_, i) => ({
        value: i,
        label: i.toString().padStart(2, '0'),
      })),
      selectedDate.getHours(),
      (value) => {
        const newDate = new Date(selectedDate)
        newDate.setHours(value)
        if (this.isDateInRange(newDate)) {
          this.setSelectedDate(newDate)
        }
      }
    )

    // Minute wheel
    const minuteWheel = this.createWheel(
      Array.from({ length: 60 }, (_, i) => ({
        value: i,
        label: i.toString().padStart(2, '0'),
      })),
      selectedDate.getMinutes(),
      (value) => {
        const newDate = new Date(selectedDate)
        newDate.setMinutes(value)
        if (this.isDateInRange(newDate)) {
          this.setSelectedDate(newDate)
        }
      }
    )

    const containerDOM = container.element as HTMLElement
    if (containerDOM) {
      const hourWheelDOM = hourWheel.element as HTMLElement
      const minuteWheelDOM = minuteWheel.element as HTMLElement

      if (hourWheelDOM) containerDOM.appendChild(hourWheelDOM)
      if (minuteWheelDOM) containerDOM.appendChild(minuteWheelDOM)
    }
  }

  private createWheel(
    items: { value: number; label: string }[],
    selectedValue: number,
    onSelect: (value: number) => void
  ): DOMNode {
    const wheel = h('div', {
      style: {
        width: '80px',
        height: '200px',
        overflowY: 'scroll',
        border: `1px solid ${this.theme.colors.border}`,
        borderRadius: `${this.theme.borderRadius}px`,
        scrollSnapType: 'y mandatory',
      },
    })

    items.forEach((item) => {
      const option = h('div', {
        style: {
          height: `${this.theme.spacing.itemHeight}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            item.value === selectedValue ? this.theme.colors.selectedBackground : 'transparent',
          color:
            item.value === selectedValue ? this.theme.colors.selectedText : this.theme.colors.text,
          cursor: 'pointer',
          scrollSnapAlign: 'center',
          fontSize: `${this.theme.fontSize}px`,
          fontFamily: this.theme.fontFamily,
        },
        onclick: () => onSelect(item.value),
      })

      const optionDOM = option.element as HTMLElement
      if (optionDOM) {
        optionDOM.textContent = item.label
      }

      const wheelDOM = wheel.element as HTMLElement
      if (wheelDOM && optionDOM) {
        wheelDOM.appendChild(optionDOM)
      }
    })

    return wheel
  }

  private createGraphicalPicker(): DOMNode {
    // Calendar grid for date selection
    const selectedDate = this.getSelectedDate()
    const currentMonth = selectedDate.getMonth()
    const currentYear = selectedDate.getFullYear()

    const container = h('div', {
      style: {
        border: `1px solid ${this.theme.colors.border}`,
        borderRadius: `${this.theme.borderRadius}px`,
        backgroundColor: this.theme.colors.background,
        padding: `${this.theme.spacing.padding}px`,
        fontFamily: this.theme.fontFamily,
      },
    })

    // Month/Year header
    const header = h('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: `${this.theme.spacing.gap}px`,
        padding: `${this.theme.spacing.gap}px`,
      },
    })

    const monthYear = h('div', {
      style: {
        fontSize: `${this.theme.fontSize + 2}px`,
        fontWeight: '600',
        color: this.theme.colors.text,
      },
    })

    const monthYearDOM = monthYear.element as HTMLElement
    if (monthYearDOM) {
      monthYearDOM.textContent = new Date(currentYear, currentMonth, 1).toLocaleDateString(
        this.resolveValue(this.props.locale || 'en-US'),
        { month: 'long', year: 'numeric' }
      )
    }

    // Navigation buttons
    const prevButton = h('button', {
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        color: this.theme.colors.accent,
        cursor: 'pointer',
        fontSize: `${this.theme.fontSize + 4}px`,
        padding: '4px 8px',
      },
      onclick: () => {
        const newDate = new Date(selectedDate)
        newDate.setMonth(currentMonth - 1)
        if (this.isDateInRange(newDate)) {
          this.setSelectedDate(newDate)
        }
      },
    })

    const prevButtonDOM = prevButton.element as HTMLElement
    if (prevButtonDOM) {
      prevButtonDOM.textContent = '‹'
    }

    const nextButton = h('button', {
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        color: this.theme.colors.accent,
        cursor: 'pointer',
        fontSize: `${this.theme.fontSize + 4}px`,
        padding: '4px 8px',
      },
      onclick: () => {
        const newDate = new Date(selectedDate)
        newDate.setMonth(currentMonth + 1)
        if (this.isDateInRange(newDate)) {
          this.setSelectedDate(newDate)
        }
      },
    })

    const nextButtonDOM = nextButton.element as HTMLElement
    if (nextButtonDOM) {
      nextButtonDOM.textContent = '›'
    }

    // Calendar grid
    const grid = this.createCalendarGrid(selectedDate)

    // Assemble components
    const headerDOM = header.element as HTMLElement
    const containerDOM = container.element as HTMLElement

    if (headerDOM) {
      const prevButtonDOM = prevButton.element as HTMLElement
      const monthYearDOM = monthYear.element as HTMLElement
      const nextButtonDOM = nextButton.element as HTMLElement

      if (prevButtonDOM) headerDOM.appendChild(prevButtonDOM)
      if (monthYearDOM) headerDOM.appendChild(monthYearDOM)
      if (nextButtonDOM) headerDOM.appendChild(nextButtonDOM)
    }

    if (containerDOM) {
      if (headerDOM) containerDOM.appendChild(headerDOM)
      const gridDOM = grid.element as HTMLElement
      if (gridDOM) containerDOM.appendChild(gridDOM)
    }

    return container
  }

  private createCalendarGrid(selectedDate: Date): DOMNode {
    const currentMonth = selectedDate.getMonth()
    const currentYear = selectedDate.getFullYear()

    const grid = h('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
        fontSize: `${this.theme.fontSize}px`,
      },
    })

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    dayHeaders.forEach((day) => {
      const dayHeader = h('div', {
        style: {
          padding: '8px 4px',
          textAlign: 'center',
          fontWeight: '600',
          color: this.theme.colors.disabledText,
          fontSize: `${this.theme.fontSize - 2}px`,
        },
      })

      const dayHeaderDOM = dayHeader.element as HTMLElement
      if (dayHeaderDOM) {
        dayHeaderDOM.textContent = day
      }

      const gridDOM = grid.element as HTMLElement
      if (gridDOM && dayHeaderDOM) {
        gridDOM.appendChild(dayHeaderDOM)
      }
    })

    // Calendar days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

    // Previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const dayElement = this.createDayElement(
        new Date(currentYear, currentMonth - 1, day),
        selectedDate,
        true // isOtherMonth
      )
      const gridDOM = grid.element as HTMLElement
      const dayElementDOM = dayElement.element as HTMLElement
      if (gridDOM && dayElementDOM) {
        gridDOM.appendChild(dayElementDOM)
      }
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dayElement = this.createDayElement(date, selectedDate, false)
      const gridDOM = grid.element as HTMLElement
      const dayElementDOM = dayElement.element as HTMLElement
      if (gridDOM && dayElementDOM) {
        gridDOM.appendChild(dayElementDOM)
      }
    }

    // Next month's leading days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
    const remainingCells = totalCells - (firstDay + daysInMonth)
    for (let day = 1; day <= remainingCells; day++) {
      const dayElement = this.createDayElement(
        new Date(currentYear, currentMonth + 1, day),
        selectedDate,
        true // isOtherMonth
      )
      const gridDOM = grid.element as HTMLElement
      const dayElementDOM = dayElement.element as HTMLElement
      if (gridDOM && dayElementDOM) {
        gridDOM.appendChild(dayElementDOM)
      }
    }

    return grid
  }

  private createDayElement(date: Date, selectedDate: Date, isOtherMonth: boolean): DOMNode {
    const isSelected = date.toDateString() === selectedDate.toDateString()
    const isToday = date.toDateString() === new Date().toDateString()
    const isInRange = this.isDateInRange(date)
    const isDisabled = this.isDisabled() || !isInRange

    const dayElement = h('button', {
      disabled: isDisabled,
      style: {
        padding: '8px',
        border: 'none',
        backgroundColor: isSelected
          ? this.theme.colors.selectedBackground
          : isToday
            ? `${this.theme.colors.accent}20`
            : 'transparent',
        color: isSelected
          ? this.theme.colors.selectedText
          : isOtherMonth || isDisabled
            ? this.theme.colors.disabledText
            : this.theme.colors.text,
        borderRadius: '4px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontSize: `${this.theme.fontSize}px`,
        fontWeight: isSelected || isToday ? '600' : '400',
        textAlign: 'center',
        minHeight: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      onclick: () => {
        if (!isDisabled) {
          this.setSelectedDate(date)
        }
      },
      onmouseenter: (e: Event) => {
        if (!isDisabled && !isSelected) {
          const target = e.target as HTMLElement
          target.style.backgroundColor = `${this.theme.colors.accent}10`
        }
      },
      onmouseleave: (e: Event) => {
        if (!isDisabled && !isSelected && !isToday) {
          const target = e.target as HTMLElement
          target.style.backgroundColor = 'transparent'
        }
      },
    })

    const dayElementDOM = dayElement.element as HTMLElement
    if (dayElementDOM) {
      dayElementDOM.textContent = date.getDate().toString()
    }

    return dayElement
  }

  render(): DOMNode {
    const container = h('div', {
      id: this.id,
      'data-component': 'datepicker',
      style: {
        display: 'inline-block',
      },
    })

    // Add title if provided
    if (this.props.title) {
      const label = h('label', {
        for: `${this.id}-input`,
        style: {
          display: 'block',
          marginBottom: `${this.theme.spacing.gap}px`,
          fontSize: `${this.theme.fontSize}px`,
          fontWeight: '500',
          color: this.theme.colors.text,
          fontFamily: this.theme.fontFamily,
        },
      })

      const labelDOM = label.element as HTMLElement
      if (labelDOM) {
        labelDOM.textContent = this.props.title
      }

      const containerDOM = container.element as HTMLElement
      if (containerDOM && labelDOM) {
        containerDOM.appendChild(labelDOM)
      }
    }

    // Create picker based on style
    const style = this.getStyle()
    let picker: DOMNode

    switch (style) {
      case 'wheel':
        picker = this.createWheelPicker()
        break
      case 'graphical':
        picker = this.createGraphicalPicker()
        break
      default:
        picker = this.createCompactPicker()
        break
    }

    const containerDOM = container.element as HTMLElement
    const pickerDOM = picker.element as HTMLElement
    if (containerDOM && pickerDOM) {
      containerDOM.appendChild(pickerDOM)
    }

    // Set up reactive effects
    createEffect(() => {
      // Update picker when reactive props change
      if (
        isSignal(this.props.selection) ||
        isSignal(this.props.style) ||
        isSignal(this.props.displayedComponents)
      ) {
        // Re-render picker with new values
        this.updatePicker()
      }
    })

    return container
  }

  private updatePicker(): void {
    // Re-render the picker when reactive properties change
    if (this.containerElement) {
      const style = this.getStyle()
      let newPicker: DOMNode

      switch (style) {
        case 'wheel':
          newPicker = this.createWheelPicker()
          break
        case 'graphical':
          newPicker = this.createGraphicalPicker()
          break
        default:
          newPicker = this.createCompactPicker()
          break
      }

      const newPickerDOM = newPicker.element as HTMLElement
      if (newPickerDOM) {
        // Replace the old picker with the new one
        const oldPicker = this.containerElement.querySelector(
          '[data-component="datepicker"] > *:last-child'
        )
        if (oldPicker && this.containerElement) {
          this.containerElement.replaceChild(newPickerDOM, oldPicker)
        }
      }
    }
  }
}

/**
 * Create a DatePicker component
 */
export function DatePicker(props: DatePickerProps): ModifiableComponent<DatePickerProps> & {
  modifier: ModifierBuilder<ModifiableComponent<DatePickerProps>>
} {
  return withModifiers(new DatePickerComponent(props))
}

/**
 * DatePicker utility functions and presets
 */
export const DatePickerUtils = {
  /**
   * Create a birthday picker (past dates only)
   */
  birthday(selection: Signal<Date>): DatePickerProps {
    return {
      title: 'Birthday',
      selection,
      displayedComponents: 'date',
      style: 'compact',
      maximumDate: new Date(),
    }
  },

  /**
   * Create a meeting time picker (future dates only)
   */
  meetingTime(selection: Signal<Date>): DatePickerProps {
    return {
      title: 'Meeting Time',
      selection,
      displayedComponents: 'dateAndTime',
      style: 'compact',
      minimumDate: new Date(),
    }
  },

  /**
   * Create a deadline picker with date range
   */
  deadline(selection: Signal<Date>, minimumDate?: Date, maximumDate?: Date): DatePickerProps {
    return {
      title: 'Deadline',
      selection,
      displayedComponents: 'date',
      style: 'graphical',
      minimumDate: minimumDate || new Date(),
      maximumDate: maximumDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    }
  },

  /**
   * Create a time-only picker
   */
  timeOnly(selection: Signal<Date>): DatePickerProps {
    return {
      title: 'Time',
      selection,
      displayedComponents: 'time',
      style: 'wheel',
    }
  },
}

/**
 * DatePicker styles and theming
 */
export const DatePickerStyles = {
  theme: defaultDatePickerTheme,

  /**
   * Create a custom theme
   */
  createTheme(overrides: Partial<DatePickerTheme>): DatePickerTheme {
    return { ...defaultDatePickerTheme, ...overrides }
  },
}

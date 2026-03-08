# DatePicker

A SwiftUI-inspired date and time selection component that provides multiple picker styles and display modes for comprehensive date input functionality.

## Overview

The `DatePicker` component offers flexible date and time selection with support for different visual styles, display components, and date constraints. It integrates seamlessly with TachUI's reactive system and modifier pipeline.

## Basic Usage

```typescript
import { DatePicker } from '@tachui/advanced-forms'
import { createSignal } from '@tachui/core'

function BasicExample() {
  const [birthDate, setBirthDate] = createSignal(new Date('1990-01-01'))

  return DatePicker({
    title: "Birth Date",
    selection: birthDate
  }).build()
}
```

## API Reference

### DatePickerProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selection` | `Signal<Date> \| Date` | **Required** | The selected date value |
| `title` | `string` | `undefined` | Label text displayed above the picker |
| `displayedComponents` | `'date' \| 'time' \| 'dateAndTime'` | `'date'` | Which components to show |
| `style` | `'compact' \| 'wheel' \| 'graphical'` | `'compact'` | Visual style of the picker |
| `minimumDate` | `Date \| Signal<Date>` | `undefined` | Earliest selectable date |
| `maximumDate` | `Date \| Signal<Date>` | `undefined` | Latest selectable date |
| `locale` | `string \| Signal<string>` | `'en-US'` | Localization for date formatting |
| `dateFormat` | `string \| Signal<string>` | `undefined` | Custom date format string |
| `timeFormat` | `string \| Signal<string>` | `undefined` | Custom time format string |
| `onChange` | `(date: Date) => void` | `undefined` | Callback when date changes |
| `disabled` | `boolean \| Signal<boolean>` | `false` | Whether picker is disabled |
| `accessibilityLabel` | `string` | `undefined` | ARIA label for accessibility |
| `accessibilityHint` | `string` | `undefined` | ARIA description for accessibility |

## Picker Styles

### Compact Style (Default)
Uses native HTML input elements for a clean, system-integrated appearance:

```typescript
DatePicker({
  title: "Event Date",
  selection: eventDate,
  style: 'compact'
}).build()
```

### Wheel Style
Scrollable wheel interface inspired by mobile date pickers:

```typescript
DatePicker({
  title: "Meeting Time",
  selection: meetingTime,
  style: 'wheel',
  displayedComponents: 'dateAndTime'
}).build()
```

### Graphical Style
Calendar grid interface for intuitive date selection:

```typescript
DatePicker({
  title: "Vacation Start",
  selection: vacationDate,
  style: 'graphical'
}).build()
```

## Display Components

### Date Only
Shows only date selection (year, month, day):

```typescript
DatePicker({
  title: "Birth Date",
  selection: birthDate,
  displayedComponents: 'date'
}).build()
```

### Time Only
Shows only time selection (hours, minutes):

```typescript
DatePicker({
  title: "Meeting Time",
  selection: meetingTime,
  displayedComponents: 'time'
}).build()
```

### Date and Time
Shows both date and time selection:

```typescript
DatePicker({
  title: "Appointment",
  selection: appointmentDateTime,
  displayedComponents: 'dateAndTime'
}).build()
```

## Date Constraints

### Minimum and Maximum Dates
Restrict the selectable date range:

```typescript
const [deadline, setDeadline] = createSignal(new Date())
const minDate = new Date() // Today
const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now

DatePicker({
  title: "Project Deadline",
  selection: deadline,
  minimumDate: minDate,
  maximumDate: maxDate,
  style: 'graphical'
}).build()
```

### Reactive Constraints
Date constraints can be reactive and change dynamically:

```typescript
const [selectedDate, setSelectedDate] = createSignal(new Date())
const [minDate, setMinDate] = createSignal(new Date())
const [maxDate, setMaxDate] = createSignal(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

// Constraints update automatically when signals change
DatePicker({
  title: "Dynamic Range",
  selection: selectedDate,
  minimumDate: minDate,
  maximumDate: maxDate
}).build()
```

## Event Handling

### onChange Callback
React to date selection changes:

```typescript
const [selectedDate, setSelectedDate] = createSignal(new Date())

DatePicker({
  title: "Event Date",
  selection: selectedDate,
  onChange: (newDate) => {
    console.log('Date selected:', newDate)
    // Perform additional actions
    setSelectedDate(newDate)
  }
}).build()
```

## Localization

### Custom Locale
Display dates in different locales:

```typescript
DatePicker({
  title: "Fecha de Nacimiento",
  selection: birthDate,
  locale: 'es-ES'
}).build()
```

### Reactive Locale
Change locale dynamically:

```typescript
const [locale, setLocale] = createSignal('en-US')

DatePicker({
  title: "International Date",
  selection: selectedDate,
  locale: locale
}).build()
```

## DatePickerUtils

Pre-configured DatePicker setups for common use cases:

### Birthday Picker
For selecting past dates (birth dates):

```typescript
import { DatePickerUtils } from '@tachui/advanced-forms'

const [birthDate, setBirthDate] = createSignal(new Date('1990-01-01'))

DatePicker(DatePickerUtils.birthday(birthDate)).build()
```

### Meeting Time Picker
For scheduling future appointments:

```typescript
const [meetingTime, setMeetingTime] = createSignal(new Date())

DatePicker(DatePickerUtils.meetingTime(meetingTime)).build()
```

### Deadline Picker
For project deadlines with custom date ranges:

```typescript
const [deadline, setDeadline] = createSignal(new Date())
const startDate = new Date()
const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days

DatePicker(DatePickerUtils.deadline(deadline, startDate, endDate)).build()
```

### Time Only Picker
For selecting time without date:

```typescript
const [selectedTime, setSelectedTime] = createSignal(new Date())

DatePicker(DatePickerUtils.timeOnly(selectedTime)).build()
```

## Styling with Modifiers

DatePicker integrates with the TachUI modifier system:

```typescript
DatePicker({
  title: "Styled DatePicker",
  selection: selectedDate,
  style: 'graphical'
})
.modifier
.padding(20)
.backgroundColor('#F8F9FA')
.cornerRadius(12)
.shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
.build()
```

## Accessibility

### ARIA Labels
Provide proper accessibility information:

```typescript
DatePicker({
  title: "Appointment Date",
  selection: appointmentDate,
  accessibilityLabel: "Select appointment date",
  accessibilityHint: "Choose when you'd like to schedule your appointment"
}).build()
```

### Keyboard Navigation
All picker styles support keyboard navigation:
- **Tab**: Navigate between elements
- **Arrow Keys**: Navigate calendar grid (graphical style)
- **Space/Enter**: Select date
- **Escape**: Close picker (if applicable)

## Advanced Examples

### Form Integration
Using DatePicker in a complex form:

```typescript
function EventForm() {
  const [eventName, setEventName] = createSignal('')
  const [startDate, setStartDate] = createSignal(new Date())
  const [endDate, setEndDate] = createSignal(new Date())
  const [isAllDay, setIsAllDay] = createSignal(false)

  return VStack({
    children: [
      TextField({
        title: "Event Name",
        text: eventName,
        placeholder: "Enter event name"
      }).build(),

      DatePicker({
        title: "Start Date",
        selection: startDate,
        displayedComponents: isAllDay() ? 'date' : 'dateAndTime',
        style: 'compact',
        minimumDate: new Date()
      }).build(),

      DatePicker({
        title: "End Date", 
        selection: endDate,
        displayedComponents: isAllDay() ? 'date' : 'dateAndTime',
        style: 'compact',
        minimumDate: startDate() // End date must be after start date
      }).build(),

      Toggle({
        title: "All Day Event",
        isOn: isAllDay
      }).build()
    ]
  })
  .modifier
  .gap(16)
  .padding(20)
  .build()
}
```

### Conditional Picker Styles
Change picker style based on screen size or user preference:

```typescript
function ResponsiveDatePicker() {
  const [selectedDate, setSelectedDate] = createSignal(new Date())
  const [isCompact, setIsCompact] = createSignal(false)

  return VStack({
    children: [
      Toggle({
        title: "Compact Mode",
        isOn: isCompact
      }).build(),

      DatePicker({
        title: "Responsive Picker",
        selection: selectedDate,
        style: isCompact() ? 'compact' : 'graphical'
      }).build()
    ]
  })
  .modifier
  .gap(16)
  .build()
}
```

### Date Range Selection
Create a date range picker using two DatePicker components:

```typescript
function DateRangePicker() {
  const [startDate, setStartDate] = createSignal(new Date())
  const [endDate, setEndDate] = createSignal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

  return HStack({
    children: [
      DatePicker({
        title: "Start Date",
        selection: startDate,
        style: 'graphical',
        maximumDate: endDate()
      }).build(),

      Divider({ orientation: 'vertical', length: 200 }).build(),

      DatePicker({
        title: "End Date",
        selection: endDate,
        style: 'graphical',
        minimumDate: startDate()
      }).build()
    ]
  })
  .modifier
  .gap(20)
  .alignItems('flex-start')
  .build()
}
```

## Theming

### Custom Theme
Create a custom DatePicker theme:

```typescript
import { DatePickerStyles } from '@tachui/advanced-forms'

const customTheme = DatePickerStyles.createTheme({
  colors: {
    ...DatePickerStyles.theme.colors,
    accent: '#FF6B6B',
    selectedBackground: '#FF6B6B',
    selectedText: '#FFFFFF'
  },
  borderRadius: 12,
  fontSize: 18
})

// Apply custom styling in your app
```

## Best Practices

### 1. Choose Appropriate Styles
- **Compact**: Best for forms and space-constrained layouts
- **Wheel**: Great for mobile-like experiences and time selection
- **Graphical**: Ideal for date-heavy applications and range selection

### 2. Provide Clear Labels
Always include descriptive titles for better UX:

```typescript
// Good
DatePicker({
  title: "Event Start Date",
  selection: startDate
})

// Avoid
DatePicker({
  selection: startDate // No context for the user
})
```

### 3. Set Reasonable Constraints
Use date constraints to prevent invalid selections:

```typescript
// For booking future appointments
DatePicker({
  title: "Appointment Date",
  selection: appointmentDate,
  minimumDate: new Date(), // Can't book in the past
  maximumDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months ahead
})
```

### 4. Handle Edge Cases
Always provide fallbacks and validation:

```typescript
const [selectedDate, setSelectedDate] = createSignal(new Date())

DatePicker({
  title: "Event Date",
  selection: selectedDate,
  onChange: (newDate) => {
    // Validate date before updating
    if (newDate && newDate instanceof Date && !isNaN(newDate.getTime())) {
      setSelectedDate(newDate)
    }
  }
})
```

### 5. Consider Localization
Support international users with proper locale settings:

```typescript
const userLocale = navigator.language || 'en-US'

DatePicker({
  title: "Date",
  selection: selectedDate,
  locale: userLocale
})
```

## Performance Considerations

- DatePicker components are optimized for reactivity
- Large date ranges in graphical style may impact performance
- Consider using `compact` style for better performance in lists
- Wheel style components use scroll snapping for smooth interaction

## Browser Support

DatePicker uses modern web standards:
- **Compact style**: Uses native HTML5 date/time inputs (widely supported)
- **Wheel style**: Uses CSS scroll-snap (IE11+)
- **Graphical style**: Uses CSS Grid (IE11+ with -ms- prefix)

For maximum compatibility, the compact style provides the best fallback behavior.

---

## Related Components

- [**TextField**](./textfield.md) - Text input with similar styling patterns
- [**Picker**](./picker.md) - Selection picker for predefined options  
- [**Toggle**](./toggle.md) - Boolean input controls
- [**Form**](./form.md) - Form container for multiple inputs
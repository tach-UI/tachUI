# @tachui/advanced-forms

> Advanced form input components for tachUI framework

[![npm version](https://img.shields.io/npm/v/@tachui/advanced-forms.svg)](https://www.npmjs.com/package/@tachui/advanced-forms)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

The tachUI advanced-forms package provides sophisticated form input components including DatePicker, Stepper, Slider, and other specialized input controls that extend beyond basic text inputs with rich interaction patterns and validation.

## Features

- 📅 **DatePicker** - Comprehensive date and time selection with calendar UI
- 🔢 **Stepper** - Increment/decrement numeric inputs with customizable steps
- 🎚️ **Slider** - Range selection with single and dual thumb support
- 📊 **Rating** - Star ratings and custom rating scales
- 🎨 **ColorPicker** - Color selection with multiple input modes
- 🔧 **TypeScript-first** - Complete type safety for advanced form patterns

## Installation

```bash
npm install @tachui/core @tachui/advanced-forms
# or
pnpm add @tachui/core @tachui/advanced-forms
```

## Quick Start

### DatePicker

```typescript
import { VStack, Text } from '@tachui/core'
import { DatePicker, createSignal } from '@tachui/advanced-forms'

const MyComponent = () => {
  const [selectedDate, setSelectedDate] = createSignal(new Date())

  return VStack({
    children: [
      Text(() => `Selected: ${selectedDate().toLocaleDateString()}`)
        .modifier.fontSize(16)
        .build(),

      DatePicker({
        selection: selectedDate,
        onChange: setSelectedDate,
        displayedComponents: ['date', 'time'],
      })
        .modifier.padding(16)
        .build(),
    ],
    spacing: 16,
  }).build()
}
```

### Stepper

```typescript
import { Stepper } from '@tachui/advanced-forms'

const [quantity, setQuantity] = createSignal(1)

const quantityStepper = Stepper({
  value: quantity,
  onChange: setQuantity,
  range: { min: 0, max: 99 },
  step: 1,
  title: 'Quantity',
})
  .modifier.stepperStyle('automatic') // 'automatic' | 'compact'
  .build()
```

### Slider

```typescript
import { Slider } from '@tachui/advanced-forms'

const [volume, setVolume] = createSignal(0.5)

const volumeSlider = Slider({
  value: volume,
  onChange: setVolume,
  range: { min: 0, max: 1 },
  step: 0.1,
})
  .modifier.minimumTrackTintColor('#007AFF')
  .maximumTrackTintColor('#E5E5EA')
  .thumbTintColor('#FFFFFF')
  .build()
```

## Components

### DatePicker

Comprehensive date and time selection:

```typescript
import { DatePicker } from '@tachui/advanced-forms'

// Basic date picker
DatePicker({
  selection: selectedDate,
  onChange: setSelectedDate,
  displayedComponents: ['date'], // 'date' | 'time' | ['date', 'time']
})
  .modifier.datePickerStyle('wheel') // 'wheel' | 'compact' | 'graphical'
  .build()

// Date range picker
DatePicker({
  selection: dateRange,
  onChange: setDateRange,
  mode: 'range',
  minimumDate: new Date('2024-01-01'),
  maximumDate: new Date('2024-12-31'),
})
  .modifier.accentColor('#007AFF')
  .build()

// Time picker
DatePicker({
  selection: selectedTime,
  onChange: setSelectedTime,
  displayedComponents: ['time'],
  minuteInterval: 15,
}).build()
```

### Stepper

Increment/decrement numeric controls:

```typescript
import { Stepper } from '@tachui/advanced-forms'

// Basic stepper
Stepper({
  value: counter,
  onChange: setCounter,
  range: { min: 0, max: 100 },
  step: 1,
})
  .modifier.stepperStyle('automatic')
  .build()

// Custom stepper with labels
Stepper({
  value: rating,
  onChange: setRating,
  range: { min: 1, max: 5 },
  step: 1,
  title: 'Rating',
  formatter: value => `${value} star${value !== 1 ? 's' : ''}`,
})
  .modifier.stepperStyle('compact')
  .build()

// Floating point stepper
Stepper({
  value: price,
  onChange: setPrice,
  range: { min: 0, max: 999.99 },
  step: 0.01,
  formatter: value => `$${value.toFixed(2)}`,
}).build()
```

### Slider

Range selection with customizable appearance:

```typescript
import { Slider } from '@tachui/advanced-forms'

// Basic slider
Slider({
  value: brightness,
  onChange: setBrightness,
  range: { min: 0, max: 1 },
  step: 0.01,
})
  .modifier.minimumTrackTintColor('#FFD60A')
  .maximumTrackTintColor('#8E8E93')
  .build()

// Range slider (dual thumb)
Slider({
  value: priceRange,
  onChange: setPriceRange,
  range: { min: 0, max: 1000 },
  mode: 'range',
  step: 10,
})
  .modifier.rangeSliderStyle('default')
  .build()

// Discrete slider with marks
Slider({
  value: difficulty,
  onChange: setDifficulty,
  range: { min: 1, max: 5 },
  step: 1,
  discreteValues: true,
  marks: [
    { value: 1, label: 'Easy' },
    { value: 3, label: 'Medium' },
    { value: 5, label: 'Hard' },
  ],
}).build()
```

### Rating

Star ratings and custom scales:

```typescript
import { Rating } from '@tachui/advanced-forms'

// Star rating
Rating({
  value: userRating,
  onChange: setUserRating,
  maximumValue: 5,
  symbol: 'star',
  allowHalfRatings: true,
})
  .modifier.ratingColor('#FFD700')
  .unratedColor('#E5E5EA')
  .build()

// Custom symbol rating
Rating({
  value: heartRating,
  onChange: setHeartRating,
  maximumValue: 5,
  symbol: 'heart',
  filledSymbol: 'heart.fill',
  allowHalfRatings: false,
})
  .modifier.ratingColor('#FF3B30')
  .build()

// Numeric rating scale
Rating({
  value: satisfaction,
  onChange: setSatisfaction,
  maximumValue: 10,
  style: 'numeric',
  labels: ['Poor', 'Excellent'],
}).build()
```

### ColorPicker

Color selection with multiple modes:

```typescript
import { ColorPicker } from '@tachui/advanced-forms'

// Basic color picker
ColorPicker({
  selection: selectedColor,
  onChange: setSelectedColor,
})
  .modifier.colorPickerStyle('wheel') // 'wheel' | 'palette' | 'spectrum'
  .build()

// Palette-based picker
ColorPicker({
  selection: brandColor,
  onChange: setBrandColor,
  style: 'palette',
  palette: [
    '#FF3B30',
    '#FF9500',
    '#FFCC02',
    '#34C759',
    '#007AFF',
    '#5856D6',
    '#AF52DE',
    '#FF2D92',
  ],
}).build()

// Advanced color picker with transparency
ColorPicker({
  selection: backgroundColor,
  onChange: setBackgroundColor,
  supportsOpacity: true,
  style: 'spectrum',
})
  .modifier.presentationMode('sheet')
  .build()
```

## Advanced Features

### Form Integration

```typescript
import { Form, createFormState } from '@tachui/forms'
import { DatePicker, Slider, Rating } from '@tachui/advanced-forms'

const eventForm = createFormState(
  {
    eventDate: new Date(),
    priority: 0.5,
    rating: 0,
  },
  {
    eventDate: { required: true },
    priority: { min: 0, max: 1 },
    rating: { min: 1, max: 5 },
  }
)

const eventFormView = Form({
  state: eventForm,
  children: [
    DatePicker({
      selection: eventForm.binding('eventDate'),
      displayedComponents: ['date', 'time'],
    }).build(),

    Slider({
      value: eventForm.binding('priority'),
      range: { min: 0, max: 1 },
      title: 'Priority',
    }).build(),

    Rating({
      value: eventForm.binding('rating'),
      maximumValue: 5,
      symbol: 'star',
    }).build(),
  ],
}).build()
```

### Custom Formatters

```typescript
import { Stepper } from '@tachui/advanced-forms'

// Duration stepper (minutes to hours:minutes)
Stepper({
  value: durationMinutes,
  onChange: setDurationMinutes,
  range: { min: 0, max: 480 },
  step: 15,
  formatter: minutes => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  },
  parser: text => {
    // Parse "2h 30m" back to 150 minutes
    const match = text.match(/(\d+)h (\d+)m/)
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2])
    }
    return 0
  },
}).build()
```

### Validation Integration

```typescript
import { DatePicker } from '@tachui/advanced-forms'

DatePicker({
  selection: appointmentDate,
  onChange: setAppointmentDate,
  minimumDate: new Date(), // No past dates
  maximumDate: (() => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3) // 3 months ahead
    return maxDate
  })(),
  validation: {
    isWeekend: date => {
      const day = date.getDay()
      if (day === 0 || day === 6) {
        return 'Appointments not available on weekends'
      }
      return null
    },
  },
})
  .modifier.errorBorderColor('#FF3B30')
  .build()
```

## Accessibility

Built-in accessibility features:

- **VoiceOver/Screen reader** support for all components
- **Keyboard navigation** (arrow keys, enter, space)
- **Focus management** with proper focus indicators
- **ARIA labels** and descriptions
- **Value announcements** for dynamic changes
- **Gesture support** for mobile accessibility

## Styling and Theming

Advanced form components inherit tachUI's modifier system:

```typescript
DatePicker({ selection: date })
  .modifier.padding(16)
  .backgroundColor('#f8f9fa')
  .cornerRadius(12)
  .accentColor('#007AFF')
  .build()

Slider({ value: volume })
  .modifier.minimumTrackTintColor('#34C759')
  .maximumTrackTintColor('#E5E5EA')
  .thumbTintColor('#FFFFFF')
  .thumbBorderColor('#34C759')
  .build()
```

## Examples

Check out complete examples:

- **[Event Planning Form](https://github.com/tach-UI/tachUI/tree/main/apps/examples/advanced-forms/event-form)**
- **[Settings Panel](https://github.com/tach-UI/tachUI/tree/main/apps/examples/advanced-forms/settings)**
- **[Product Customizer](https://github.com/tach-UI/tachUI/tree/main/apps/examples/advanced-forms/customizer)**

## API Reference

- **[DatePicker API](https://github.com/tach-UI/tachUI/blob/main/docs/api/advanced-forms/src/classes/DatePicker.md)**
- **[Stepper API](https://github.com/tach-UI/tachUI/blob/main/docs/api/advanced-forms/src/classes/Stepper.md)**
- **[Slider API](https://github.com/tach-UI/tachUI/blob/main/docs/api/advanced-forms/src/classes/Slider.md)**

## Requirements

- **@tachui/core** ^0.1.0 or later
- **TypeScript** 5.0+ (recommended)

## Contributing

See the main [Contributing Guide](https://github.com/tach-UI/tachUI/blob/main/CONTRIBUTING.md) for information on contributing to tachUI advanced forms.

## License

Mozilla Public License 2.0 - see [LICENSE](https://github.com/tach-UI/tachUI/blob/main/LICENSE) for details.

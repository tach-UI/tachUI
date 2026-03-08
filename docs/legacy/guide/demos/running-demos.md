# Running TachUI Demo Applications

Guide for running and testing TachUI's interactive demo applications, including Advanced Modifier System gesture demonstrations.

## Demo Applications Overview

TachUI includes several interactive demo applications showcasing framework capabilities:

### Advanced Modifier System Version 1.4 - Advanced Gesture Demo

**Location**: See documentation examples in `/guide/examples/` and `/guide/components/` sections

Interactive demonstration of advanced input and gesture modifiers including:
- Long press gestures with configurable timing and distance constraints
- Global keyboard shortcuts with cross-platform modifier support
- Programmatic focus management with reactive binding
- Continuous hover tracking with local/global coordinate spaces
- Hit testing control and advanced interaction patterns

## Running Demo Applications

### Method 1: Using the Development Server

```bash
# Start the core development server
pnpm dev:core

# In a separate terminal, run the demo application
cd apps/examples
npx tsx epic-butternut-phase4-demo.ts
```

### Method 2: Integration with Example Projects

```bash
# Create a new example project
mkdir my-tachui-demo
cd my-tachui-demo

# Initialize with TachUI dependencies
npm init -y
npm install @tachui/core

# Copy demo code from documentation examples
# See /docs/guide/examples/ for working examples

# Run with tsx or ts-node
npx tsx demo.ts
```

### Method 3: Browser Integration

```typescript
// Create an HTML file with TachUI integration
import { AdvancedModifierDemo } from './advanced-modifier-demo'
import { mount } from '@tachui/core'

// Mount the demo application
mount(AdvancedModifierDemo, document.getElementById('app'))
```

## Demo Application Features

### Version 1.4 Advanced Gesture Demo

#### Interactive Controls Panel

- **Long Press Configuration**:
  - Duration slider (200-2000ms)
  - Distance threshold (5-50px)
  - Enable/disable toggle
  - Real-time status display

- **Focus Management**:
  - Programmatic focus targeting
  - Visual focus indicators
  - Keyboard navigation support

- **Hit Testing Control**:
  - Toggle hit testing on/off
  - Visual feedback for enabled/disabled states

#### Live Demo Area

- **Long Press Button**: Test configurable long press gestures
- **Focus Targets**: Three buttons demonstrating programmatic focus
- **Hover Tracking Area**: Real-time mouse coordinate display
- **Conditional Interaction**: Hit testing demonstration

#### Event Logging

- **Keyboard Shortcuts Log**: Records all shortcut activations
- **Interaction Log**: Tracks button clicks, gestures, and focus changes
- **Timestamps**: All events include precise timing information

#### Global Keyboard Shortcuts

- **Cmd+L**: Trigger long press demo
- **Cmd+H**: Activate hover demo (sets coordinates)
- **Cmd+F**: Cycle through focus targets
- **Cmd+T**: Toggle hit testing
- **Esc**: Reset all demo states and clear logs

## Testing Interactive Features

### Long Press Gestures

1. Adjust duration and distance sliders in controls panel
2. Press and hold the "Hold to Activate Long Press" button
3. Observe status changes: Ready → Pressing → Long Press Activated
4. Try moving mouse during press to test distance constraints

### Keyboard Shortcuts

1. Use the global shortcuts listed above
2. Watch the keyboard shortcuts log for event registration
3. Test modifier combinations (Cmd/Ctrl platform detection)

### Focus Management

1. Click focus target buttons in controls panel
2. Observe visual highlighting of corresponding demo buttons
3. Test keyboard navigation with Tab and Enter keys

### Continuous Hover

1. Move mouse over the dashed border hover area
2. Watch real-time coordinate updates
3. Test both local and global coordinate tracking

### Hit Testing

1. Toggle hit testing control in the controls panel
2. Try clicking the "Conditional Clicking" button
3. Observe opacity and interaction changes

## Development and Debugging

### Console Logging

The demo includes comprehensive console logging for debugging:

```typescript
// Long press state changes
console.log('Long press pressing state:', isPressing)

// Keyboard shortcut activations
console.log('Keyboard shortcut triggered:', shortcutKey)

// Focus management events
console.log('Focus target changed:', newTarget)

// Hover coordinate tracking
console.log('Hover coordinates:', x, y)
```

### Performance Monitoring

Monitor performance during gesture interactions:

```bash
# Watch for memory leaks during long demo sessions
pnpm benchmark:quick

# Check for event handler cleanup
# Browser DevTools → Performance → Record → Use demo
```

### Browser Compatibility Testing

Test across different browsers and platforms:

- **Chrome/Edge**: Full support for all features
- **Firefox**: Test PointerEvent polyfill compatibility
- **Safari**: Verify touch gesture support on mobile
- **Mobile Browsers**: Test touch-specific interactions

## Customizing Demo Applications

### Adding New Gesture Types

```typescript
// Extend the demo with custom gesture recognition
.onCustomGesture({
  pattern: 'swipe',
  direction: 'horizontal',
  perform: (direction) => handleSwipe(direction)
})
```

### Creating Custom Demo Scenarios

```typescript
// Create scenario-specific demo configurations
const demoScenarios = {
  mobile: {
    longPressDuration: 300,  // Shorter for mobile
    hoverEnabled: false      // Disable hover on touch
  },
  desktop: {
    longPressDuration: 500,
    keyboardShortcuts: true
  }
}
```

### Performance Optimization

```typescript
// Optimize for demo performance
.onContinuousHover('local', throttle((location) => {
  setHoverCoordinates(location)
}, 16)) // 60fps max update rate
```

## Troubleshooting

### Common Issues

**Demo not starting**:
- Verify TachUI core package is installed
- Check TypeScript compilation errors
- Ensure all dependencies are up to date

**Gestures not responding**:
- Check browser compatibility for PointerEvent
- Verify event listeners are properly attached
- Test with browser developer tools console

**Performance issues**:
- Reduce hover tracking frequency
- Check for memory leaks in long-running sessions
- Monitor DOM node creation/cleanup

### Browser-Specific Issues

**Safari**:
- May require user gesture initiation for some features
- Test touch events on actual iOS devices

**Firefox**:
- Verify PointerEvent polyfill loading
- Test keyboard modifier detection

### Getting Help

For issues with demo applications:

1. Check the [Advanced Modifier System documentation](../advanced-modifiers.md)
2. Review test files in `packages/core/__tests__/modifiers/`
3. Open issues at [TachUI GitHub repository](https://github.com/tachui/core/issues)

## Next Steps

After exploring the demos:

1. **Build Custom Applications**: Use learned patterns in your own projects
2. **Contribute Examples**: Submit additional demo scenarios
3. **Performance Testing**: Create benchmarks for your use cases
4. **Integration Testing**: Test with your preferred build tools and frameworks

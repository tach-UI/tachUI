---
cssclasses:
  - full-page
---

# TachUI Forms Plugin Structure

> **Comprehensive file-level documentation of `packages/forms/`**

This document provides a complete overview of TachUI's Forms plugin structure, explaining the purpose and functionality of every file and directory in the `packages/forms/` codebase.

## 📋 Overview

**Current Status: Production Ready - 13 TypeScript files, 7 test files, 176KB source**

The **@tachui/forms** plugin extends TachUI's core functionality with advanced form handling, specialized input components, and comprehensive validation. It demonstrates TachUI's plugin architecture by providing enhanced form capabilities without bloating the core framework.

**Key Features:**
1. **Enhanced Input Components** - 15+ specialized TextField variants with built-in validation
2. **Advanced Validation System** - 18 built-in validation rules plus custom validator support
3. **Form State Management** - Reactive form state with automatic validation and error handling
4. **Formatters & Parsers** - Input formatters for phone numbers, credit cards, SSN, currency, etc.
5. **Accessibility Compliance** - WCAG 2.1 AA compliant form components with screen reader support
6. **Performance Optimization** - Tree-shakeable architecture with ~35KB bundle impact

The Forms plugin is organized into 4 main modules:

1. **Enhanced Components** (`components/`) - Specialized form input components
2. **State Management** (`state/`) - Form state and reactive data management
3. **Validation System** (`validation/`) - Comprehensive validation framework
4. **Utility Functions** (`utils/`) - Formatters, parsers, and helper functions

---

## 🎯 Root Level

```
packages/forms/
├── package.json               # Forms plugin package configuration
├── tsconfig.json             # TypeScript configuration for development
├── vite.config.ts            # Vite build configuration for plugin bundling
├── vitest.config.ts          # Test configuration for Forms plugin
├── dist/                     # Compiled plugin output (build artifacts)
├── src/                      # Source code for all Forms functionality
└── __tests__/               # Comprehensive test suite
```

### 📝 Root File Details

#### `package.json`
**Purpose**: Forms plugin package configuration and dependencies  
**Functionality**:
- Package name: `@tachui/forms` as TachUI plugin
- Peer dependency on `@tachui/core` for framework integration
- ESM/CJS dual output for maximum compatibility
- Tree-shakeable exports with granular component imports

#### `vite.config.ts`
**Purpose**: Plugin-optimized build configuration  
**Functionality**:
- Library mode build for plugin distribution
- Tree-shaking optimization for minimal bundle impact
- TypeScript declaration generation
- External dependency handling for peer dependencies

---

## 🧩 Enhanced Components (`components/`)

> **Specialized form input components with built-in validation and formatting**

```
components/
├── index.ts                   # Component library exports and public API
├── Form.ts                    # Enhanced form container with state management
└── input/                    # Specialized input component collection
    ├── index.ts              # Input component exports
    ├── TextField.ts          # Enhanced TextField with validation and formatting
    ├── Checkbox.ts           # Accessible checkbox with indeterminate state
    ├── Radio.ts              # Radio button with group management
    └── Select.ts             # Enhanced select with search and keyboard navigation
```

### 📝 Component Details

#### `Form.ts`
**Purpose**: Enhanced form container with advanced state management and validation  
**Functionality**:
- **Form State Management**: Centralized form state with reactive updates
- **Automatic Validation**: Real-time validation with customizable triggers
- **Submission Handling**: Form submission with loading states and error handling
- **Field Registration**: Automatic field discovery and management
- **Reset Functionality**: Form reset with validation state cleanup
- **Accessibility**: ARIA live regions for validation feedback

#### `input/TextField.ts`
**Purpose**: Enhanced TextField with 15+ specialized variants and validation  
**Functionality**:
- **Input Variants**: EmailField, PasswordField, PhoneField, NumberField, CreditCardField
- **Advanced Variants**: SearchField, URLField, SSNField, PostalCodeField, DateField, TimeField
- **Text Variants**: TextArea, ColorField with specialized validation and formatting
- **Selection Variants**: Select and MultiSelect with search and keyboard navigation
- **Built-in Formatters**: Automatic formatting for phone numbers, credit cards, SSN, currency
- **Real-time Validation**: 18 built-in validation rules with custom validator support
- **Accessibility**: Screen reader support, error announcements, focus management

#### `input/Select.ts`
**Purpose**: Enhanced select component with search and advanced interaction  
**Functionality**:
- **Search Integration**: Built-in search with fuzzy matching
- **Keyboard Navigation**: Full keyboard accessibility with arrow key navigation
- **Multi-select Support**: Multiple selection with tag-based display
- **Option Grouping**: Hierarchical option organization
- **Custom Rendering**: Customizable option and selection rendering
- **Performance**: Virtual scrolling for large option lists

---

## 🔄 State Management (`state/`)

> **Reactive form state with validation and data binding**

```
state/
└── index.ts                  # Form state management exports and utilities
```

### 📝 State Management Details

#### `index.ts`
**Purpose**: Comprehensive form state management with reactive validation  
**Functionality**:
- **FormState Class**: Centralized form state with field registration
- **Field State Management**: Individual field state tracking with validation status
- **Validation Orchestration**: Coordinates validation across form fields
- **Submission State**: Loading states, success/error handling, and retry logic
- **Data Binding**: Two-way data binding with TachUI's reactive system
- **Performance Optimization**: Efficient field updates with minimal re-rendering

---

## ✅ Validation System (`validation/`)

> **Comprehensive validation framework with 18+ built-in rules**

```
validation/
└── index.ts                  # Validation system exports and rule definitions
```

### 📝 Validation Details

#### `index.ts`
**Purpose**: Advanced validation system with extensible rule framework  
**Functionality**:
- **18+ Built-in Rules**: Required, email, phone, URL, credit card, SSN, postal codes
- **Advanced Rules**: Password strength, date ranges, numeric constraints, file validation
- **Custom Validators**: Framework for creating application-specific validation rules
- **Async Validation**: Support for server-side validation with debouncing
- **Conditional Validation**: Rules that depend on other field values
- **Internationalization**: Localized validation messages with pluralization support
- **Performance**: Optimized validation execution with caching and debouncing

**Available Validation Rules:**
- **Basic**: `required`, `minLength`, `maxLength`, `pattern`
- **Data Types**: `email`, `url`, `number`, `integer`, `decimal`
- **Specialized**: `phone`, `creditCard`, `ssn`, `postalCode`, `dateRange`
- **Security**: `passwordStrength`, `noXSS`, `sanitized`
- **Files**: `fileSize`, `fileType`, `imageValidation`
- **Custom**: Framework for domain-specific validation rules

---

## 🛠️ Utility Functions (`utils/`)

> **Formatters, parsers, and helper functions for form processing**

```
utils/
├── formatters.ts             # Input formatters for specialized data types
└── validators.ts            # Validation utilities and helper functions
```

### 📝 Utility Details

#### `formatters.ts`
**Purpose**: Input formatters for automatic data formatting during entry  
**Functionality**:
- **Phone Number Formatting**: International and domestic phone number formats
- **Credit Card Formatting**: Automatic spacing and validation for all major card types
- **Currency Formatting**: Locale-aware currency formatting with decimal handling
- **Date/Time Formatting**: Flexible date and time input formatting
- **SSN Formatting**: Social Security Number formatting with privacy considerations
- **Custom Formatters**: Framework for creating application-specific formatters

**Available Formatters:**
- `formatPhoneNumber(value, country)` - International phone formatting
- `formatCreditCard(value, type)` - Credit card formatting with type detection
- `formatCurrency(value, locale, currency)` - Locale-aware currency formatting
- `formatSSN(value, masked)` - SSN formatting with optional masking
- `formatPostalCode(value, country)` - Postal code formatting by country
- `formatDate(value, format)` - Flexible date formatting
- `formatTime(value, format, meridiem)` - Time formatting with AM/PM support

#### `validators.ts`
**Purpose**: Validation utilities and reusable validation logic  
**Functionality**:
- **Validation Rule Engine**: Core validation rule processing and execution
- **Error Message Generation**: Internationalized error messages with context
- **Async Validation Support**: Debounced server-side validation utilities
- **Composite Validation**: Combining multiple validation rules with logical operators
- **Performance Optimization**: Validation result caching and memoization
- **Testing Utilities**: Helpers for testing custom validation rules

---

## 🧪 Comprehensive Testing (`__tests__/`)

> **Extensive test suite with component, state, and integration testing**

```
__tests__/
├── components.test.ts        # Component functionality and interaction testing
├── state.test.ts            # Form state management testing
├── validation.test.ts       # Validation system testing
├── textfield-enhanced.test.ts # Enhanced TextField variant testing
├── textfield-reactive.test.ts # Reactive TextField behavior testing
├── textfield-variants.test.ts # Specialized TextField variant testing
└── plugin.test.ts           # Plugin integration and architecture testing
```

### 📝 Test Coverage Details

#### `components.test.ts`
**Purpose**: Comprehensive component functionality testing  
**Test Coverage**:
- Form container behavior and state management
- Input component variants and specialized behavior
- Accessibility compliance (ARIA attributes, keyboard navigation)
- Error handling and validation feedback
- Component integration with TachUI core system

#### `validation.test.ts`
**Purpose**: Validation system comprehensive testing  
**Test Coverage**:
- All 18+ built-in validation rules with edge cases
- Custom validation rule creation and integration
- Async validation behavior and error handling
- Performance testing for validation optimization
- Internationalization and error message localization

#### `plugin.test.ts`
**Purpose**: Plugin architecture and integration testing  
**Test Coverage**:
- Plugin loading and initialization
- Integration with TachUI core framework
- Tree-shaking and bundle size validation
- Performance impact assessment
- Compatibility testing across TachUI versions

---

## 📦 Distribution (`dist/`)

> **Optimized plugin distribution with tree-shaking support**

```
dist/
├── index.js                  # Main plugin entry point (ESM)
├── index.cjs                 # CommonJS compatibility entry point
├── index.d.ts               # TypeScript declarations for plugin API
├── components/              # Component-level exports for tree-shaking
│   ├── Form.js              # Enhanced Form component
│   ├── Form.d.ts           # Form TypeScript declarations
│   └── input/              # Specialized input components
│       ├── TextField.js     # Enhanced TextField variants
│       ├── TextField.d.ts  # TextField TypeScript declarations
│       ├── Checkbox.js     # Checkbox component
│       ├── Checkbox.d.ts   # Checkbox TypeScript declarations
│       ├── Radio.js        # Radio component
│       ├── Radio.d.ts      # Radio TypeScript declarations
│       ├── Select.js       # Enhanced Select component
│       └── Select.d.ts     # Select TypeScript declarations
└── *.map files            # Source maps for debugging
```

---

## 🎯 Forms Plugin API Reference

### Core Components

```typescript
// Enhanced Form container
import { Form } from '@tachui/forms'

const contactForm = Form({
  onSubmit: handleSubmit,
  validation: { mode: 'onChange' },
  children: [
    // Form fields
  ]
})

// Enhanced TextField with variants
import { TextField, EmailField, PhoneField } from '@tachui/forms/components/input'

const emailInput = EmailField({
  label: 'Email Address',
  required: true,
  validation: { email: true, required: true }
})

const phoneInput = PhoneField({
  label: 'Phone Number',
  format: 'international',
  validation: { phone: { country: 'US' } }
})
```

### Advanced Usage

```typescript
// Custom validation rules
import { createValidator } from '@tachui/forms/validation'

const customValidator = createValidator({
  name: 'uniqueUsername',
  async validate(value) {
    const exists = await checkUsernameExists(value)
    return !exists || 'Username already taken'
  }
})

// Multi-step form with state management
import { FormState, ValidationSchema } from '@tachui/forms/state'

const formState = new FormState({
  initialValues: { name: '', email: '', phone: '' },
  validationSchema: ValidationSchema({
    name: { required: true, minLength: 2 },
    email: { required: true, email: true },
    phone: { required: true, phone: { country: 'US' } }
  }),
  onSubmit: async (values) => {
    await submitForm(values)
  }
})
```

---

## 📊 Forms Plugin Statistics

### 📈 Current Implementation Metrics
- **13 Source Files**: Complete forms functionality with specialized components
- **7 Test Files**: Comprehensive test coverage including edge cases and integration
- **15+ Component Variants**: Specialized TextField variants for common use cases
- **18+ Validation Rules**: Built-in validation rules covering most common scenarios
- **Bundle Impact**: ~35KB additional bundle size (tree-shakeable)
- **Performance**: <5ms validation execution for complex forms

### 🎯 Plugin Architecture Benefits
- **Tree-Shakeable**: Import only the components and features you need
- **Core Integration**: Seamless integration with TachUI's reactive system
- **Accessibility First**: WCAG 2.1 AA compliant by default
- **TypeScript Native**: Full type safety with intelligent auto-completion
- **Extensible**: Framework for custom components and validation rules

### 🏗️ Framework Integration
- **Reactive Updates**: Form state automatically updates UI through TachUI's signal system
- **Modifier Compatibility**: All form components work with TachUI's modifier system
- **Theme Integration**: Automatic theme support through TachUI's asset system
- **Error Handling**: Integration with TachUI's error boundary system

---

## 🔄 Development Workflow Integration

The Forms plugin integrates seamlessly with TachUI development:

1. **Installation**: `npm install @tachui/forms` as peer dependency to `@tachui/core`
2. **Import**: Import specific components for optimal tree-shaking
3. **Integration**: Works with all TachUI modifiers and theme systems
4. **Testing**: Comprehensive test utilities for form validation and behavior
5. **Production**: Optimized bundle with minimal impact on core framework

### Usage Examples

```typescript
// Basic form with validation
import { Form, TextField, EmailField } from '@tachui/forms'

const signupForm = Form([
  TextField({ label: 'Full Name', required: true }),
  EmailField({ label: 'Email', required: true }),
  TextField({ label: 'Password', type: 'password', minLength: 8 })
]).modifier
  .padding(20)
  .cornerRadius(8)
  .backgroundColor(Assets.systemBackground)
  

// Advanced form with custom validation
import { FormState, createValidator } from '@tachui/forms'

const customForm = FormState({
  validation: {
    email: [required(), email(), customValidator()],
    password: [required(), minLength(8), passwordStrength()]
  }
})
```

---

*This document serves as the definitive guide to TachUI's Forms plugin structure. The Forms plugin demonstrates TachUI's extensible architecture while providing production-ready form components with advanced validation and accessibility features.*
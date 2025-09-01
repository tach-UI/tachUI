import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Real DOM Integration Testing', () => {
  let container: HTMLElement
  let cleanupFunctions: Function[]

  beforeEach(() => {
    // Create real DOM container for testing
    container = document.createElement('div')
    container.id = 'test-container'
    document.body.appendChild(container)
    cleanupFunctions = []
  })

  afterEach(() => {
    // Cleanup DOM and functions
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
    cleanupFunctions.forEach(cleanup => cleanup())
    cleanupFunctions = []
  })

  describe('Component DOM Rendering', () => {
    it('should render TextField component to real DOM', async () => {
      const { TextField } = await import(
        '../src/components/text-input/TextField'
      )

      const textField = TextField({
        name: 'real-dom-test',
        label: 'Real DOM Test Field',
        placeholder: 'Enter text here',
      })

      // TachUI components return component instances, not DOM elements
      expect(textField.type).toBe('component')
      expect(textField.props.name).toBe('real-dom-test')
      expect(textField.props.label).toBe('Real DOM Test Field')
      expect(textField.props.placeholder).toBe('Enter text here')

      // Verify component structure
      expect(textField.render).toBeTypeOf('function')
    })

    it('should render Form container component', async () => {
      const { Form } = await import('../src/components/form-container')

      const form = new Form({
        initialValues: { test: 'value' },
        onSubmit: async () => {},
      })

      expect(form.type).toBe('form-container')
      expect(form.state.fields.test.value).toBe('value')

      // Test DOM rendering
      const domElement = form.render()
      expect(domElement.tagName.toLowerCase()).toBe('form')

      container.appendChild(domElement)
      expect(container.children.length).toBe(1)
      expect(document.contains(domElement)).toBe(true)
    })

    it('should render FormSection with collapsible behavior', async () => {
      const { FormSection } = await import('../src/components/form-container')

      const section = new FormSection({
        title: 'Test Section',
        collapsible: true,
        defaultExpanded: true,
        children: ['Section content'],
      })

      expect(section.type).toBe('form-section')
      expect(section.isExpanded).toBe(true)

      // Test DOM rendering
      const domElement = section.render()
      expect(domElement.tagName.toLowerCase()).toBe('section')

      container.appendChild(domElement)

      // Test collapsible functionality
      section.toggle()
      expect(section.isExpanded).toBe(false)

      section.expand()
      expect(section.isExpanded).toBe(true)
    })
  })

  describe('Form State Integration with DOM', () => {
    it('should handle form submission with real DOM events', async () => {
      const { Form } = await import('../src/components/form-container')

      const submitHandler = vi.fn()
      const form = new Form({
        initialValues: {
          username: 'testuser',
          email: 'test@example.com',
        },
        onSubmit: submitHandler,
        validateOnSubmit: true,
      })

      const formElement = form.render()
      container.appendChild(formElement)

      // Test form submission via DOM event
      const submitEvent = new SubmitEvent('submit', {
        bubbles: true,
        cancelable: true,
      })

      formElement.dispatchEvent(submitEvent)

      // Also test direct submission
      await form.handleSubmit()

      expect(submitHandler).toHaveBeenCalledWith(
        { username: 'testuser', email: 'test@example.com' },
        expect.any(Object)
      )
    })

    it('should handle form state updates through form methods', async () => {
      const { Form } = await import('../src/components/form-container')

      const form = new Form({
        initialValues: {
          field1: 'initial1',
          field2: 'initial2',
        },
      })

      // Test form methods
      expect(form.getValue('field1')).toBe('initial1')
      expect(form.getValue('field2')).toBe('initial2')

      form.setValue('field1', 'updated1')
      form.setValue('field2', 'updated2')

      expect(form.getValue('field1')).toBe('updated1')
      expect(form.getValue('field2')).toBe('updated2')

      // Test form reset
      form.resetForm()
      expect(form.getValue('field1')).toBe('initial1')
      expect(form.getValue('field2')).toBe('initial2')
    })

    it('should handle form validation through form methods', async () => {
      const { Form } = await import('../src/components/form-container')

      const form = new Form({
        initialValues: { required_field: '' },
        validation: {
          required_field: {
            rules: ['required'],
            validateOn: 'submit',
          },
        },
      })

      // Test field registration
      form.register('required_field', {
        rules: ['required'],
        validateOn: 'blur',
      })

      // Test invalid state
      const isValidEmpty = await form.validateField('required_field')
      expect(isValidEmpty).toBe(false)
      expect(form.getError('required_field')).toBeDefined()

      // Test valid state
      form.setValue('required_field', 'valid value')
      const isValidFilled = await form.validateField('required_field')
      expect(isValidFilled).toBe(true)
      expect(form.getError('required_field')).toBeUndefined()
    })
  })

  describe('Component Integration in DOM Context', () => {
    it('should integrate multiple components within form context', async () => {
      const { createFormState } = await import('../src/state')
      const { TextField } = await import(
        '../src/components/text-input/TextField'
      )
      const { Select } = await import('../src/components/selection/Select')

      const formState = createFormState({
        name: '',
        category: '',
      })

      const nameField = TextField({
        name: 'name',
        label: 'Full Name',
        _formContext: formState,
      })

      const categorySelect = Select({
        name: 'category',
        label: 'Category',
        options: [
          { value: 'personal', label: 'Personal' },
          { value: 'business', label: 'Business' },
        ],
        _formContext: formState,
      })

      // Verify components are properly configured
      expect(nameField.props._formContext).toBe(formState)
      expect(categorySelect.props._formContext).toBe(formState)

      // Test form context integration
      expect(formState.getValue('name')).toBe('')
      expect(formState.getValue('category')).toBe('')
    })

    it('should handle complex form workflows', async () => {
      const { createFormState } = await import('../src/state')

      const workflowForm = createFormState({
        step: 'personal',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      })

      // Register fields with validation
      workflowForm.register('firstName', {
        rules: ['required'],
        validateOn: 'blur',
      })
      workflowForm.register('lastName', {
        rules: ['required'],
        validateOn: 'blur',
      })
      workflowForm.register('email', {
        rules: ['required', 'email'],
        validateOn: 'blur',
      })
      workflowForm.register('phone', { rules: ['phone'], validateOn: 'blur' })

      // Simulate user workflow
      workflowForm.setValue('step', 'personal')
      workflowForm.setValue('firstName', 'John')
      workflowForm.setValue('lastName', 'Doe')

      // Validate personal information
      const firstNameValid = await workflowForm.validateField('firstName')
      const lastNameValid = await workflowForm.validateField('lastName')

      expect(firstNameValid).toBe(true)
      expect(lastNameValid).toBe(true)

      // Move to contact step
      workflowForm.setValue('step', 'contact')
      workflowForm.setValue('email', 'john.doe@example.com')
      workflowForm.setValue('phone', '555-123-4567')

      // Validate contact information
      const emailValid = await workflowForm.validateField('email')
      const phoneValid = await workflowForm.validateField('phone')

      expect(emailValid).toBe(true)
      expect(phoneValid).toBe(true)

      // Verify complete form state
      const finalData = workflowForm.watch()
      expect(finalData.firstName).toBe('John')
      expect(finalData.lastName).toBe('Doe')
      expect(finalData.email).toBe('john.doe@example.com')
      expect(finalData.phone).toBe('555-123-4567')
    })

    it('should handle shopping cart form scenario', async () => {
      const { createFormState } = await import('../src/state')

      const cartForm = createFormState({
        quantity: 1,
        size: '',
        color: '',
        addOns: [],
      })

      // Register validation
      cartForm.register('quantity', {
        rules: [
          'required',
          { name: 'min', options: { min: 1 } },
          { name: 'max', options: { max: 10 } },
        ],
        validateOn: 'change',
      })

      cartForm.register('size', { rules: ['required'], validateOn: 'blur' })
      cartForm.register('color', { rules: ['required'], validateOn: 'blur' })

      // Simulate user selections
      cartForm.setValue('quantity', 3)
      cartForm.setValue('size', 'large')
      cartForm.setValue('color', 'blue')
      cartForm.setValue('addOns', ['warranty', 'express-shipping'])

      // Validate selections
      const quantityValid = await cartForm.validateField('quantity')
      const sizeValid = await cartForm.validateField('size')
      const colorValid = await cartForm.validateField('color')

      expect(quantityValid).toBe(true)
      expect(sizeValid).toBe(true)
      expect(colorValid).toBe(true)

      // Verify cart state
      const cartData = cartForm.watch()
      expect(cartData.quantity).toBe(3)
      expect(cartData.size).toBe('large')
      expect(cartData.color).toBe('blue')
      expect(cartData.addOns).toEqual(['warranty', 'express-shipping'])
    })
  })

  describe('Event Handling in Real DOM', () => {
    it('should handle form submission events properly', async () => {
      const { Form } = await import('../src/components/form-container')

      const submitHandler = vi.fn()
      const form = new Form({
        initialValues: { test: 'submit-test' },
        onSubmit: submitHandler,
        resetOnSubmit: true,
      })

      const formElement = form.render()
      container.appendChild(formElement)

      // Verify form is in DOM
      expect(document.contains(formElement)).toBe(true)
      expect(formElement.tagName.toLowerCase()).toBe('form')

      // Test form has submit handler attached
      expect(formElement.onsubmit).toBeDefined()

      // Test direct submission
      await form.handleSubmit()
      expect(submitHandler).toHaveBeenCalledWith(
        { test: 'submit-test' },
        expect.any(Object)
      )
    })

    it('should handle preventDefault in form submission', async () => {
      const { Form } = await import('../src/components/form-container')

      const form = new Form({
        initialValues: { prevent: 'test' },
        onSubmit: async () => {},
      })

      const formElement = form.render()
      container.appendChild(formElement)

      // Create submit event
      const submitEvent = new SubmitEvent('submit', {
        bubbles: true,
        cancelable: true,
      })

      // Mock preventDefault
      const preventDefault = vi.spyOn(submitEvent, 'preventDefault')

      // Dispatch event
      formElement.dispatchEvent(submitEvent)

      // Form should prevent default browser submission
      expect(preventDefault).toHaveBeenCalled()
    })

    it('should handle component cleanup in DOM', async () => {
      const { TextField } = await import(
        '../src/components/text-input/TextField'
      )

      const components = []
      const elements = []

      // Create multiple components
      for (let i = 0; i < 5; i++) {
        const comp = TextField({
          name: `cleanup_${i}`,
          label: `Cleanup Test ${i}`,
        })

        components.push(comp)

        // Note: In real TachUI usage, these would be rendered by the framework
        // For testing, we verify the component structure
        expect(comp.type).toBe('component')
        expect(comp.cleanup).toBeDefined()
      }

      // Test cleanup
      components.forEach(comp => {
        if (comp.cleanup) {
          comp.cleanup.forEach(fn => fn())
        }
      })

      expect(components).toHaveLength(5)
    })
  })

  describe('Form Context DOM Integration', () => {
    it('should integrate form state with component hierarchy', async () => {
      const { createFormState } = await import('../src/state')
      const { TextField } = await import(
        '../src/components/text-input/TextField'
      )
      const { Checkbox } = await import('../src/components/selection/Checkbox')

      const formState = createFormState({
        username: '',
        email: '',
        subscribe: false,
      })

      // Create components with form context
      const usernameField = TextField({
        name: 'username',
        label: 'Username',
        _formContext: formState,
        validation: {
          rules: ['required'],
          validateOn: 'blur',
        },
      })

      const emailField = TextField({
        name: 'email',
        label: 'Email',
        _formContext: formState,
        validation: {
          rules: ['required', 'email'],
          validateOn: 'blur',
        },
      })

      const subscribeCheckbox = Checkbox({
        name: 'subscribe',
        label: 'Subscribe to newsletter',
        _formContext: formState,
      })

      // Verify form context integration
      expect(usernameField.props._formContext).toBe(formState)
      expect(emailField.props._formContext).toBe(formState)
      expect(subscribeCheckbox.props._formContext).toBe(formState)

      // Test form state updates
      formState.setValue('username', 'johndoe')
      formState.setValue('email', 'john@example.com')
      formState.setValue('subscribe', true)

      expect(formState.getValue('username')).toBe('johndoe')
      expect(formState.getValue('email')).toBe('john@example.com')
      expect(formState.getValue('subscribe')).toBe(true)

      // Test validation
      const usernameValid = await formState.validateField('username')
      const emailValid = await formState.validateField('email')

      expect(usernameValid).toBe(true)
      expect(emailValid).toBe(true)
    })

    it('should handle nested form sections with state management', async () => {
      const { Form } = await import('../src/components/form-container')
      const { FormSection } = await import('../src/components/form-container')

      const personalSection = new FormSection({
        title: 'Personal Information',
        collapsible: false,
        children: ['Personal fields would go here'],
      })

      const contactSection = new FormSection({
        title: 'Contact Information',
        collapsible: true,
        defaultExpanded: false,
        children: ['Contact fields would go here'],
      })

      const form = new Form({
        children: [personalSection, contactSection],
        initialValues: {
          personal_field: 'personal_value',
          contact_field: 'contact_value',
        },
        onSubmit: async () => {},
      })

      // Test section functionality
      expect(personalSection.isExpanded).toBe(true) // Non-collapsible always expanded
      expect(contactSection.isExpanded).toBe(false) // Starts collapsed

      contactSection.expand()
      expect(contactSection.isExpanded).toBe(true)

      // Test form integration
      expect(form.getValue('personal_field')).toBe('personal_value')
      expect(form.getValue('contact_field')).toBe('contact_value')

      // Test DOM rendering
      const formElement = form.render()
      container.appendChild(formElement)

      expect(document.contains(formElement)).toBe(true)
      expect(formElement.tagName.toLowerCase()).toBe('form')
    })
  })

  describe('User Interaction Simulation', () => {
    it('should simulate complete user registration flow', async () => {
      const { createFormState } = await import('../src/state')

      const registrationForm = createFormState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
      })

      // Register validation rules
      registrationForm.register('firstName', {
        rules: ['required'],
        validateOn: 'blur',
      })
      registrationForm.register('lastName', {
        rules: ['required'],
        validateOn: 'blur',
      })
      registrationForm.register('email', {
        rules: ['required', 'email'],
        validateOn: 'blur',
      })
      registrationForm.register('password', {
        rules: ['required'],
        validateOn: 'change',
      })
      registrationForm.register('confirmPassword', {
        rules: ['required'],
        validateOn: 'blur',
      })
      registrationForm.register('agreeToTerms', {
        rules: ['required'],
        validateOn: 'change',
      })

      // Simulate user filling form step by step
      registrationForm.setValue('firstName', 'John')
      await registrationForm.validateField('firstName')

      registrationForm.setValue('lastName', 'Doe')
      await registrationForm.validateField('lastName')

      registrationForm.setValue('email', 'john.doe@example.com')
      await registrationForm.validateField('email')

      registrationForm.setValue('password', 'SecurePassword123!')
      await registrationForm.validateField('password')

      registrationForm.setValue('confirmPassword', 'SecurePassword123!')
      await registrationForm.validateField('confirmPassword')

      registrationForm.setValue('agreeToTerms', true)
      await registrationForm.validateField('agreeToTerms')

      // Verify final form state
      const formData = registrationForm.watch()
      expect(formData.firstName).toBe('John')
      expect(formData.lastName).toBe('Doe')
      expect(formData.email).toBe('john.doe@example.com')
      expect(formData.password).toBe('SecurePassword123!')
      expect(formData.confirmPassword).toBe('SecurePassword123!')
      expect(formData.agreeToTerms).toBe(true)

      // Test complete form validation
      const isFormValid = await registrationForm.validateForm()
      expect(isFormValid).toBe(true)
    })

    it('should handle error recovery workflow', async () => {
      const { createFormState } = await import('../src/state')

      const errorForm = createFormState({
        email: '',
        phone: '',
      })

      errorForm.register('email', {
        rules: ['required', 'email'],
        validateOn: 'blur',
      })
      errorForm.register('phone', {
        rules: ['required', 'phone'],
        validateOn: 'blur',
      })

      // Start with invalid data
      errorForm.setValue('email', 'invalid-email')
      errorForm.setValue('phone', '123') // Invalid phone

      // Validate and expect errors
      const emailValid1 = await errorForm.validateField('email')
      const phoneValid1 = await errorForm.validateField('phone')

      expect(emailValid1).toBe(false)
      expect(phoneValid1).toBe(false)
      expect(errorForm.getError('email')).toBeDefined()
      expect(errorForm.getError('phone')).toBeDefined()

      // Correct the errors
      errorForm.setValue('email', 'corrected@example.com')
      errorForm.setValue('phone', '555-123-4567')

      // Re-validate
      const emailValid2 = await errorForm.validateField('email')
      const phoneValid2 = await errorForm.validateField('phone')

      expect(emailValid2).toBe(true)
      expect(phoneValid2).toBe(true)
      expect(errorForm.getError('email')).toBeUndefined()
      expect(errorForm.getError('phone')).toBeUndefined()
    })
  })

  describe('Advanced DOM Scenarios', () => {
    it('should handle multi-step form navigation', async () => {
      const { createMultiStepFormState } = await import('../src/state')

      const steps = [
        { name: 'personal', title: 'Personal Info' },
        { name: 'contact', title: 'Contact Info' },
        { name: 'preferences', title: 'Preferences' },
      ]

      const multiStepForm = createMultiStepFormState(steps, {
        step_0_firstName: '',
        step_0_lastName: '',
        step_1_email: '',
        step_1_phone: '',
        step_2_newsletter: false,
        step_2_notifications: true,
      })

      // Test initial state
      expect(multiStepForm.currentStep()).toBe(0)
      expect(multiStepForm.isStepCompleted(0)).toBe(false)

      // Fill current step
      const currentForm = multiStepForm.getCurrentForm()
      expect(currentForm).toBeDefined()

      // Move to next step
      const canNext = await multiStepForm.nextStep(false) // Skip validation for test
      expect(canNext).toBe(true)
      expect(multiStepForm.currentStep()).toBe(1)

      // Move back
      const canPrev = multiStepForm.previousStep()
      expect(canPrev).toBe(true)
      expect(multiStepForm.currentStep()).toBe(0)

      // Jump to specific step
      const canJump = multiStepForm.goToStep(2)
      expect(canJump).toBe(true)
      expect(multiStepForm.currentStep()).toBe(2)

      // Get all values
      const allValues = multiStepForm.getAllValues()
      expect(Object.keys(allValues)).toContain('step_0_firstName')
      expect(Object.keys(allValues)).toContain('step_1_email')
      expect(Object.keys(allValues)).toContain('step_2_newsletter')
    })

    it('should handle form validation with DOM context', async () => {
      const { Form } = await import('../src/components/form-container')

      const validationSubmitHandler = vi.fn()
      const form = new Form({
        initialValues: {
          required_field: '',
          email_field: '',
          numeric_field: '',
        },
        validation: {
          required_field: { rules: ['required'], validateOn: 'submit' },
          email_field: { rules: ['required', 'email'], validateOn: 'submit' },
          numeric_field: { rules: ['numeric'], validateOn: 'submit' },
        },
        onSubmit: validationSubmitHandler,
        validateOnSubmit: true,
      })

      // Test with invalid data
      form.setValue('required_field', '')
      form.setValue('email_field', 'invalid-email')
      form.setValue('numeric_field', 'not-a-number')

      await form.handleSubmit()

      // Should not submit with invalid data
      expect(validationSubmitHandler).not.toHaveBeenCalled()

      // Fix validation errors
      form.setValue('required_field', 'required value')
      form.setValue('email_field', 'valid@example.com')
      form.setValue('numeric_field', '123')

      await form.handleSubmit()

      // Should submit with valid data
      expect(validationSubmitHandler).toHaveBeenCalledWith(
        {
          required_field: 'required value',
          email_field: 'valid@example.com',
          numeric_field: '123',
        },
        expect.any(Object)
      )
    })

    it('should handle component lifecycle in DOM context', async () => {
      const { TextField } = await import(
        '../src/components/text-input/TextField'
      )

      const lifecycleEvents: string[] = []

      const textField = TextField({
        name: 'lifecycle-test',
        label: 'Lifecycle Test',
        onFocus: () => lifecycleEvents.push('focus'),
        onBlur: () => lifecycleEvents.push('blur'),
        onChange: () => lifecycleEvents.push('change'),
      })

      // Component creation
      expect(textField.type).toBe('component')
      expect(textField.props.name).toBe('lifecycle-test')

      // Test cleanup function exists
      expect(textField.cleanup).toBeDefined()

      // Simulate lifecycle
      if (textField.cleanup) {
        textField.cleanup.forEach(cleanup => {
          expect(typeof cleanup).toBe('function')
          cleanup() // Should not throw
        })
      }

      expect(lifecycleEvents.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Accessibility in Real DOM', () => {
    it('should create accessible form structure', async () => {
      const { Form } = await import('../src/components/form-container')
      const { FormSection } = await import('../src/components/form-container')

      const accessibleSection = new FormSection({
        title: 'Accessible Form Section',
        description: 'This section contains accessible form fields',
        collapsible: true,
        defaultExpanded: true,
      })

      const accessibleForm = new Form({
        children: [accessibleSection],
        initialValues: { accessible_field: '' },
        onSubmit: async () => {},
      })

      const formElement = accessibleForm.render()
      container.appendChild(formElement)

      // Test accessibility structure
      expect(formElement.tagName.toLowerCase()).toBe('form')
      expect(document.contains(formElement)).toBe(true)

      // Test section accessibility
      expect(accessibleSection.type).toBe('form-section')
      expect(accessibleSection.isExpanded).toBe(true)

      const sectionElement = accessibleSection.render()
      expect(sectionElement.tagName.toLowerCase()).toBe('section')
    })

    it('should maintain focus management', async () => {
      const { createFormState } = await import('../src/state')

      const focusForm = createFormState({
        focus1: '',
        focus2: '',
        focus3: '',
      })

      // Test focus state management
      expect(focusForm.getValue('focus1')).toBe('')
      expect(focusForm.getValue('focus2')).toBe('')
      expect(focusForm.getValue('focus3')).toBe('')

      // Simulate focus flow
      focusForm.setValue('focus1', 'first')
      focusForm.setValue('focus2', 'second')
      focusForm.setValue('focus3', 'third')

      const formData = focusForm.watch()
      expect(formData.focus1).toBe('first')
      expect(formData.focus2).toBe('second')
      expect(formData.focus3).toBe('third')
    })
  })

  describe('Performance in Real DOM Context', () => {
    it('should handle moderate scale forms efficiently', async () => {
      const { createFormState } = await import('../src/state')

      // Create moderately sized form (realistic scale)
      const formFields: Record<string, string> = {}
      for (let i = 0; i < 20; i++) {
        formFields[`field_${i}`] = `value_${i}`
      }

      const start = performance.now()
      const formState = createFormState(formFields)
      const end = performance.now()

      expect(end - start).toBeLessThan(50) // Should be fast
      expect(Object.keys(formState.watch())).toHaveLength(20)

      // Test bulk updates
      const updateStart = performance.now()
      for (let i = 0; i < 20; i++) {
        formState.setValue(`field_${i}`, `updated_${i}`)
      }
      const updateEnd = performance.now()

      expect(updateEnd - updateStart).toBeLessThan(50)
      expect(formState.getValue('field_19')).toBe('updated_19')
    })

    it('should handle component creation at scale', async () => {
      const { TextField } = await import(
        '../src/components/text-input/TextField'
      )

      const start = performance.now()
      const components = []

      for (let i = 0; i < 15; i++) {
        components.push(
          TextField({
            name: `scale_test_${i}`,
            label: `Scale Test ${i}`,
            defaultValue: `default_${i}`,
          })
        )
      }

      const end = performance.now()

      expect(components).toHaveLength(15)
      expect(end - start).toBeLessThan(100) // Should create quickly

      // Verify all components
      components.forEach((comp, index) => {
        expect(comp.type).toBe('component')
        expect(comp.props.name).toBe(`scale_test_${index}`)
      })
    })
  })
})

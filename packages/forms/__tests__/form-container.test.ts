/**
 * Form Container Components Tests
 * Tests for Form and FormSection functionality
 */

import { describe, expect, it, vi } from 'vitest'
import {
  Form,
  FormSection,
  form,
  formSection,
} from '../src/components/form-container'

describe('Form Container Components', () => {
  describe('Form class', () => {
    it('should create form with basic properties', () => {
      const formInstance = new Form({
        onSubmit: vi.fn(),
        initialValues: { name: 'test' },
      })

      expect(formInstance).toBeDefined()
      expect(formInstance.type).toBe('form-container')
      expect(formInstance.properties).toBeDefined()
      expect(formInstance.state).toBeDefined()
    })

    it('should handle form state management', () => {
      const formInstance = new Form({
        initialValues: {
          name: 'John',
          email: 'john@example.com',
        },
      })

      expect(formInstance.getValue('name')).toBe('John')
      expect(formInstance.getValue('email')).toBe('john@example.com')

      formInstance.setValue('name', 'Jane')
      expect(formInstance.getValue('name')).toBe('Jane')
    })

    it('should register field validation', () => {
      const formInstance = new Form({
        validation: {
          email: {
            rules: ['required', 'email'],
            validateOn: 'blur',
          },
        },
      })

      formInstance.register('email', {
        rules: ['required', 'email'],
        validateOn: 'blur',
      })

      expect(formInstance.getError('email')).toBeUndefined()
    })

    it('should handle form submission', async () => {
      const submitHandler = vi.fn()
      const formInstance = new Form({
        onSubmit: submitHandler,
        initialValues: { name: 'test' },
        validateOnSubmit: true,
      })

      await formInstance.handleSubmit()
      expect(submitHandler).toHaveBeenCalledWith(
        { name: 'test' },
        expect.any(Object)
      )
    })

    it('should validate form before submission', async () => {
      const submitHandler = vi.fn()
      const formInstance = new Form({
        onSubmit: submitHandler,
        validation: {
          email: {
            rules: ['required', 'email'],
            validateOn: 'submit',
          },
        },
        initialValues: { email: '' },
      })

      await formInstance.handleSubmit()

      // Should not call submit handler with invalid data
      expect(submitHandler).not.toHaveBeenCalled()
    })

    it('should reset form when configured', async () => {
      const formInstance = new Form({
        onSubmit: vi.fn(),
        initialValues: { name: 'initial' },
        resetOnSubmit: true,
      })

      formInstance.setValue('name', 'changed')
      expect(formInstance.getValue('name')).toBe('changed')

      await formInstance.handleSubmit()
      expect(formInstance.getValue('name')).toBe('initial')
    })

    it('should render form element', () => {
      const formInstance = new Form({
        className: 'test-form',
        id: 'my-form',
      })

      const element = formInstance.render()
      expect(element.tagName).toBe('FORM')
      expect(element.className).toBe('test-form')
      expect(element.id).toBe('my-form')
    })

    it('should handle form submission via DOM event', () => {
      const submitHandler = vi.fn()
      const formInstance = new Form({
        onSubmit: submitHandler,
      })

      const element = formInstance.render()
      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      })

      element.dispatchEvent(submitEvent)

      // Event should be prevented from default browser submission
      expect(submitEvent.defaultPrevented).toBe(true)
    })
  })

  describe('FormSection class', () => {
    it('should create form section with basic properties', () => {
      const section = new FormSection({
        title: 'Personal Information',
        description: 'Enter your details',
      })

      expect(section).toBeDefined()
      expect(section.type).toBe('form-section')
      expect(section.properties.title).toBe('Personal Information')
      expect(section.properties.description).toBe('Enter your details')
    })

    it('should handle collapsible behavior', () => {
      const section = new FormSection({
        title: 'Settings',
        collapsible: true,
        defaultExpanded: false,
      })

      expect(section.isExpanded).toBe(false)

      section.toggle()
      expect(section.isExpanded).toBe(true)

      section.collapse()
      expect(section.isExpanded).toBe(false)

      section.expand()
      expect(section.isExpanded).toBe(true)
    })

    it('should not collapse when not collapsible', () => {
      const section = new FormSection({
        title: 'Required Section',
        collapsible: false,
      })

      expect(section.isExpanded).toBe(true)
      section.collapse()
      expect(section.isExpanded).toBe(true)
    })

    it('should render section element with title', () => {
      const section = new FormSection({
        title: 'Test Section',
        className: 'test-section',
      })

      const element = section.render()
      expect(element.tagName).toBe('SECTION')
      expect(element.className).toBe('test-section')

      const title = element.querySelector('h3')
      expect(title).toBeDefined()
      expect(title?.textContent).toBe('Test Section')
    })

    it('should render collapsible section with toggle', () => {
      const section = new FormSection({
        title: 'Collapsible Section',
        collapsible: true,
      })

      const element = section.render()
      const title = element.querySelector('h3')

      expect(title?.style.cursor).toBe('pointer')

      // Should have expand/collapse indicator
      const indicator = title?.querySelector('span')
      expect(indicator).toBeDefined()
    })

    it('should render description when provided', () => {
      const section = new FormSection({
        title: 'Test Section',
        description: 'This is a test description',
      })

      const element = section.render()
      const description = element.querySelector('p')

      expect(description).toBeDefined()
      expect(description?.textContent).toBe('This is a test description')
    })
  })

  describe('Factory functions', () => {
    it('should create Form instance via form function', () => {
      const formInstance = form({
        onSubmit: vi.fn(),
        initialValues: { test: 'value' },
      })

      expect(formInstance).toBeInstanceOf(Form)
      expect(formInstance.type).toBe('form-container')
    })

    it('should create FormSection instance via formSection function', () => {
      const sectionInstance = formSection({
        title: 'Test Section',
      })

      expect(sectionInstance).toBeInstanceOf(FormSection)
      expect(sectionInstance.type).toBe('form-section')
    })
  })

  describe('Form integration with state management', () => {
    it('should integrate with form state for field management', () => {
      const formInstance = new Form({
        initialValues: {
          username: '',
          password: '',
        },
        validation: {
          username: {
            rules: ['required'],
            validateOn: 'blur',
          },
          password: {
            rules: [
              'required',
              { name: 'minLength', options: { minLength: 8 } },
            ],
            validateOn: 'blur',
          },
        },
      })

      // Test field registration
      formInstance.register('confirmPassword', {
        rules: ['required'],
        validateOn: 'blur',
      })

      expect(formInstance.getValue('username')).toBe('')
      expect(formInstance.getError('username')).toBeUndefined()
    })

    it('should handle form validation lifecycle', async () => {
      const formInstance = new Form({
        initialValues: { email: 'invalid-email' },
        validation: {
          email: {
            rules: ['required', 'email'],
            validateOn: 'change',
          },
        },
      })

      const isValid = await formInstance.validateForm()
      expect(isValid).toBe(false)
      expect(formInstance.getError('email')).toBeDefined()
    })
  })
})

/**
 * Phase 4.2: Multi-step Wizard Form Real-World Scenario Tests
 * 
 * Comprehensive testing of multi-step wizard forms including:
 * - Step-by-step navigation (Next/Previous/Jump)
 * - Form state persistence across steps
 * - Step validation and error handling
 * - Progress indicators and completion
 * - Data collection and submission
 * - Conditional step logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  RealWorldScenarioTester,
  ScenarioPatterns,
  type RealWorldScenario
} from '../../../../tools/testing/real-world-scenario-tester'
import { createSignal } from '../../src/reactive'

// Mock wizard data
const mockWizardData = {
  user: {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@company.com',
    phone: '555-0123'
  },
  company: {
    name: 'Tech Solutions Inc',
    size: 'medium',
    industry: 'technology',
    website: 'https://techsolutions.com'
  },
  preferences: {
    newsletter: true,
    notifications: false,
    theme: 'dark',
    language: 'en'
  }
}

describe('Phase 4.2: Multi-step Wizard Form Real-World Scenarios', () => {
  let tester: RealWorldScenarioTester

  beforeEach(() => {
    // Clear DOM and set up test root
    document.body.innerHTML = '<div id="test-app-root"></div>'
    
    tester = new RealWorldScenarioTester({
      enableMemoryTracking: true,
      enablePerformanceTracking: true,
      defaultTimeout: 10000
    })
  })

  afterEach(async () => {
    // Cleanup after each test
    document.body.innerHTML = ''
  })

  describe('Complete Wizard Flow', () => {
    it('should handle complete multi-step wizard form with navigation and validation', async () => {
      const completeWizardScenario: RealWorldScenario = {
        name: 'Complete Multi-step Wizard',
        description: 'Full wizard flow with step navigation, validation, and completion',
        tags: ['wizard', 'forms', 'navigation', 'validation', 'critical'],
        estimatedDuration: 10000,
        
        setup: async () => {
          // Create wizard application state
          const [currentStep, setCurrentStep] = createSignal(1)
          const [wizardData, setWizardData] = createSignal({
            user: {},
            company: {},
            preferences: {}
          })
          const [stepValidation, setStepValidation] = createSignal<Record<number, boolean>>({})

          const totalSteps = 4

          // Create DOM structure for wizard
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="wizard-app">
              <!-- Progress Indicator -->
              <div class="wizard-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 25%;"></div>
                </div>
                <div class="step-indicators">
                  <div class="step-indicator active" data-step="1">1</div>
                  <div class="step-indicator" data-step="2">2</div>
                  <div class="step-indicator" data-step="3">3</div>
                  <div class="step-indicator" data-step="4">4</div>
                </div>
                <p class="step-title">Step 1: Personal Information</p>
              </div>

              <!-- Step 1: Personal Information -->
              <div class="wizard-step step-1" style="display: block;">
                <h2>Personal Information</h2>
                <form class="step-form">
                  <input type="text" name="firstName" placeholder="First Name" class="user-firstname" required />
                  <input type="text" name="lastName" placeholder="Last Name" class="user-lastname" required />
                  <input type="email" name="email" placeholder="Email" class="user-email" required />
                  <input type="tel" name="phone" placeholder="Phone" class="user-phone" required />
                </form>
                <div class="step-errors" style="display: none;"></div>
              </div>

              <!-- Step 2: Company Information -->
              <div class="wizard-step step-2" style="display: none;">
                <h2>Company Information</h2>
                <form class="step-form">
                  <input type="text" name="companyName" placeholder="Company Name" class="company-name" required />
                  <select name="companySize" class="company-size" required>
                    <option value="">Select Company Size</option>
                    <option value="small">Small (1-50 employees)</option>
                    <option value="medium">Medium (51-500 employees)</option>
                    <option value="large">Large (500+ employees)</option>
                  </select>
                  <select name="industry" class="company-industry" required>
                    <option value="">Select Industry</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                  </select>
                  <input type="url" name="website" placeholder="Company Website" class="company-website" />
                </form>
                <div class="step-errors" style="display: none;"></div>
              </div>

              <!-- Step 3: Preferences -->
              <div class="wizard-step step-3" style="display: none;">
                <h2>Preferences</h2>
                <form class="step-form">
                  <div class="checkbox-group">
                    <label>
                      <input type="checkbox" name="newsletter" class="pref-newsletter" />
                      Subscribe to newsletter
                    </label>
                    <label>
                      <input type="checkbox" name="notifications" class="pref-notifications" />
                      Enable notifications
                    </label>
                  </div>
                  <div class="radio-group">
                    <p>Theme Preference:</p>
                    <label>
                      <input type="radio" name="theme" value="light" class="theme-light" />
                      Light Theme
                    </label>
                    <label>
                      <input type="radio" name="theme" value="dark" class="theme-dark" />
                      Dark Theme
                    </label>
                  </div>
                  <select name="language" class="pref-language">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </form>
                <div class="step-errors" style="display: none;"></div>
              </div>

              <!-- Step 4: Review & Submit -->
              <div class="wizard-step step-4" style="display: none;">
                <h2>Review & Submit</h2>
                <div class="review-summary">
                  <div class="review-section">
                    <h3>Personal Information</h3>
                    <div class="review-personal"></div>
                  </div>
                  <div class="review-section">
                    <h3>Company Information</h3>
                    <div class="review-company"></div>
                  </div>
                  <div class="review-section">
                    <h3>Preferences</h3>
                    <div class="review-preferences"></div>
                  </div>
                </div>
                <div class="final-actions">
                  <label>
                    <input type="checkbox" class="terms-agreement" required />
                    I agree to the terms and conditions
                  </label>
                </div>
              </div>

              <!-- Wizard Navigation -->
              <div class="wizard-navigation">
                <button class="nav-previous" disabled>Previous</button>
                <button class="nav-next">Next</button>
                <button class="nav-submit" style="display: none;">Submit</button>
              </div>

              <!-- Success/Completion -->
              <div class="wizard-success" style="display: none;">
                <h2>Registration Complete!</h2>
                <p class="success-message">Thank you for registering. Your account has been created successfully.</p>
                <div class="confirmation-details"></div>
              </div>
            </div>
          `

          // Wizard navigation logic
          const updateProgress = (step: number) => {
            const progressFill = testRoot.querySelector('.progress-fill') as HTMLElement
            const stepTitle = testRoot.querySelector('.step-title') as HTMLElement
            const indicators = testRoot.querySelectorAll('.step-indicator')
            
            const progressPercent = (step / totalSteps) * 100
            progressFill.style.width = `${progressPercent}%`
            
            const titles = [
              'Step 1: Personal Information',
              'Step 2: Company Information', 
              'Step 3: Preferences',
              'Step 4: Review & Submit'
            ]
            stepTitle.textContent = titles[step - 1] || ''
            
            indicators.forEach((indicator, index) => {
              indicator.classList.toggle('active', index + 1 === step)
              indicator.classList.toggle('completed', index + 1 < step)
            })
          }

          const showStep = (step: number) => {
            testRoot.querySelectorAll('.wizard-step').forEach((stepEl, index) => {
              (stepEl as HTMLElement).style.display = index + 1 === step ? 'block' : 'none'
            })
            
            const prevBtn = testRoot.querySelector('.nav-previous') as HTMLButtonElement
            const nextBtn = testRoot.querySelector('.nav-next') as HTMLButtonElement
            const submitBtn = testRoot.querySelector('.nav-submit') as HTMLButtonElement
            
            prevBtn.disabled = step === 1
            nextBtn.style.display = step === totalSteps ? 'none' : 'block'
            submitBtn.style.display = step === totalSteps ? 'block' : 'none'
            
            updateProgress(step)
          }

          const validateStep = (step: number): boolean => {
            const stepEl = testRoot.querySelector(`.step-${step}`)!
            const form = stepEl.querySelector('.step-form') as HTMLFormElement | null
            const errorsDiv = stepEl.querySelector('.step-errors') as HTMLElement
            
            if (!form) return true // Review step doesn't have a form
            
            const requiredInputs = form.querySelectorAll('[required]')
            const errors: string[] = []
            
            requiredInputs.forEach(input => {
              const element = input as HTMLInputElement | HTMLSelectElement
              if (!element.value.trim()) {
                errors.push(`${element.placeholder || element.name} is required`)
              }
            })
            
            // Special validation for email
            const emailInput = form.querySelector('[type="email"]') as HTMLInputElement
            if (emailInput && emailInput.value && !emailInput.value.includes('@')) {
              errors.push('Please enter a valid email address')
            }
            
            if (errors.length > 0) {
              errorsDiv.innerHTML = errors.map(error => `<p class="error">${error}</p>`).join('')
              errorsDiv.style.display = 'block'
              return false
            } else {
              errorsDiv.style.display = 'none'
              return true
            }
          }

          const collectStepData = (step: number) => {
            const stepEl = testRoot.querySelector(`.step-${step}`)!
            const form = stepEl.querySelector('.step-form') as HTMLFormElement | null
            
            if (!form) return
            
            const formData = new FormData(form)
            const data = wizardData()
            
            if (step === 1) {
              data.user = {
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string
              }
            } else if (step === 2) {
              data.company = {
                name: formData.get('companyName') as string,
                size: formData.get('companySize') as string,
                industry: formData.get('industry') as string,
                website: formData.get('website') as string
              }
            } else if (step === 3) {
              const newsletter = form.querySelector('.pref-newsletter') as HTMLInputElement
              const notifications = form.querySelector('.pref-notifications') as HTMLInputElement
              const theme = form.querySelector('input[name="theme"]:checked') as HTMLInputElement
              const language = form.querySelector('.pref-language') as HTMLSelectElement
              
              data.preferences = {
                newsletter: newsletter.checked,
                notifications: notifications.checked,
                theme: theme?.value || 'light',
                language: language.value
              }
            }
            
            setWizardData(data)
          }

          const updateReviewSection = () => {
            const data = wizardData()
            const reviewPersonal = testRoot.querySelector('.review-personal')!
            const reviewCompany = testRoot.querySelector('.review-company')!
            const reviewPreferences = testRoot.querySelector('.review-preferences')!
            
            reviewPersonal.innerHTML = `
              <p><strong>Name:</strong> ${data.user?.firstName} ${data.user?.lastName}</p>
              <p><strong>Email:</strong> ${data.user?.email}</p>
              <p><strong>Phone:</strong> ${data.user?.phone}</p>
            `
            
            reviewCompany.innerHTML = `
              <p><strong>Company:</strong> ${data.company?.name}</p>
              <p><strong>Size:</strong> ${data.company?.size}</p>
              <p><strong>Industry:</strong> ${data.company?.industry}</p>
              <p><strong>Website:</strong> ${data.company?.website || 'Not provided'}</p>
            `
            
            reviewPreferences.innerHTML = `
              <p><strong>Newsletter:</strong> ${data.preferences?.newsletter ? 'Yes' : 'No'}</p>
              <p><strong>Notifications:</strong> ${data.preferences?.notifications ? 'Yes' : 'No'}</p>
              <p><strong>Theme:</strong> ${data.preferences?.theme}</p>
              <p><strong>Language:</strong> ${data.preferences?.language}</p>
            `
          }

          // Navigation event handlers
          const nextBtn = testRoot.querySelector('.nav-next')!
          const prevBtn = testRoot.querySelector('.nav-previous')!
          const submitBtn = testRoot.querySelector('.nav-submit')!
          
          nextBtn.addEventListener('click', () => {
            const current = currentStep()
            if (validateStep(current)) {
              collectStepData(current)
              const newStep = current + 1
              setCurrentStep(newStep)
              showStep(newStep)
              
              if (newStep === 4) {
                updateReviewSection()
              }
            }
          })
          
          prevBtn.addEventListener('click', () => {
            const newStep = currentStep() - 1
            setCurrentStep(newStep)
            showStep(newStep)
          })
          
          submitBtn.addEventListener('click', () => {
            const termsCheckbox = testRoot.querySelector('.terms-agreement') as HTMLInputElement
            if (!termsCheckbox.checked) {
              alert('Please agree to the terms and conditions')
              return
            }
            
            // Simulate submission
            const wizardApp = testRoot.querySelector('.wizard-app')!
            const successSection = testRoot.querySelector('.wizard-success')!
            const confirmationDetails = testRoot.querySelector('.confirmation-details')!
            
            wizardApp.style.display = 'none'
            successSection.style.display = 'block'
            
            const data = wizardData()
            confirmationDetails.innerHTML = `
              <p><strong>Registration ID:</strong> REG-${Date.now()}</p>
              <p><strong>Account:</strong> ${data.user?.email}</p>
              <p><strong>Company:</strong> ${data.company?.name}</p>
            `
          })

          // Initialize wizard
          showStep(1)
          
          // Update state in tester for tracking
          tester.updateState('currentStep', currentStep())
          tester.updateState('wizardData', wizardData())
        },

        steps: [
          {
            name: 'Verify Initial Wizard State',
            description: 'Check that wizard loads correctly on step 1',
            actions: [
              { type: 'wait', value: 300 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.wizard-app' },
              { type: 'element-contains', selector: '.step-title', expected: 'Step 1: Personal Information' },
              { type: 'element-exists', selector: '.step-1[style*="display: block"]' },
              { type: 'element-exists', selector: '.nav-previous[disabled]' }
            ]
          },

          {
            name: 'Fill Personal Information',
            description: 'Complete step 1 with user details',
            actions: [
              { type: 'input', target: '.user-firstname', value: mockWizardData.user.firstName },
              { type: 'input', target: '.user-lastname', value: mockWizardData.user.lastName },
              { type: 'input', target: '.user-email', value: mockWizardData.user.email },
              { type: 'input', target: '.user-phone', value: mockWizardData.user.phone },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const firstNameInput = document.querySelector('.user-firstname') as HTMLInputElement
                return firstNameInput?.value === 'Alice'
              }},
              { type: 'custom', customAssertion: () => {
                const emailInput = document.querySelector('.user-email') as HTMLInputElement
                return emailInput?.value === 'alice@company.com'
              }}
            ]
          },

          {
            name: 'Navigate to Step 2',
            description: 'Move to company information step',
            actions: [
              { type: 'click', target: '.nav-next' },
              { type: 'wait', value: 500 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.step-title', expected: 'Step 2: Company Information' },
              { type: 'element-exists', selector: '.step-2[style*="display: block"]' },
              { type: 'element-exists', selector: '.nav-previous:not([disabled])' }
            ]
          },

          {
            name: 'Fill Company Information',
            description: 'Complete step 2 with company details',
            actions: [
              { type: 'input', target: '.company-name', value: mockWizardData.company.name },
              { type: 'select', target: '.company-size', value: mockWizardData.company.size },
              { type: 'select', target: '.company-industry', value: mockWizardData.company.industry },
              { type: 'input', target: '.company-website', value: mockWizardData.company.website },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const companyInput = document.querySelector('.company-name') as HTMLInputElement
                return companyInput?.value === 'Tech Solutions Inc'
              }},
              { type: 'custom', customAssertion: () => {
                const sizeSelect = document.querySelector('.company-size') as HTMLSelectElement
                return sizeSelect?.value === 'medium'
              }}
            ]
          },

          {
            name: 'Navigate to Step 3',
            description: 'Move to preferences step',
            actions: [
              { type: 'click', target: '.nav-next' },
              { type: 'wait', value: 500 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.step-title', expected: 'Step 3: Preferences' },
              { type: 'element-exists', selector: '.step-3[style*="display: block"]' }
            ]
          },

          {
            name: 'Fill Preferences',
            description: 'Complete step 3 with user preferences',
            actions: [
              { type: 'click', target: '.pref-newsletter' },
              { type: 'click', target: '.theme-dark' },
              { type: 'select', target: '.pref-language', value: 'en' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const newsletterCheckbox = document.querySelector('.pref-newsletter') as HTMLInputElement
                return newsletterCheckbox?.checked === true
              }},
              { type: 'custom', customAssertion: () => {
                const themeRadio = document.querySelector('.theme-dark') as HTMLInputElement
                return themeRadio?.checked === true
              }}
            ]
          },

          {
            name: 'Navigate to Review Step',
            description: 'Move to final review step',
            actions: [
              { type: 'click', target: '.nav-next' },
              { type: 'wait', value: 500 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.step-title', expected: 'Step 4: Review & Submit' },
              { type: 'element-exists', selector: '.step-4[style*="display: block"]' },
              { type: 'element-contains', selector: '.review-personal', expected: 'Alice Johnson' },
              { type: 'element-contains', selector: '.review-company', expected: 'Tech Solutions Inc' },
              { type: 'element-exists', selector: '.nav-submit[style*="display: block"]' }
            ]
          },

          {
            name: 'Complete Wizard Submission',
            description: 'Agree to terms and submit the wizard',
            actions: [
              { type: 'click', target: '.terms-agreement' },
              { type: 'click', target: '.nav-submit' },
              { type: 'wait', value: 1000 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.success-message', expected: 'Thank you for registering' },
              { type: 'element-contains', selector: '.confirmation-details', expected: 'alice@company.com' },
              { type: 'element-exists', selector: '.wizard-success[style*="display: block"]' }
            ]
          }
        ],

        successCriteria: [
          'Wizard loads correctly with step 1 active',
          'Form validation works on each step',
          'Navigation between steps functions properly',
          'Data persists across step transitions',
          'Progress indicator updates correctly',
          'Review step displays all collected data',
          'Final submission completes successfully',
          'Success confirmation is shown'
        ]
      }

      const result = await tester.executeScenario(completeWizardScenario)

      // Debug logging
      console.log('Multi-step Wizard Test Result:', {
        success: result.success,
        completedSteps: result.completedSteps,
        totalSteps: result.totalSteps,
        errors: result.errors.map(e => ({ step: e.step, message: e.error.message })),
        duration: result.duration,
        performance: {
          memoryUsage: result.performance.memoryUsage,
          domNodes: result.performance.domNodes
        }
      })

      // Generate detailed scenario report
      const report = tester.generateReport(result)
      console.log(report)

      // Assertions
      expect(result.success).toBe(true)
      expect(result.completedSteps).toBe(result.totalSteps)
      expect(result.errors).toHaveLength(0)
      expect(result.duration).toBeLessThan(12000)
    }, 15000)

    it('should handle wizard navigation edge cases', async () => {
      const wizardNavigationScenario: RealWorldScenario = {
        name: 'Wizard Navigation Edge Cases',
        description: 'Test wizard navigation edge cases including validation failures and back navigation',
        tags: ['wizard', 'navigation', 'validation', 'edge-cases'],
        estimatedDuration: 6000,

        setup: async () => {
          // Simplified wizard for navigation testing
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="simple-wizard">
              <div class="step-1" style="display: block;">
                <h2>Step 1</h2>
                <input type="email" class="required-email" placeholder="Email" required />
                <div class="validation-errors" style="display: none;"></div>
              </div>
              <div class="step-2" style="display: none;">
                <h2>Step 2</h2>
                <p>Step 2 content</p>
              </div>
              <div class="navigation">
                <button class="back-btn" disabled>Back</button>
                <button class="next-btn">Next</button>
              </div>
            </div>
          `

          let currentStep = 1
          const nextBtn = testRoot.querySelector('.next-btn')!
          const backBtn = testRoot.querySelector('.back-btn') as HTMLButtonElement
          const errorsDiv = testRoot.querySelector('.validation-errors') as HTMLElement

          nextBtn.addEventListener('click', () => {
            const emailInput = testRoot.querySelector('.required-email') as HTMLInputElement
            
            if (currentStep === 1) {
              if (!emailInput.value || !emailInput.value.includes('@')) {
                errorsDiv.textContent = 'Please enter a valid email address'
                errorsDiv.style.display = 'block'
                return
              }
              
              errorsDiv.style.display = 'none'
              currentStep = 2
              testRoot.querySelector('.step-1')!.setAttribute('style', 'display: none;')
              testRoot.querySelector('.step-2')!.setAttribute('style', 'display: block;')
              backBtn.disabled = false
            }
          })

          backBtn.addEventListener('click', () => {
            if (currentStep === 2) {
              currentStep = 1
              testRoot.querySelector('.step-2')!.setAttribute('style', 'display: none;')
              testRoot.querySelector('.step-1')!.setAttribute('style', 'display: block;')
              backBtn.disabled = true
              errorsDiv.style.display = 'none'
            }
          })
        },

        steps: [
          {
            name: 'Try to Proceed with Invalid Data',
            description: 'Attempt to go to next step with invalid email',
            actions: [
              { type: 'input', target: '.required-email', value: 'invalid-email' },
              { type: 'click', target: '.next-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.validation-errors', expected: 'Please enter a valid email address' },
              { type: 'element-exists', selector: '.step-1[style*="display: block"]' }
            ]
          },

          {
            name: 'Proceed with Valid Data',
            description: 'Successfully navigate to step 2 with valid email',
            actions: [
              { type: 'input', target: '.required-email', value: 'test@example.com' },
              { type: 'click', target: '.next-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.step-2[style*="display: block"]' },
              { type: 'element-exists', selector: '.back-btn:not([disabled])' }
            ]
          },

          {
            name: 'Navigate Back to Previous Step',
            description: 'Use back button to return to step 1',
            actions: [
              { type: 'click', target: '.back-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.step-1[style*="display: block"]' },
              { type: 'element-exists', selector: '.back-btn[disabled]' }
            ]
          }
        ],

        successCriteria: [
          'Validation prevents invalid progression',
          'Valid data allows step progression',
          'Back navigation works correctly',
          'Button states update appropriately'
        ]
      }

      const result = await tester.executeScenario(wizardNavigationScenario)

      console.log('Wizard Navigation Test Result:', {
        success: result.success,
        completedSteps: result.completedSteps,
        errors: result.errors.map(e => ({ step: e.step, message: e.error.message }))
      })

      expect(result.success).toBe(true)
      expect(result.completedSteps).toBe(3)
      expect(result.errors).toHaveLength(0)
    }, 8000)
  })
})
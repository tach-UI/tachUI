/**
 * Phase 4.1: E-commerce Checkout Flow Real-World Scenario Tests
 * 
 * Comprehensive testing of complete e-commerce user workflows including:
 * - Product browsing and selection
 * - Cart management and updates
 * - Multi-step checkout process
 * - Payment form validation
 * - Order confirmation and completion
 * - Error handling and recovery
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  RealWorldScenarioTester,
  ScenarioPatterns,
  type RealWorldScenario
} from '../../../../tools/testing/real-world-scenario-tester'
import { createSignal } from '../../src/reactive'

// Mock product data
const mockProducts = [
  { id: 'prod-1', name: 'Wireless Headphones', price: 99.99, image: '/headphones.jpg', stock: 15 },
  { id: 'prod-2', name: 'Smart Watch', price: 199.99, image: '/smartwatch.jpg', stock: 8 },
  { id: 'prod-3', name: 'Laptop Stand', price: 49.99, image: '/laptop-stand.jpg', stock: 22 }
]

// Mock user data
const mockUser = {
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '(555) 123-4567',
  address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  cardNumber: '4111111111111111',
  cardExpiry: '12/25',
  cardCVV: '123'
}

describe('Phase 4.1: E-commerce Checkout Flow Real-World Scenarios', () => {
  let tester: RealWorldScenarioTester

  beforeEach(() => {
    // Clear DOM and set up test root
    document.body.innerHTML = '<div id="test-app-root"></div>'
    
    tester = new RealWorldScenarioTester({
      enableMemoryTracking: true,
      enablePerformanceTracking: true,
      defaultTimeout: 15000
    })
  })

  afterEach(async () => {
    // Cleanup after each test
    document.body.innerHTML = ''
  })

  describe('Complete Purchase Journey', () => {
    it('should handle complete product selection to order confirmation flow', async () => {
      const completeCheckoutScenario: RealWorldScenario = {
        name: 'Complete E-commerce Checkout',
        description: 'Full user journey from product selection to order confirmation',
        tags: ['ecommerce', 'checkout', 'forms', 'navigation', 'critical'],
        estimatedDuration: 12000,
        
        setup: async () => {
          // Create e-commerce application state
          const [cartItems, setCartItems] = createSignal<Array<{
            id: string
            name: string
            price: number
            quantity: number
          }>>([])
          
          const [currentStep, setCurrentStep] = createSignal('products')
          const [orderData, setOrderData] = createSignal({})

          // Create DOM structure for e-commerce app
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="ecommerce-app">
              <!-- Product List Section -->
              <div class="products-section" style="display: block;">
                <h2 class="products-title">Our Products</h2>
                <div class="product-list">
                  ${mockProducts.map(product => `
                    <div class="product-item" data-product-id="${product.id}">
                      <img src="${product.image}" alt="${product.name}" class="product-image" />
                      <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">$${product.price}</p>
                        <p class="product-stock">${product.stock} in stock</p>
                        <button class="add-to-cart" data-product-id="${product.id}">Add to Cart</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <div class="cart-actions">
                  <span class="cart-summary">Cart: 0 items</span>
                  <button class="cart-checkout-btn" disabled>Proceed to Checkout</button>
                </div>
              </div>

              <!-- Checkout Section -->
              <div class="checkout-section" style="display: none;">
                <h2 class="checkout-title">Checkout</h2>
                
                <!-- Shipping Form -->
                <div class="shipping-form-section">
                  <h3>Shipping Information</h3>
                  <form class="shipping-form">
                    <input type="text" name="firstName" placeholder="First Name" class="shipping-firstname" required />
                    <input type="text" name="lastName" placeholder="Last Name" class="shipping-lastname" required />
                    <input type="email" name="email" placeholder="Email" class="shipping-email" required />
                    <input type="tel" name="phone" placeholder="Phone" class="shipping-phone" required />
                    <input type="text" name="address" placeholder="Address" class="shipping-address" required />
                    <input type="text" name="city" placeholder="City" class="shipping-city" required />
                    <input type="text" name="state" placeholder="State" class="shipping-state" required />
                    <input type="text" name="zip" placeholder="ZIP Code" class="shipping-zip" required />
                    <button type="button" class="continue-to-payment">Continue to Payment</button>
                  </form>
                </div>

                <!-- Payment Form -->
                <div class="payment-form-section" style="display: none;">
                  <h3>Payment Information</h3>
                  <form class="payment-form">
                    <input type="text" name="cardNumber" placeholder="Card Number" class="payment-cardnumber" required />
                    <input type="text" name="cardExpiry" placeholder="MM/YY" class="payment-expiry" required />
                    <input type="text" name="cardCVV" placeholder="CVV" class="payment-cvv" required />
                    <input type="text" name="nameOnCard" placeholder="Name on Card" class="payment-name" required />
                    <button type="button" class="place-order">Place Order</button>
                  </form>
                </div>
              </div>

              <!-- Order Confirmation Section -->
              <div class="confirmation-section" style="display: none;">
                <h2 class="confirmation-title">Order Confirmed!</h2>
                <p class="confirmation-message">Thank you for your order. Order ID: <span class="order-id"></span></p>
                <div class="order-summary"></div>
              </div>
            </div>
          `

          // Add interactive functionality
          const cartSummary = testRoot.querySelector('.cart-summary')!
          const checkoutBtn = testRoot.querySelector('.cart-checkout-btn') as HTMLButtonElement
          const productsSection = testRoot.querySelector('.products-section')!
          const checkoutSection = testRoot.querySelector('.checkout-section')!
          const confirmationSection = testRoot.querySelector('.confirmation-section')!

          // Track cart state and update UI
          const updateCartUI = () => {
            const items = cartItems()
            const itemCount = items.reduce((total, item) => total + item.quantity, 0)
            cartSummary.textContent = `Cart: ${itemCount} items`
            checkoutBtn.disabled = itemCount === 0
          }

          // Add to cart functionality
          testRoot.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const target = e.target as HTMLElement
              const productId = target.getAttribute('data-product-id')!
              const product = mockProducts.find(p => p.id === productId)!
              
              const current = cartItems()
              const existing = current.find(item => item.id === productId)
              if (existing) {
                existing.quantity++
                setCartItems([...current])
              } else {
                setCartItems([...current, {
                  id: productId,
                  name: product.name,
                  price: product.price,
                  quantity: 1
                }])
              }
              updateCartUI()
            })
          })

          // Checkout navigation
          checkoutBtn.addEventListener('click', () => {
            productsSection.style.display = 'none'
            checkoutSection.style.display = 'block'
            setCurrentStep('checkout')
          })

          // Shipping form to payment navigation
          const continueToPaymentBtn = testRoot.querySelector('.continue-to-payment')!
          const shippingFormSection = testRoot.querySelector('.shipping-form-section')!
          const paymentFormSection = testRoot.querySelector('.payment-form-section')!
          
          continueToPaymentBtn.addEventListener('click', () => {
            // Validate shipping form
            const shippingForm = testRoot.querySelector('.shipping-form') as HTMLFormElement
            const formData = new FormData(shippingForm)
            const isValid = Array.from(shippingForm.querySelectorAll('[required]')).every(input => 
              (input as HTMLInputElement).value.trim() !== ''
            )

            if (isValid) {
              shippingFormSection.style.display = 'none'
              paymentFormSection.style.display = 'block'
            } else {
              alert('Please fill in all shipping information')
            }
          })

          // Place order functionality
          const placeOrderBtn = testRoot.querySelector('.place-order')!
          placeOrderBtn.addEventListener('click', () => {
            // Validate payment form
            const paymentForm = testRoot.querySelector('.payment-form') as HTMLFormElement
            const isValid = Array.from(paymentForm.querySelectorAll('[required]')).every(input => 
              (input as HTMLInputElement).value.trim() !== ''
            )

            if (isValid) {
              // Generate order ID and show confirmation
              const orderId = `ORDER-${Date.now()}`
              const orderIdSpan = testRoot.querySelector('.order-id')!
              const orderSummary = testRoot.querySelector('.order-summary')!
              
              orderIdSpan.textContent = orderId
              orderSummary.innerHTML = cartItems().map(item => 
                `<p>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</p>`
              ).join('')

              checkoutSection.style.display = 'none'
              confirmationSection.style.display = 'block'
              setCurrentStep('confirmation')
            } else {
              alert('Please fill in all payment information')
            }
          })

          // Update state in tester for tracking
          tester.updateState('cart', cartItems())
          tester.updateState('currentStep', currentStep())
        },

        steps: [
          {
            name: 'Verify Product List Loaded',
            description: 'Check that products are displayed correctly',
            actions: [
              { type: 'wait', value: 500 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.products-section' },
              { type: 'element-exists', selector: '.product-item[data-product-id="prod-1"]' },
              { type: 'element-contains', selector: '.product-name', expected: 'Wireless Headphones' },
              { type: 'element-contains', selector: '.cart-summary', expected: 'Cart: 0 items' }
            ]
          },

          {
            name: 'Add First Product to Cart',
            description: 'Add wireless headphones to cart',
            actions: [
              { type: 'click', target: '.add-to-cart[data-product-id="prod-1"]' },
              { type: 'wait', value: 300 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.cart-summary', expected: 'Cart: 1 items' }
            ]
          },

          {
            name: 'Add Second Product to Cart',
            description: 'Add smart watch to cart',
            actions: [
              { type: 'click', target: '.add-to-cart[data-product-id="prod-2"]' },
              { type: 'wait', value: 300 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.cart-summary', expected: 'Cart: 2 items' }
            ]
          },

          {
            name: 'Proceed to Checkout',
            description: 'Navigate to checkout section',
            actions: [
              { type: 'click', target: '.cart-checkout-btn' },
              { type: 'wait', value: 500 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.checkout-title', expected: 'Checkout' },
              { type: 'element-exists', selector: '.shipping-form-section' }
            ]
          },

          {
            name: 'Fill Shipping Information',
            description: 'Complete shipping form with user details',
            actions: [
              { type: 'input', target: '.shipping-firstname', value: mockUser.firstName },
              { type: 'input', target: '.shipping-lastname', value: mockUser.lastName },
              { type: 'input', target: '.shipping-email', value: mockUser.email },
              { type: 'input', target: '.shipping-phone', value: mockUser.phone },
              { type: 'input', target: '.shipping-address', value: mockUser.address },
              { type: 'input', target: '.shipping-city', value: mockUser.city },
              { type: 'input', target: '.shipping-state', value: mockUser.state },
              { type: 'input', target: '.shipping-zip', value: mockUser.zip },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const firstNameInput = document.querySelector('.shipping-firstname') as HTMLInputElement
                return firstNameInput?.value === 'John'
              }},
              { type: 'custom', customAssertion: () => {
                const emailInput = document.querySelector('.shipping-email') as HTMLInputElement
                return emailInput?.value === 'john.doe@example.com'
              }}
            ]
          },

          {
            name: 'Continue to Payment',
            description: 'Navigate to payment form',
            actions: [
              { type: 'click', target: '.continue-to-payment' },
              { type: 'wait', value: 500 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.payment-form-section' },
              { type: 'element-exists', selector: '.payment-cardnumber' }
            ]
          },

          {
            name: 'Fill Payment Information',
            description: 'Complete payment form',
            actions: [
              { type: 'input', target: '.payment-cardnumber', value: mockUser.cardNumber },
              { type: 'input', target: '.payment-expiry', value: mockUser.cardExpiry },
              { type: 'input', target: '.payment-cvv', value: mockUser.cardCVV },
              { type: 'input', target: '.payment-name', value: `${mockUser.firstName} ${mockUser.lastName}` },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const cardNumberInput = document.querySelector('.payment-cardnumber') as HTMLInputElement
                return cardNumberInput?.value === '4111111111111111'
              }},
              { type: 'custom', customAssertion: () => {
                const expiryInput = document.querySelector('.payment-expiry') as HTMLInputElement
                return expiryInput?.value === '12/25'
              }}
            ]
          },

          {
            name: 'Place Order',
            description: 'Complete the purchase',
            actions: [
              { type: 'click', target: '.place-order' },
              { type: 'wait', value: 1000 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.confirmation-title', expected: 'Order Confirmed!' },
              { type: 'element-contains', selector: '.confirmation-message', expected: 'Thank you for your order' },
              { type: 'element-exists', selector: '.order-id' }
            ]
          }
        ],

        successCriteria: [
          'Products load and display correctly',
          'Cart functionality works (add items, update count)',
          'Navigation between checkout steps works',
          'Form validation functions properly', 
          'Payment processing completes successfully',
          'Order confirmation displays with order ID',
          'Full purchase flow completes without errors'
        ]
      }

      const result = await tester.executeScenario(completeCheckoutScenario)

      // Debug logging
      console.log('E-commerce Checkout Test Result:', {
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
      expect(result.duration).toBeLessThan(15000)
    }, 20000)

    it('should handle cart management edge cases', async () => {
      const cartEdgeCasesScenario: RealWorldScenario = {
        name: 'Cart Management Edge Cases',
        description: 'Test cart functionality with edge cases like multiple additions, empty cart checkout attempts',
        tags: ['ecommerce', 'cart', 'edge-cases'],
        estimatedDuration: 8000,

        setup: async () => {
          // Reuse similar setup but focused on cart functionality
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="cart-test-app">
              <div class="product-list">
                ${mockProducts.map(product => `
                  <div class="product-item" data-product-id="${product.id}">
                    <h3>${product.name}</h3>
                    <p>$${product.price}</p>
                    <button class="add-to-cart" data-product-id="${product.id}">Add to Cart</button>
                  </div>
                `).join('')}
              </div>
              <div class="cart-summary">Cart: 0 items</div>
              <button class="cart-checkout-btn" disabled>Checkout</button>
              <div class="error-message" style="display: none;"></div>
            </div>
          `

          let cartCount = 0
          const cartSummary = testRoot.querySelector('.cart-summary')!
          const checkoutBtn = testRoot.querySelector('.cart-checkout-btn') as HTMLButtonElement
          const errorMessage = testRoot.querySelector('.error-message')!

          // Simple cart functionality
          testRoot.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', () => {
              cartCount++
              cartSummary.textContent = `Cart: ${cartCount} items`
              checkoutBtn.disabled = cartCount === 0
            })
          })

          // Empty cart checkout handling
          checkoutBtn.addEventListener('click', () => {
            if (cartCount === 0) {
              errorMessage.textContent = 'Cart is empty. Please add items before checkout.'
              errorMessage.style.display = 'block'
            } else {
              errorMessage.style.display = 'none'
              alert('Proceeding to checkout...')
            }
          })
        },

        steps: [
          {
            name: 'Try Empty Cart Checkout',
            description: 'Attempt to checkout with empty cart',
            actions: [
              { type: 'click', target: '.cart-checkout-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              // Button should be disabled, so no error message should appear
              { type: 'element-contains', selector: '.cart-summary', expected: 'Cart: 0 items' }
            ]
          },

          {
            name: 'Add Multiple Same Items',
            description: 'Add same product multiple times',
            actions: [
              { type: 'click', target: '.add-to-cart[data-product-id="prod-1"]' },
              { type: 'wait', value: 100 },
              { type: 'click', target: '.add-to-cart[data-product-id="prod-1"]' },
              { type: 'wait', value: 100 },
              { type: 'click', target: '.add-to-cart[data-product-id="prod-1"]' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.cart-summary', expected: 'Cart: 3 items' }
            ]
          },

          {
            name: 'Verify Checkout Enabled',
            description: 'Verify checkout button is now enabled',
            actions: [
              { type: 'wait', value: 100 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.cart-checkout-btn:not([disabled])' }
            ]
          }
        ],

        successCriteria: [
          'Empty cart checkout is prevented',
          'Multiple item additions work correctly',
          'Checkout button state updates properly'
        ]
      }

      const result = await tester.executeScenario(cartEdgeCasesScenario)

      console.log('Cart Edge Cases Test Result:', {
        success: result.success,
        completedSteps: result.completedSteps,
        totalSteps: result.totalSteps,
        errors: result.errors.map(e => ({ step: e.step, message: e.error.message }))
      })

      expect(result.success).toBe(true)
      expect(result.completedSteps).toBe(3)
      expect(result.errors).toHaveLength(0)
    }, 12000)
  })

  describe('Error Handling', () => {
    it('should handle form validation errors gracefully', async () => {
      const formValidationScenario: RealWorldScenario = {
        name: 'Form Validation Error Handling',
        description: 'Test form validation and error recovery',
        tags: ['forms', 'validation', 'errors'],
        estimatedDuration: 6000,

        setup: async () => {
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="validation-test-app">
              <form class="test-form">
                <input type="email" name="email" placeholder="Email" class="email-input" required />
                <input type="tel" name="phone" placeholder="Phone" class="phone-input" required />
                <button type="button" class="submit-btn">Submit</button>
                <div class="validation-errors" style="display: none;"></div>
              </form>
            </div>
          `

          const form = testRoot.querySelector('.test-form')!
          const errorsDiv = testRoot.querySelector('.validation-errors')!
          const submitBtn = testRoot.querySelector('.submit-btn')!

          submitBtn.addEventListener('click', () => {
            const emailInput = form.querySelector('.email-input') as HTMLInputElement
            const phoneInput = form.querySelector('.phone-input') as HTMLInputElement
            
            const errors: string[] = []
            
            if (!emailInput.value) {
              errors.push('Email is required')
            } else if (!emailInput.value.includes('@')) {
              errors.push('Email format is invalid')
            }
            
            if (!phoneInput.value) {
              errors.push('Phone is required')
            }

            if (errors.length > 0) {
              errorsDiv.innerHTML = errors.map(error => `<p class="error">${error}</p>`).join('')
              errorsDiv.style.display = 'block'
            } else {
              errorsDiv.style.display = 'none'
              errorsDiv.innerHTML = '<p class="success">Form submitted successfully!</p>'
              errorsDiv.style.display = 'block'
            }
          })
        },

        steps: [
          {
            name: 'Submit Empty Form',
            description: 'Try to submit form without any data',
            actions: [
              { type: 'click', target: '.submit-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.validation-errors', expected: 'Email is required' },
              { type: 'element-contains', selector: '.validation-errors', expected: 'Phone is required' }
            ]
          },

          {
            name: 'Submit Invalid Email',
            description: 'Submit form with invalid email format',
            actions: [
              { type: 'input', target: '.email-input', value: 'invalid-email' },
              { type: 'input', target: '.phone-input', value: '555-1234' },
              { type: 'click', target: '.submit-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.validation-errors', expected: 'Email format is invalid' }
            ]
          },

          {
            name: 'Submit Valid Data',
            description: 'Submit form with valid data',
            actions: [
              { type: 'input', target: '.email-input', value: 'test@example.com' },
              { type: 'click', target: '.submit-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.validation-errors', expected: 'Form submitted successfully!' }
            ]
          }
        ],

        successCriteria: [
          'Form validation catches empty fields',
          'Email format validation works',
          'Valid data submission succeeds',
          'Error messages display correctly'
        ]
      }

      const result = await tester.executeScenario(formValidationScenario)

      console.log('Form Validation Test Result:', {
        success: result.success,
        completedSteps: result.completedSteps,
        errors: result.errors.map(e => ({ step: e.step, message: e.error.message }))
      })

      expect(result.success).toBe(true)
      expect(result.completedSteps).toBe(3)
      expect(result.errors).toHaveLength(0)
    }, 10000)
  })
})
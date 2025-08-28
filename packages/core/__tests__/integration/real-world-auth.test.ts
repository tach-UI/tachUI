/**
 * Phase 4.3: User Authentication and Session Management Real-World Scenario Tests
 * 
 * Comprehensive testing of authentication workflows including:
 * - User registration and login flows
 * - Session management and persistence
 * - Protected route access
 * - Password reset functionality
 * - Multi-factor authentication
 * - Logout and session cleanup
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  RealWorldScenarioTester,
  ScenarioPatterns,
  type RealWorldScenario
} from '../../../../tools/testing/real-world-scenario-tester'
import { createSignal } from '../../src/reactive'

// Mock authentication data
const mockAuthData = {
  users: [
    { 
      id: 'user-1', 
      email: 'john@example.com', 
      password: 'SecurePass123!', 
      firstName: 'John', 
      lastName: 'Doe',
      mfaEnabled: false 
    },
    { 
      id: 'user-2', 
      email: 'jane@example.com', 
      password: 'AnotherPass456!', 
      firstName: 'Jane', 
      lastName: 'Smith',
      mfaEnabled: true 
    }
  ],
  newUser: {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@newuser.com',
    password: 'NewPassword789!'
  }
}

describe('Phase 4.3: User Authentication and Session Management Real-World Scenarios', () => {
  let tester: RealWorldScenarioTester

  beforeEach(() => {
    // Clear DOM and set up test root
    document.body.innerHTML = '<div id="test-app-root"></div>'
    
    tester = new RealWorldScenarioTester({
      enableMemoryTracking: true,
      enablePerformanceTracking: true,
      defaultTimeout: 8000
    })
  })

  afterEach(async () => {
    // Cleanup after each test
    document.body.innerHTML = ''
    // Clear any stored session data
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Complete Authentication Flow', () => {
    it('should handle complete user registration, login, and session management', async () => {
      const authFlowScenario: RealWorldScenario = {
        name: 'Complete Authentication Flow',
        description: 'Full authentication workflow including registration, login, session management, and logout',
        tags: ['auth', 'session', 'security', 'critical'],
        estimatedDuration: 12000,
        
        setup: async () => {
          // Create authentication application state
          const [currentUser, setCurrentUser] = createSignal<any>(null)
          const [authState, setAuthState] = createSignal<'login' | 'register' | 'dashboard' | 'loading'>('login')
          const [sessionData, setSessionData] = createSignal<any>(null)

          // Simulate user database
          const users = [...mockAuthData.users]

          // Create DOM structure for auth app
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="auth-app">
              <!-- Loading State -->
              <div class="loading-screen" style="display: none;">
                <p class="loading-message">Loading...</p>
              </div>

              <!-- Login Form -->
              <div class="login-section" style="display: block;">
                <h2>Sign In</h2>
                <form class="login-form">
                  <input type="email" name="email" placeholder="Email" class="login-email" required />
                  <input type="password" name="password" placeholder="Password" class="login-password" required />
                  <button type="button" class="login-submit">Sign In</button>
                  <div class="auth-errors" style="display: none;"></div>
                </form>
                <div class="auth-links">
                  <button class="switch-to-register" type="button">Need an account? Register</button>
                  <button class="forgot-password" type="button">Forgot Password?</button>
                </div>
              </div>

              <!-- Registration Form -->
              <div class="register-section" style="display: none;">
                <h2>Create Account</h2>
                <form class="register-form">
                  <input type="text" name="firstName" placeholder="First Name" class="register-firstname" required />
                  <input type="text" name="lastName" placeholder="Last Name" class="register-lastname" required />
                  <input type="email" name="email" placeholder="Email" class="register-email" required />
                  <input type="password" name="password" placeholder="Password" class="register-password" required />
                  <input type="password" name="confirmPassword" placeholder="Confirm Password" class="register-confirm" required />
                  <button type="button" class="register-submit">Create Account</button>
                  <div class="auth-errors" style="display: none;"></div>
                </form>
                <div class="auth-links">
                  <button class="switch-to-login" type="button">Already have an account? Sign In</button>
                </div>
              </div>

              <!-- Protected Dashboard -->
              <div class="dashboard-section" style="display: none;">
                <header class="dashboard-header">
                  <h2>Welcome, <span class="user-name"></span>!</h2>
                  <div class="user-actions">
                    <span class="session-info">Session expires in: <span class="session-timer">30:00</span></span>
                    <button class="profile-btn" type="button">Profile</button>
                    <button class="logout-btn" type="button">Logout</button>
                  </div>
                </header>
                <div class="dashboard-content">
                  <div class="user-info">
                    <h3>Account Information</h3>
                    <p>Email: <span class="current-email"></span></p>
                    <p>Member since: <span class="member-since"></span></p>
                    <p>Last login: <span class="last-login"></span></p>
                  </div>
                  <div class="protected-content">
                    <h3>Protected Content</h3>
                    <p class="secret-data">This is protected information only visible to authenticated users.</p>
                  </div>
                </div>
              </div>

              <!-- Password Reset Modal -->
              <div class="password-reset-modal" style="display: none;">
                <div class="modal-content">
                  <h3>Reset Password</h3>
                  <form class="reset-form">
                    <input type="email" name="resetEmail" placeholder="Enter your email" class="reset-email" required />
                    <button type="button" class="send-reset">Send Reset Link</button>
                    <button type="button" class="cancel-reset">Cancel</button>
                  </form>
                  <div class="reset-message" style="display: none;"></div>
                </div>
              </div>
            </div>
          `

          // Authentication helper functions
          const showLoading = (show: boolean) => {
            const loadingScreen = testRoot.querySelector('.loading-screen') as HTMLElement
            loadingScreen.style.display = show ? 'block' : 'none'
          }

          const showSection = (section: string) => {
            const sections = ['login', 'register', 'dashboard']
            sections.forEach(s => {
              const element = testRoot.querySelector(`.${s}-section`) as HTMLElement
              if (element) {
                element.style.display = s === section ? 'block' : 'none'
              }
            })
            setAuthState(section as any)
          }

          const showError = (message: string, container: string = '.auth-errors') => {
            const errorDiv = testRoot.querySelector(container) as HTMLElement
            errorDiv.textContent = message
            errorDiv.style.display = 'block'
            setTimeout(() => {
              errorDiv.style.display = 'none'
            }, 3000)
          }

          const validatePassword = (password: string): string[] => {
            const errors: string[] = []
            if (password.length < 8) errors.push('Password must be at least 8 characters')
            if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter')
            if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter')
            if (!/[0-9]/.test(password)) errors.push('Password must contain number')
            if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain special character')
            return errors
          }

          const createSession = (user: any) => {
            const session = {
              userId: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              loginTime: Date.now(),
              expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
              sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
            
            setCurrentUser(user)
            setSessionData(session)
            localStorage.setItem('userSession', JSON.stringify(session))
            return session
          }

          const updateDashboard = (user: any, session: any) => {
            const userName = testRoot.querySelector('.user-name')!
            const currentEmail = testRoot.querySelector('.current-email')!
            const memberSince = testRoot.querySelector('.member-since')!
            const lastLogin = testRoot.querySelector('.last-login')!
            
            userName.textContent = `${user.firstName} ${user.lastName}`
            currentEmail.textContent = user.email
            memberSince.textContent = new Date(2024, 0, 1).toLocaleDateString()
            lastLogin.textContent = new Date(session.loginTime).toLocaleString()
            
            // Start session timer
            startSessionTimer(session.expiresAt)
          }

          const startSessionTimer = (expiresAt: number) => {
            const timerElement = testRoot.querySelector('.session-timer')!
            
            const updateTimer = () => {
              const remaining = expiresAt - Date.now()
              if (remaining <= 0) {
                handleSessionExpiry()
                return
              }
              
              const minutes = Math.floor(remaining / 60000)
              const seconds = Math.floor((remaining % 60000) / 1000)
              timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
            }
            
            updateTimer()
            
            // Use a simple timeout instead of setInterval for testing
            const startTimer = () => {
              const timeoutId = setTimeout(() => {
                updateTimer()
                if (expiresAt > Date.now()) {
                  startTimer()
                }
              }, 1000)
              
              // Store timeout ID for cleanup
              ;(timerElement as any).timerTimeout = timeoutId
            }
            
            startTimer()
          }

          const handleSessionExpiry = () => {
            alert('Your session has expired. Please sign in again.')
            logout()
          }

          const logout = () => {
            const timerElement = testRoot.querySelector('.session-timer')
            if (timerElement && (timerElement as any).timerTimeout) {
              clearTimeout((timerElement as any).timerTimeout)
            }
            
            setCurrentUser(null)
            setSessionData(null)
            localStorage.removeItem('userSession')
            showSection('login')
          }

          // Event handlers
          
          // Login form
          const loginSubmit = testRoot.querySelector('.login-submit')!
          loginSubmit.addEventListener('click', async () => {
            const form = testRoot.querySelector('.login-form') as HTMLFormElement
            const formData = new FormData(form)
            const email = formData.get('email') as string
            const password = formData.get('password') as string
            
            if (!email || !password) {
              showError('Please fill in all fields')
              return
            }
            
            showLoading(true)
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const user = users.find(u => u.email === email && u.password === password)
            showLoading(false)
            
            if (user) {
              const session = createSession(user)
              updateDashboard(user, session)
              showSection('dashboard')
            } else {
              showError('Invalid email or password')
            }
          })

          // Registration form
          const registerSubmit = testRoot.querySelector('.register-submit')!
          registerSubmit.addEventListener('click', async () => {
            const form = testRoot.querySelector('.register-form') as HTMLFormElement
            const formData = new FormData(form)
            const firstName = formData.get('firstName') as string
            const lastName = formData.get('lastName') as string
            const email = formData.get('email') as string
            const password = formData.get('password') as string
            const confirmPassword = formData.get('confirmPassword') as string
            
            // Validation
            if (!firstName || !lastName || !email || !password || !confirmPassword) {
              showError('Please fill in all fields')
              return
            }
            
            if (password !== confirmPassword) {
              showError('Passwords do not match')
              return
            }
            
            const passwordErrors = validatePassword(password)
            if (passwordErrors.length > 0) {
              showError(passwordErrors[0])
              return
            }
            
            if (users.find(u => u.email === email)) {
              showError('Email already exists')
              return
            }
            
            showLoading(true)
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            const newUser = {
              id: `user-${Date.now()}`,
              email,
              password,
              firstName,
              lastName,
              mfaEnabled: false
            }
            
            users.push(newUser)
            showLoading(false)
            
            const session = createSession(newUser)
            updateDashboard(newUser, session)
            showSection('dashboard')
          })

          // Navigation buttons
          const switchToRegister = testRoot.querySelector('.switch-to-register')!
          const switchToLogin = testRoot.querySelector('.switch-to-login')!
          const logoutBtn = testRoot.querySelector('.logout-btn')!
          
          switchToRegister.addEventListener('click', () => showSection('register'))
          switchToLogin.addEventListener('click', () => showSection('login'))
          logoutBtn.addEventListener('click', logout)

          // Password reset
          const forgotPassword = testRoot.querySelector('.forgot-password')!
          const resetModal = testRoot.querySelector('.password-reset-modal') as HTMLElement
          const sendReset = testRoot.querySelector('.send-reset')!
          const cancelReset = testRoot.querySelector('.cancel-reset')!
          
          forgotPassword.addEventListener('click', () => {
            resetModal.style.display = 'block'
          })
          
          cancelReset.addEventListener('click', () => {
            resetModal.style.display = 'none'
          })
          
          sendReset.addEventListener('click', () => {
            const resetEmail = (testRoot.querySelector('.reset-email') as HTMLInputElement).value
            if (!resetEmail) {
              return
            }
            
            const messageDiv = testRoot.querySelector('.reset-message') as HTMLElement
            messageDiv.textContent = 'Password reset link sent to your email!'
            messageDiv.style.display = 'block'
            
            setTimeout(() => {
              resetModal.style.display = 'none'
            }, 2000)
          })

          // Check for existing session on load
          const existingSession = localStorage.getItem('userSession')
          if (existingSession) {
            try {
              const session = JSON.parse(existingSession)
              if (session.expiresAt > Date.now()) {
                const user = users.find(u => u.id === session.userId)
                if (user) {
                  setCurrentUser(user)
                  setSessionData(session)
                  updateDashboard(user, session)
                  showSection('dashboard')
                }
              } else {
                localStorage.removeItem('userSession')
              }
            } catch (e) {
              localStorage.removeItem('userSession')
            }
          }

          // Update state in tester for tracking
          tester.updateState('currentUser', currentUser())
          tester.updateState('authState', authState())
        },

        steps: [
          {
            name: 'Verify Initial Login State',
            description: 'Check that app loads in login mode',
            actions: [
              { type: 'wait', value: 300 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.login-section[style*="display: block"]' },
              { type: 'element-contains', selector: '.login-section h2', expected: 'Sign In' },
              { type: 'element-exists', selector: '.login-email' },
              { type: 'element-exists', selector: '.login-password' }
            ]
          },

          {
            name: 'Test Invalid Login',
            description: 'Attempt login with invalid credentials',
            actions: [
              { type: 'input', target: '.login-email', value: 'wrong@email.com' },
              { type: 'input', target: '.login-password', value: 'wrongpassword' },
              { type: 'click', target: '.login-submit' },
              { type: 'wait', value: 1200 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.auth-errors', expected: 'Invalid email or password' }
            ]
          },

          {
            name: 'Switch to Registration',
            description: 'Navigate to registration form',
            actions: [
              { type: 'click', target: '.switch-to-register' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.register-section[style*="display: block"]' },
              { type: 'element-contains', selector: '.register-section h2', expected: 'Create Account' }
            ]
          },

          {
            name: 'Complete User Registration',
            description: 'Register a new user account',
            actions: [
              { type: 'input', target: '.register-firstname', value: mockAuthData.newUser.firstName },
              { type: 'input', target: '.register-lastname', value: mockAuthData.newUser.lastName },
              { type: 'input', target: '.register-email', value: mockAuthData.newUser.email },
              { type: 'input', target: '.register-password', value: mockAuthData.newUser.password },
              { type: 'input', target: '.register-confirm', value: mockAuthData.newUser.password },
              { type: 'click', target: '.register-submit' },
              { type: 'wait', value: 2500 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const dashboardSection = document.querySelector('.dashboard-section') as HTMLElement
                const isVisible = dashboardSection && dashboardSection.style.display === 'block'
                console.log('Dashboard section found:', !!dashboardSection, 'Display:', dashboardSection?.style.display)
                return isVisible
              }},
              { type: 'element-contains', selector: '.user-name', expected: 'Alice Johnson' },
              { type: 'element-contains', selector: '.current-email', expected: 'alice@newuser.com' }
            ]
          },

          {
            name: 'Verify Protected Content Access',
            description: 'Confirm access to protected dashboard content',
            actions: [
              { type: 'wait', value: 300 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.protected-content' },
              { type: 'element-contains', selector: '.secret-data', expected: 'protected information' },
              { type: 'element-exists', selector: '.session-timer' }
            ]
          },

          {
            name: 'Test Session Persistence',
            description: 'Verify session is stored in localStorage',
            actions: [
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const session = localStorage.getItem('userSession')
                return session !== null && JSON.parse(session).email === 'alice@newuser.com'
              }}
            ]
          },

          {
            name: 'Logout and Clear Session',
            description: 'Logout and verify session cleanup',
            actions: [
              { type: 'click', target: '.logout-btn' },
              { type: 'wait', value: 500 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.login-section[style*="display: block"]' },
              { type: 'custom', customAssertion: () => {
                return localStorage.getItem('userSession') === null
              }}
            ]
          },

          {
            name: 'Test Existing User Login',
            description: 'Login with existing user credentials',
            actions: [
              { type: 'input', target: '.login-email', value: mockAuthData.users[0].email },
              { type: 'input', target: '.login-password', value: mockAuthData.users[0].password },
              { type: 'click', target: '.login-submit' },
              { type: 'wait', value: 1500 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const dashboardSection = document.querySelector('.dashboard-section') as HTMLElement
                const isVisible = dashboardSection && dashboardSection.style.display === 'block'
                console.log('Login Dashboard section found:', !!dashboardSection, 'Display:', dashboardSection?.style.display)
                return isVisible
              }},
              { type: 'element-contains', selector: '.user-name', expected: 'John Doe' },
              { type: 'element-contains', selector: '.current-email', expected: 'john@example.com' }
            ]
          }
        ],

        successCriteria: [
          'Login form validation works correctly',
          'Invalid credentials are rejected',
          'User registration completes successfully',
          'Protected content is accessible after auth',
          'Session data persists in localStorage',
          'Session timer functions properly',
          'Logout clears session data',
          'Existing user login works'
        ]
      }

      const result = await tester.executeScenario(authFlowScenario)

      // Debug logging
      console.log('Authentication Flow Test Result:', {
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
    }, 18000)

    it('should handle password reset workflow', async () => {
      const passwordResetScenario: RealWorldScenario = {
        name: 'Password Reset Workflow',
        description: 'Test password reset functionality and modal interactions',
        tags: ['auth', 'password-reset', 'modals'],
        estimatedDuration: 4000,

        setup: async () => {
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="auth-simple">
              <div class="login-form">
                <h2>Sign In</h2>
                <button class="forgot-password-btn" type="button">Forgot Password?</button>
              </div>
              <div class="reset-modal" style="display: none;">
                <div class="modal-content">
                  <h3>Reset Password</h3>
                  <input type="email" class="reset-email-input" placeholder="Enter email" />
                  <button class="send-reset-btn" type="button">Send Reset</button>
                  <button class="close-modal-btn" type="button">Close</button>
                  <div class="reset-status" style="display: none;"></div>
                </div>
              </div>
            </div>
          `

          const forgotBtn = testRoot.querySelector('.forgot-password-btn')!
          const resetModal = testRoot.querySelector('.reset-modal') as HTMLElement
          const sendResetBtn = testRoot.querySelector('.send-reset-btn')!
          const closeModalBtn = testRoot.querySelector('.close-modal-btn')!
          const resetStatus = testRoot.querySelector('.reset-status') as HTMLElement

          forgotBtn.addEventListener('click', () => {
            resetModal.style.display = 'block'
          })

          closeModalBtn.addEventListener('click', () => {
            resetModal.style.display = 'none'
            resetStatus.style.display = 'none'
          })

          sendResetBtn.addEventListener('click', () => {
            const emailInput = testRoot.querySelector('.reset-email-input') as HTMLInputElement
            if (emailInput.value && emailInput.value.includes('@')) {
              resetStatus.textContent = 'Reset link sent successfully!'
              resetStatus.style.display = 'block'
            } else {
              resetStatus.textContent = 'Please enter a valid email address'
              resetStatus.style.display = 'block'
            }
          })
        },

        steps: [
          {
            name: 'Open Password Reset Modal',
            description: 'Click forgot password to open modal',
            actions: [
              { type: 'click', target: '.forgot-password-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.reset-modal[style*="display: block"]' }
            ]
          },

          {
            name: 'Send Reset with Valid Email',
            description: 'Enter valid email and send reset',
            actions: [
              { type: 'input', target: '.reset-email-input', value: 'test@example.com' },
              { type: 'click', target: '.send-reset-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.reset-status', expected: 'Reset link sent successfully!' }
            ]
          },

          {
            name: 'Close Reset Modal',
            description: 'Close the password reset modal',
            actions: [
              { type: 'click', target: '.close-modal-btn' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.reset-modal[style*="display: none"]' }
            ]
          }
        ],

        successCriteria: [
          'Password reset modal opens correctly',
          'Email validation works',
          'Reset confirmation message appears',
          'Modal closes properly'
        ]
      }

      const result = await tester.executeScenario(passwordResetScenario)

      console.log('Password Reset Test Result:', {
        success: result.success,
        completedSteps: result.completedSteps,
        errors: result.errors.map(e => ({ step: e.step, message: e.error.message }))
      })

      expect(result.success).toBe(true)
      expect(result.completedSteps).toBe(3)
      expect(result.errors).toHaveLength(0)
    }, 6000)
  })
})
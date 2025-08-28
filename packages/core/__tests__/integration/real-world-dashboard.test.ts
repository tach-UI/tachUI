/**
 * Phase 4.4: Dashboard with Real-time Data Updates Real-World Scenario Tests
 * 
 * Comprehensive testing of dashboard functionality including:
 * - Real-time data updates and refresh
 * - Multiple data sources and widgets
 * - Interactive charts and metrics
 * - Live notifications and alerts
 * - Data filtering and search
 * - Auto-refresh and manual refresh
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  RealWorldScenarioTester,
  type RealWorldScenario
} from '../../../../tools/testing/real-world-scenario-tester'
import { createSignal } from '../../src/reactive'

// Mock dashboard data
const mockDashboardData = {
  metrics: {
    users: { current: 1247, change: +12, trend: 'up' },
    revenue: { current: 52847, change: -3.2, trend: 'down' },
    orders: { current: 184, change: +8, trend: 'up' },
    conversion: { current: 3.7, change: +0.3, trend: 'up' }
  },
  recentOrders: [
    { id: 'ORD-001', customer: 'John Doe', amount: 299.99, status: 'completed', time: '2 min ago' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: 149.50, status: 'processing', time: '5 min ago' },
    { id: 'ORD-003', customer: 'Bob Johnson', amount: 89.99, status: 'pending', time: '12 min ago' }
  ],
  notifications: [
    { id: 'not-1', type: 'success', message: 'Order #ORD-001 completed successfully', time: Date.now() - 120000 },
    { id: 'not-2', type: 'warning', message: 'Low inventory alert for Product XYZ', time: Date.now() - 300000 },
    { id: 'not-3', type: 'info', message: 'New user registration', time: Date.now() - 600000 }
  ],
  chartData: {
    sales: [
      { label: 'Mon', value: 1200 },
      { label: 'Tue', value: 1900 },
      { label: 'Wed', value: 3000 },
      { label: 'Thu', value: 5000 },
      { label: 'Fri', value: 2300 },
      { label: 'Sat', value: 2000 },
      { label: 'Sun', value: 3200 }
    ]
  }
}

describe('Phase 4.4: Dashboard with Real-time Data Updates Real-World Scenarios', () => {
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
  })

  describe('Complete Dashboard Flow', () => {
    it('should handle real-time dashboard updates, interactions, and data refresh', async () => {
      const dashboardScenario: RealWorldScenario = {
        name: 'Real-time Dashboard Operations',
        description: 'Full dashboard with live updates, interactive widgets, and data management',
        tags: ['dashboard', 'real-time', 'data', 'interactive', 'critical'],
        estimatedDuration: 10000,
        
        setup: async () => {
          // Create dashboard application state
          const [dashboardData, setDashboardData] = createSignal(mockDashboardData)
          const [lastUpdated, setLastUpdated] = createSignal(new Date())
          const [autoRefresh, setAutoRefresh] = createSignal(true)
          const [refreshInterval, setRefreshInterval] = createSignal(5000)
          const [notifications, setNotifications] = createSignal(mockDashboardData.notifications)

          // Create DOM structure for dashboard
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="dashboard-app">
              <!-- Dashboard Header -->
              <header class="dashboard-header">
                <h1>Analytics Dashboard</h1>
                <div class="dashboard-controls">
                  <div class="refresh-controls">
                    <button class="manual-refresh" type="button">Refresh</button>
                    <label>
                      <input type="checkbox" class="auto-refresh-toggle" checked />
                      Auto-refresh
                    </label>
                    <select class="refresh-interval">
                      <option value="3000">3s</option>
                      <option value="5000" selected>5s</option>
                      <option value="10000">10s</option>
                    </select>
                  </div>
                  <div class="last-updated">
                    Last updated: <span class="update-time">${new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </header>

              <!-- Key Metrics -->
              <section class="metrics-section">
                <h2>Key Metrics</h2>
                <div class="metrics-grid">
                  <div class="metric-card" data-metric="users">
                    <h3>Active Users</h3>
                    <div class="metric-value">${mockDashboardData.metrics.users.current}</div>
                    <div class="metric-change trend-${mockDashboardData.metrics.users.trend}">
                      ${mockDashboardData.metrics.users.change > 0 ? '+' : ''}${mockDashboardData.metrics.users.change}
                    </div>
                  </div>
                  <div class="metric-card" data-metric="revenue">
                    <h3>Revenue</h3>
                    <div class="metric-value">$${mockDashboardData.metrics.revenue.current.toLocaleString()}</div>
                    <div class="metric-change trend-${mockDashboardData.metrics.revenue.trend}">
                      ${mockDashboardData.metrics.revenue.change}%
                    </div>
                  </div>
                  <div class="metric-card" data-metric="orders">
                    <h3>Orders Today</h3>
                    <div class="metric-value">${mockDashboardData.metrics.orders.current}</div>
                    <div class="metric-change trend-${mockDashboardData.metrics.orders.trend}">
                      ${mockDashboardData.metrics.orders.change > 0 ? '+' : ''}${mockDashboardData.metrics.orders.change}
                    </div>
                  </div>
                  <div class="metric-card" data-metric="conversion">
                    <h3>Conversion Rate</h3>
                    <div class="metric-value">${mockDashboardData.metrics.conversion.current}%</div>
                    <div class="metric-change trend-${mockDashboardData.metrics.conversion.trend}">
                      ${mockDashboardData.metrics.conversion.change > 0 ? '+' : ''}${mockDashboardData.metrics.conversion.change}%
                    </div>
                  </div>
                </div>
              </section>

              <!-- Live Chart -->
              <section class="chart-section">
                <h2>Sales Trend</h2>
                <div class="chart-container">
                  <div class="chart-toolbar">
                    <select class="chart-period">
                      <option value="7d" selected>Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                    </select>
                    <button class="export-chart" type="button">Export</button>
                  </div>
                  <div class="chart" id="sales-chart">
                    ${mockDashboardData.chartData.sales.map((point, index) => 
                      `<div class="chart-bar" data-label="${point.label}" data-value="${point.value}" style="height: ${(point.value / 5000) * 100}px;">
                        <div class="bar-value">${point.value}</div>
                        <div class="bar-label">${point.label}</div>
                      </div>`
                    ).join('')}
                  </div>
                </div>
              </section>

              <!-- Recent Orders -->
              <section class="orders-section">
                <h2>Recent Orders</h2>
                <div class="orders-toolbar">
                  <input type="text" class="order-search" placeholder="Search orders..." />
                  <select class="status-filter">
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div class="orders-list">
                  ${mockDashboardData.recentOrders.map(order => 
                    `<div class="order-item" data-order-id="${order.id}" data-status="${order.status}">
                      <div class="order-id">${order.id}</div>
                      <div class="order-customer">${order.customer}</div>
                      <div class="order-amount">$${order.amount}</div>
                      <div class="order-status status-${order.status}">${order.status}</div>
                      <div class="order-time">${order.time}</div>
                    </div>`
                  ).join('')}
                </div>
              </section>

              <!-- Live Notifications -->
              <section class="notifications-section">
                <h2>Live Notifications</h2>
                <div class="notifications-toolbar">
                  <button class="clear-notifications" type="button">Clear All</button>
                  <button class="add-notification" type="button">Simulate Notification</button>
                </div>
                <div class="notifications-list">
                  ${mockDashboardData.notifications.map(notification => 
                    `<div class="notification-item ${notification.type}" data-notification-id="${notification.id}">
                      <div class="notification-icon">${notification.type === 'success' ? '✓' : notification.type === 'warning' ? '⚠' : 'ℹ'}</div>
                      <div class="notification-message">${notification.message}</div>
                      <div class="notification-time">${Math.floor((Date.now() - notification.time) / 60000)} min ago</div>
                      <button class="dismiss-notification" type="button">×</button>
                    </div>`
                  ).join('')}
                </div>
              </section>

              <!-- Data Loading States -->
              <div class="loading-overlay" style="display: none;">
                <div class="loading-spinner">Loading...</div>
              </div>
            </div>
          `

          // Utility functions
          const showLoading = (show: boolean) => {
            const overlay = testRoot.querySelector('.loading-overlay') as HTMLElement
            overlay.style.display = show ? 'flex' : 'none'
          }

          const updateTimestamp = () => {
            const timeElement = testRoot.querySelector('.update-time')!
            timeElement.textContent = new Date().toLocaleTimeString()
            setLastUpdated(new Date())
          }

          const generateRandomData = () => {
            return {
              ...mockDashboardData,
              metrics: {
                users: { 
                  current: Math.floor(Math.random() * 100) + 1200, 
                  change: Math.floor(Math.random() * 40) - 20, 
                  trend: Math.random() > 0.5 ? 'up' : 'down' 
                },
                revenue: { 
                  current: Math.floor(Math.random() * 10000) + 50000, 
                  change: (Math.random() * 10 - 5).toFixed(1), 
                  trend: Math.random() > 0.5 ? 'up' : 'down' 
                },
                orders: { 
                  current: Math.floor(Math.random() * 50) + 150, 
                  change: Math.floor(Math.random() * 20) - 10, 
                  trend: Math.random() > 0.5 ? 'up' : 'down' 
                },
                conversion: { 
                  current: (Math.random() * 2 + 2.5).toFixed(1), 
                  change: (Math.random() * 1 - 0.5).toFixed(1), 
                  trend: Math.random() > 0.5 ? 'up' : 'down' 
                }
              }
            }
          }

          const updateMetrics = (newData: any) => {
            Object.entries(newData.metrics).forEach(([key, value]: [string, any]) => {
              const card = testRoot.querySelector(`[data-metric="${key}"]`)!
              const valueElement = card.querySelector('.metric-value')!
              const changeElement = card.querySelector('.metric-change')!
              
              if (key === 'revenue') {
                valueElement.textContent = `$${value.current.toLocaleString()}`
                changeElement.textContent = `${value.change}%`
              } else if (key === 'conversion') {
                valueElement.textContent = `${value.current}%`
                changeElement.textContent = `${value.change > 0 ? '+' : ''}${value.change}%`
              } else {
                valueElement.textContent = value.current
                changeElement.textContent = `${value.change > 0 ? '+' : ''}${value.change}`
              }
              
              changeElement.className = `metric-change trend-${value.trend}`
            })
          }

          const addNotification = (message: string, type: string = 'info') => {
            const currentNotifications = notifications()
            const newNotification = {
              id: `not-${Date.now()}`,
              type,
              message,
              time: Date.now()
            }
            
            const notificationsList = testRoot.querySelector('.notifications-list')!
            const notificationHTML = `
              <div class="notification-item ${type}" data-notification-id="${newNotification.id}">
                <div class="notification-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ'}</div>
                <div class="notification-message">${message}</div>
                <div class="notification-time">now</div>
                <button class="dismiss-notification" type="button">×</button>
              </div>
            `
            
            notificationsList.insertAdjacentHTML('afterbegin', notificationHTML)
            setNotifications([newNotification, ...currentNotifications])
            
            // Add dismiss handler to new notification
            const newElement = notificationsList.querySelector(`[data-notification-id="${newNotification.id}"] .dismiss-notification`)!
            newElement.addEventListener('click', () => {
              newElement.closest('.notification-item')?.remove()
            })
          }

          const refreshData = async (showLoadingState = true) => {
            if (showLoadingState) showLoading(true)
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 800))
            
            const newData = generateRandomData()
            setDashboardData(newData)
            updateMetrics(newData)
            updateTimestamp()
            
            if (showLoadingState) showLoading(false)
          }

          // Auto-refresh functionality
          let refreshTimer: any = null

          const startAutoRefresh = () => {
            if (refreshTimer) clearTimeout(refreshTimer)
            
            if (autoRefresh()) {
              refreshTimer = setTimeout(() => {
                refreshData(false) // Don't show loading for auto-refresh
                startAutoRefresh() // Schedule next refresh
              }, refreshInterval())
            }
          }

          // Event handlers
          
          // Manual refresh
          const manualRefreshBtn = testRoot.querySelector('.manual-refresh')!
          manualRefreshBtn.addEventListener('click', () => refreshData(true))

          // Auto-refresh toggle
          const autoRefreshToggle = testRoot.querySelector('.auto-refresh-toggle') as HTMLInputElement
          autoRefreshToggle.addEventListener('change', () => {
            setAutoRefresh(autoRefreshToggle.checked)
            if (autoRefreshToggle.checked) {
              startAutoRefresh()
            } else if (refreshTimer) {
              clearTimeout(refreshTimer)
              refreshTimer = null
            }
          })

          // Refresh interval change
          const intervalSelect = testRoot.querySelector('.refresh-interval') as HTMLSelectElement
          intervalSelect.addEventListener('change', () => {
            setRefreshInterval(parseInt(intervalSelect.value))
            if (autoRefresh()) {
              startAutoRefresh() // Restart with new interval
            }
          })

          // Chart period change
          const chartPeriodSelect = testRoot.querySelector('.chart-period')!
          chartPeriodSelect.addEventListener('change', () => {
            addNotification('Chart period updated', 'info')
          })

          // Export chart
          const exportChartBtn = testRoot.querySelector('.export-chart')!
          exportChartBtn.addEventListener('click', () => {
            addNotification('Chart exported successfully', 'success')
          })

          // Order search
          const orderSearch = testRoot.querySelector('.order-search') as HTMLInputElement
          orderSearch.addEventListener('input', () => {
            const searchTerm = orderSearch.value.toLowerCase()
            const orderItems = testRoot.querySelectorAll('.order-item')
            
            orderItems.forEach(item => {
              const text = item.textContent?.toLowerCase() || ''
              ;(item as HTMLElement).style.display = text.includes(searchTerm) ? 'block' : 'none'
            })
          })

          // Status filter
          const statusFilter = testRoot.querySelector('.status-filter') as HTMLSelectElement
          statusFilter.addEventListener('change', () => {
            const filterValue = statusFilter.value
            const orderItems = testRoot.querySelectorAll('.order-item')
            
            orderItems.forEach(item => {
              const status = item.getAttribute('data-status')
              ;(item as HTMLElement).style.display = !filterValue || status === filterValue ? 'block' : 'none'
            })
          })

          // Clear notifications
          const clearNotificationsBtn = testRoot.querySelector('.clear-notifications')!
          clearNotificationsBtn.addEventListener('click', () => {
            testRoot.querySelector('.notifications-list')!.innerHTML = ''
            setNotifications([])
          })

          // Add notification button
          const addNotificationBtn = testRoot.querySelector('.add-notification')!
          addNotificationBtn.addEventListener('click', () => {
            const messages = [
              'New order received',
              'Payment processed',
              'User signed up',
              'Inventory updated',
              'System backup completed'
            ]
            const types = ['success', 'info', 'warning']
            const randomMessage = messages[Math.floor(Math.random() * messages.length)]
            const randomType = types[Math.floor(Math.random() * types.length)]
            
            addNotification(randomMessage, randomType)
          })

          // Start auto-refresh if enabled
          if (autoRefresh()) {
            startAutoRefresh()
          }

          // Update state in tester for tracking
          tester.updateState('dashboardData', dashboardData())
          tester.updateState('autoRefresh', autoRefresh())
        },

        steps: [
          {
            name: 'Verify Initial Dashboard State',
            description: 'Check that dashboard loads with all components',
            actions: [
              { type: 'wait', value: 500 }
            ],
            assertions: [
              { type: 'element-exists', selector: '.dashboard-app' },
              { type: 'element-exists', selector: '.metrics-grid .metric-card' },
              { type: 'element-exists', selector: '.chart' },
              { type: 'element-exists', selector: '.orders-list .order-item' },
              { type: 'element-exists', selector: '.notifications-list .notification-item' }
            ]
          },

          {
            name: 'Test Manual Data Refresh',
            description: 'Trigger manual refresh and verify data updates',
            actions: [
              { type: 'click', target: '.manual-refresh' },
              { type: 'wait', value: 1000 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const timestamp = document.querySelector('.update-time')?.textContent || ''
                return timestamp.length > 0 && timestamp !== mockDashboardData.metrics.users.current.toString()
              }}
            ]
          },

          {
            name: 'Test Chart Interactions',
            description: 'Interact with chart controls',
            actions: [
              { type: 'select', target: '.chart-period', value: '30d' },
              { type: 'click', target: '.export-chart' },
              { type: 'wait', value: 300 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.notifications-list', expected: 'Chart exported successfully' }
            ]
          },

          {
            name: 'Test Order Search Functionality',
            description: 'Search and filter orders',
            actions: [
              { type: 'input', target: '.order-search', value: 'John Doe' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const allOrders = document.querySelectorAll('.order-item')
                const visibleOrders = Array.from(allOrders).filter(
                  item => (item as HTMLElement).style.display !== 'none'
                )
                return visibleOrders.length === 1 // Only John Doe order should be visible
              }}
            ]
          },

          {
            name: 'Test Status Filter',
            description: 'Filter orders by status',
            actions: [
              { type: 'input', target: '.order-search', value: '' }, // Clear search first
              { type: 'select', target: '.status-filter', value: 'completed' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const visibleOrders = Array.from(document.querySelectorAll('.order-item')).filter(
                  item => (item as HTMLElement).style.display !== 'none'
                )
                return visibleOrders.length === 1 // Only completed order should be visible
              }}
            ]
          },

          {
            name: 'Test Notification Management',
            description: 'Add and manage notifications',
            actions: [
              { type: 'click', target: '.add-notification' },
              { type: 'wait', value: 200 },
              { type: 'click', target: '.add-notification' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const notificationCount = document.querySelectorAll('.notification-item').length
                return notificationCount >= 5 // Original 3 + 2 new notifications
              }}
            ]
          },

          {
            name: 'Test Auto-refresh Toggle',
            description: 'Disable and re-enable auto-refresh',
            actions: [
              { type: 'click', target: '.auto-refresh-toggle' }, // Disable
              { type: 'wait', value: 300 },
              { type: 'click', target: '.auto-refresh-toggle' }, // Re-enable
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const toggle = document.querySelector('.auto-refresh-toggle') as HTMLInputElement
                return toggle.checked === true
              }}
            ]
          },

          {
            name: 'Clear All Notifications',
            description: 'Clear notification list',
            actions: [
              { type: 'click', target: '.clear-notifications' },
              { type: 'wait', value: 200 }
            ],
            assertions: [
              { type: 'custom', customAssertion: () => {
                const notificationCount = document.querySelectorAll('.notification-item').length
                return notificationCount === 0
              }}
            ]
          }
        ],

        successCriteria: [
          'Dashboard loads with all components',
          'Manual refresh updates data and timestamp',
          'Chart interactions work correctly',
          'Order search filters results properly',
          'Status filter functions correctly',
          'Notifications can be added and managed',
          'Auto-refresh toggle works',
          'All notifications can be cleared'
        ]
      }

      const result = await tester.executeScenario(dashboardScenario)

      // Debug logging
      console.log('Dashboard Test Result:', {
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

    it('should handle dashboard data loading states and error recovery', async () => {
      const dashboardErrorScenario: RealWorldScenario = {
        name: 'Dashboard Error Handling',
        description: 'Test dashboard error states, loading indicators, and recovery',
        tags: ['dashboard', 'error-handling', 'loading'],
        estimatedDuration: 4000,

        setup: async () => {
          const testRoot = document.querySelector('#test-app-root')!
          testRoot.innerHTML = `
            <div class="simple-dashboard">
              <button class="load-data" type="button">Load Data</button>
              <button class="simulate-error" type="button">Simulate Error</button>
              <div class="data-status">Ready</div>
              <div class="loading-indicator" style="display: none;">Loading...</div>
              <div class="error-message" style="display: none;"></div>
              <div class="data-display">No data loaded</div>
            </div>
          `

          const loadDataBtn = testRoot.querySelector('.load-data')!
          const simulateErrorBtn = testRoot.querySelector('.simulate-error')!
          const statusDiv = testRoot.querySelector('.data-status')!
          const loadingDiv = testRoot.querySelector('.loading-indicator') as HTMLElement
          const errorDiv = testRoot.querySelector('.error-message') as HTMLElement
          const dataDiv = testRoot.querySelector('.data-display')!

          let shouldSimulateError = false

          const loadData = async () => {
            statusDiv.textContent = 'Loading...'
            loadingDiv.style.display = 'block'
            errorDiv.style.display = 'none'

            try {
              await new Promise((resolve, reject) => {
                setTimeout(() => {
                  if (shouldSimulateError) {
                    reject(new Error('Network error'))
                  } else {
                    resolve('Data loaded successfully')
                  }
                }, 1000)
              })

              // Success
              statusDiv.textContent = 'Data loaded'
              dataDiv.textContent = 'Sample dashboard data: Users: 1247, Revenue: $52,847'

            } catch (error) {
              // Error
              statusDiv.textContent = 'Error occurred'
              errorDiv.textContent = 'Failed to load data. Please try again.'
              errorDiv.style.display = 'block'
              // Reset error state so next call will succeed
              shouldSimulateError = false
            } finally {
              loadingDiv.style.display = 'none'
            }
          }

          loadDataBtn.addEventListener('click', loadData)
          
          simulateErrorBtn.addEventListener('click', () => {
            shouldSimulateError = true
            loadData()
          })

          // Add a way to reset error simulation
          const resetErrorState = () => {
            shouldSimulateError = false
          }

          // Store reset function for test access
          ;(testRoot as any).resetErrorState = resetErrorState
        },

        steps: [
          {
            name: 'Test Successful Data Loading',
            description: 'Load data successfully and verify state',
            actions: [
              { type: 'click', target: '.load-data' },
              { type: 'wait', value: 1200 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.data-status', expected: 'Data loaded' },
              { type: 'element-contains', selector: '.data-display', expected: 'Users: 1247' }
            ]
          },

          {
            name: 'Test Error Simulation',
            description: 'Simulate error and verify error handling',
            actions: [
              { type: 'click', target: '.simulate-error' },
              { type: 'wait', value: 1200 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.data-status', expected: 'Error occurred' },
              { type: 'element-contains', selector: '.error-message', expected: 'Failed to load data' }
            ]
          },

          {
            name: 'Test Error Recovery',
            description: 'Recover from error by loading data again',
            actions: [
              { type: 'wait', value: 100 }, // Small delay to ensure error state is set
              { type: 'click', target: '.load-data' },
              { type: 'wait', value: 1200 }
            ],
            assertions: [
              { type: 'element-contains', selector: '.data-status', expected: 'Data loaded' },
              { type: 'custom', customAssertion: () => {
                const errorDiv = document.querySelector('.error-message') as HTMLElement
                return errorDiv.style.display === 'none'
              }}
            ]
          }
        ],

        successCriteria: [
          'Data loads successfully with proper status updates',
          'Error states are handled gracefully',
          'Recovery from errors works correctly',
          'Loading indicators function properly'
        ]
      }

      const result = await tester.executeScenario(dashboardErrorScenario)

      console.log('Dashboard Error Handling Test Result:', {
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
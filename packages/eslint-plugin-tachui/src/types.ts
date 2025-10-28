export type Range = [number, number]

export interface Token {
  value: string
  range: Range
}

export interface SourceCode {
  getFirstToken(node: any): Token | null
  getTokenBefore(
    node: any,
    options?: {
      includeComments?: boolean
    }
  ): Token | null
  getTokenAfter(
    node: any,
    options?: {
      includeComments?: boolean
    }
  ): Token | null
}

export interface RuleFix {
  range: Range
  text?: string
}

export interface RuleFixer {
  removeRange(range: Range): RuleFix
  replaceTextRange(range: Range, text: string): RuleFix
}

export interface ReportDescriptor {
  node: any
  messageId: string
  data?: Record<string, string>
  fix?: (fixer: RuleFixer) => RuleFix | RuleFix[] | null
}

export interface RuleContext {
  report(descriptor: ReportDescriptor): void
  getSourceCode(): SourceCode
}

export interface RuleModule {
  meta: {
    type: 'suggestion' | 'problem' | 'layout'
    docs: {
      description: string
      recommended: boolean
    }
    fixable?: 'code' | 'whitespace'
    hasSuggestions?: boolean
    schema: unknown[]
    messages: Record<string, string>
  }
  create(context: RuleContext): Record<string, (node: any) => void>
}

export interface Plugin {
  rules: Record<string, RuleModule>
}

export interface IdentifierNode {
  type: 'Identifier'
  name: string
  range: Range
}

export interface MemberExpressionNode {
  type: 'MemberExpression'
  object: any
  property: any
  computed: boolean
  optional?: boolean
  parent?: any
  range: Range
}

import { describe, expect, it } from 'vitest'
import rule from '../src/rules/prefer-direct-modifiers'
import type {
  IdentifierNode,
  MemberExpressionNode,
  RuleContext,
  RuleFix,
  RuleFixer,
  SourceCode,
  Token,
} from '../src/types'

type Scenario = {
  code: string
  nextProperty: string
  optionalHead?: boolean
  optionalTail?: boolean
}

class StubFixer implements RuleFixer {
  public operations: RuleFix[] = []

  removeRange(range: [number, number]): RuleFix {
    const fix: RuleFix = { range, text: '' }
    this.operations.push(fix)
    return fix
  }

  replaceTextRange(range: [number, number], text: string): RuleFix {
    const fix: RuleFix = { range, text }
    this.operations.push(fix)
    return fix
  }
}

function applyFixes(code: string, fixes: RuleFix | RuleFix[] | null): string {
  if (!fixes) {
    return code
  }

  const queue = Array.isArray(fixes) ? fixes : [fixes]
  const sorted = [...queue].sort((a, b) => b.range[0] - a.range[0])

  let result = code
  for (const fix of sorted) {
    const [start, end] = fix.range
    const text = fix.text ?? ''
    result = result.slice(0, start) + text + result.slice(end)
  }
  return result
}

function buildScenario({
  code,
  nextProperty,
  optionalHead = false,
  optionalTail = false,
}: Scenario) {
  const modifierText = '.modifier'
  const modifierIndex = optionalHead
    ? code.indexOf('?.modifier')
    : code.indexOf(modifierText)

  if (modifierIndex === -1) {
    throw new Error('Code sample does not contain .modifier segment')
  }

  const precedingToken: Token = optionalHead
    ? {
        value: '?.',
        range: [modifierIndex, modifierIndex + 2],
      }
    : {
        value: '.',
        range: [modifierIndex, modifierIndex + 1],
      }

  const modifierStart = optionalHead
    ? precedingToken.range[1]
    : modifierIndex + 1
  const modifierEnd = modifierStart + 'modifier'.length
  const modifierToken: Token = {
    value: 'modifier',
    range: [modifierStart, modifierEnd],
  }

  const followingToken: Token | null = optionalTail
    ? {
        value: '?.',
        range: [modifierEnd, modifierEnd + 2],
      }
    : {
        value: '.',
        range: [modifierEnd, modifierEnd + 1],
      }

  const propertyStart = followingToken
    ? followingToken.range[1]
    : modifierEnd
  const propertyEnd = propertyStart + nextProperty.length

  const propertyNode: IdentifierNode = {
    type: 'Identifier',
    name: nextProperty,
    range: [propertyStart, propertyEnd],
  }

  const modifierIdentifier: IdentifierNode = {
    type: 'Identifier',
    name: 'modifier',
    range: [modifierStart, modifierEnd],
  }

  const member: MemberExpressionNode = {
    type: 'MemberExpression',
    object: { range: [0, modifierIndex], type: 'CallExpression' } as any,
    property: modifierIdentifier,
    computed: false,
    optional: optionalHead,
    range: [0, modifierEnd],
  }

  const parent: MemberExpressionNode = {
    type: 'MemberExpression',
    object: member,
    property: propertyNode,
    computed: false,
    optional: optionalTail,
    range: [0, propertyEnd],
  }

  member.parent = parent

  const source: SourceCode = {
    getFirstToken(node: any) {
      return node === modifierIdentifier ? modifierToken : null
    },
    getTokenBefore(target: any) {
      return target === modifierToken ? precedingToken : null
    },
    getTokenAfter(node: any) {
      return node === modifierIdentifier ? followingToken : null
    },
  }

  return {
    code,
    member,
    source,
    property: propertyNode,
  }
}

function runRule(
  scenario: ReturnType<typeof buildScenario>
): { messageId: string; output: string }[] {
  const reports: { messageId: string; output: string }[] = []

  const context: RuleContext = {
    report(descriptor) {
      const fixer = new StubFixer()
      const fixes = descriptor.fix ? descriptor.fix(fixer) : null
      const output = applyFixes(scenario.code, fixes)
      reports.push({
        messageId: descriptor.messageId,
        output,
      })
    },
    getSourceCode() {
      return scenario.source
    },
  }

  const listeners = rule.create(context)
  listeners.MemberExpression?.(scenario.member)

  return reports
}

describe('prefer-direct-modifiers rule', () => {
  it('ignores member expressions without the legacy trigger', () => {
    const member: MemberExpressionNode = {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'Text' } as any,
      property: { type: 'Identifier', name: 'padding', range: [0, 7] },
      computed: false,
      range: [0, 7],
    }

    const context: RuleContext = {
      report() {
        throw new Error('Report should not be called')
      },
      getSourceCode() {
        return {
          getFirstToken: () => null,
          getTokenBefore: () => null,
          getTokenAfter: () => null,
        }
      },
    }

    const listeners = rule.create(context)
    expect(() => listeners.MemberExpression?.(member)).not.toThrow()
  })

  it('ignores `.modifier` when there is no chained property', () => {
    const modifierIdentifier: IdentifierNode = {
      type: 'Identifier',
      name: 'modifier',
      range: [0, 8],
    }

    const member: MemberExpressionNode = {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'component' } as any,
      property: modifierIdentifier,
      computed: false,
      range: [0, 8],
    }

    member.parent = {
      type: 'ExpressionStatement',
      expression: member,
    } as any

    const context: RuleContext = {
      report() {
        throw new Error('Report should not be called')
      },
      getSourceCode() {
        return {
          getFirstToken: () => null,
          getTokenBefore: () => null,
          getTokenAfter: () => null,
        }
      },
    }

    const listeners = rule.create(context)
    expect(() => listeners.MemberExpression?.(member)).not.toThrow()
  })

  it('removes the `.modifier` trigger for chained calls', () => {
    const scenario = buildScenario({
      code: 'Text("Hello").modifier.padding(16)',
      nextProperty: 'padding',
    })

    const reports = runRule(scenario)
    expect(reports).toHaveLength(1)
    expect(reports[0].messageId).toBe('preferDirect')
    expect(reports[0].output).toBe('Text("Hello").padding(16)')
  })

  it('preserves surrounding chain calls', () => {
    const scenario = buildScenario({
      code: 'createCard().modifier.backgroundColor("#fff")',
      nextProperty: 'backgroundColor',
    })

    const reports = runRule(scenario)
    expect(reports).toHaveLength(1)
    expect(reports[0].output).toBe(
      'createCard().backgroundColor("#fff")'
    )
  })

  it('handles optional chaining before the trigger', () => {
    const scenario = buildScenario({
      code: 'maybeComponent?.modifier.padding(12)',
      nextProperty: 'padding',
      optionalHead: true,
    })

    const reports = runRule(scenario)
    expect(reports).toHaveLength(1)
    expect(reports[0].output).toBe(
      'maybeComponent?.padding(12)'
    )
  })

  it('handles optional chaining before and after the trigger', () => {
    const scenario = buildScenario({
      code: 'maybeComponent?.modifier?.padding(12)',
      nextProperty: 'padding',
      optionalHead: true,
      optionalTail: true,
    })

    const reports = runRule(scenario)
    expect(reports).toHaveLength(1)
    expect(reports[0].output).toBe(
      'maybeComponent?.padding(12)'
    )
  })

  it('keeps optional call syntax on the downstream modifier', () => {
    const scenario = buildScenario({
      code: 'widgetFactory().modifier.padding?.(spacing)',
      nextProperty: 'padding',
    })

    const reports = runRule(scenario)
    expect(reports).toHaveLength(1)
    expect(reports[0].output).toBe(
      'widgetFactory().padding?.(spacing)'
    )
  })
})

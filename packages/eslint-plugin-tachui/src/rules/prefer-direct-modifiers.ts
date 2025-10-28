import type {
  IdentifierNode,
  MemberExpressionNode,
  RuleModule,
  RuleContext,
  Token,
} from '../types'

type ExtendedMemberExpression = MemberExpressionNode & {
  property: IdentifierNode | any
}

function unwrapChainParent(parent: any): any {
  if (parent && parent.type === 'ChainExpression') {
    return parent.expression
  }
  return parent
}

function isSafeMemberExpression(
  node: ExtendedMemberExpression
): node is ExtendedMemberExpression & { property: IdentifierNode } {
  return (
    node.property &&
    node.property.type === 'Identifier' &&
    node.property.name === 'modifier' &&
    node.computed === false
  )
}

const rule: RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer calling modifiers directly instead of using the `.modifier` trigger.',
      recommended: false,
    },
    fixable: 'code',
    hasSuggestions: false,
    schema: [],
    messages: {
      preferDirect:
        "Call the `{{modifierName}}` modifier directly instead of going through `.modifier`.",
    },
  },
  create(context: RuleContext) {
    const sourceCode = context.getSourceCode()

    return {
      MemberExpression(node: MemberExpressionNode) {
        const member = node as ExtendedMemberExpression
        if (!isSafeMemberExpression(member)) {
          return
        }

        const parentNode = unwrapChainParent(member.parent)
        if (!parentNode || parentNode.type !== 'MemberExpression') {
          return
        }

        const parent = parentNode as MemberExpressionNode

        if (parent.object !== member) {
          return
        }

        if (parent.computed || parent.property.type !== 'Identifier') {
          return
        }

        const modifierName = parent.property.name

        context.report({
          node: member.property,
          messageId: 'preferDirect',
          data: {
            modifierName,
          },
          fix(fixer) {
            const modifierToken = sourceCode.getFirstToken(
              member.property
            ) as Token | null
            const precedingToken = modifierToken
              ? (sourceCode.getTokenBefore(modifierToken, {
                  includeComments: false,
                }) as Token | null)
              : null

            if (!modifierToken || !precedingToken) {
              return null
            }

            if (precedingToken.value === '?.') {
              const followingToken = sourceCode.getTokenAfter(
                member.property,
                { includeComments: false }
              )

              if (
                !followingToken ||
                (followingToken.value !== '.' && followingToken.value !== '?.')
              ) {
                return null
              }

              return fixer.replaceTextRange(
                [precedingToken.range[0], followingToken.range[1]],
                '?.'
              )
            }

            return fixer.removeRange([
              precedingToken.range[0],
              modifierToken.range[1],
            ])
          },
        })
      },
    }
  },
}

export default rule

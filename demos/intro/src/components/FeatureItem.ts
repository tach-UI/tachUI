import { VStack, Text } from '@tachui/primitives'
import { Assets } from '@tachui/core/assets'
import type { ComponentInstance } from '@tachui/core/runtime/types'
import { Symbol } from '@tachui/symbols'

export function FeatureItem(item: { icon: string; title: string; description: string }): ComponentInstance {
  const logoFont = Assets.logoFont

  return VStack({
    spacing: 15,
    alignment: 'center',
    children: [
      Symbol(item.icon, {
        renderingMode: 'monochrome',
        primaryColor: Assets.accentOrange,
        size: 64,
        weight: 300
      })
        .modifier
        .dropShadow('4px 4px 8px hsla(251, 91%, 66%, 0.67)')
        .build(),

      Text(item.title, {
        element: 'h3'
      })
        .modifier
        .font({
          family: logoFont,
          size: '1.33rem',
          weight: 400
        })
        .build(),

      Text(item.description, {
        element: 'p'
      })
      .modifier
      .fontSize(18)
      .fontWeight(300)
      .lineHeight(1.6)
      .minHeight('128px')
      .maxHeight('128px')
      .clipped()
      .build()
    ]
  })
    .modifier
    .border({ width: 1, color: 'hsla(251, 91%, 66%, 0.3)', style: 'solid' })
    .background('hsla(251, 91%, 66%, 0.1)')
    .backdropFilter('blur(15px)')
    .dropShadow('4px 4px 8px hsla(251, 91%, 66%, 0.15)')
    .padding(16)
    .cornerRadius(2)
    .height('100%')
    .alignItems('flex-start')
    .hoverEffect('automatic')
    .transition('all 0.3s ease-in-out')
    .cornerRadius(2)
    .sm.width('94%')
    .md.width('47%')
    .lg.width('31%')
    .build()
}

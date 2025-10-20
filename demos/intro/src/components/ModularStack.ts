import { VStack, HStack, Text, Divider } from '@tachui/primitives'
import { Assets } from '@tachui/core/assets'
import type { ComponentInstance } from '@tachui/core/runtime/types'

export function ModularStack(name: string, size: string, entries: string[][]): ComponentInstance {

  return VStack({
    spacing: 8,
    alignment: 'leading',
    children: [
      HStack({
        children: [
          Text(name)
            .modifier
            .font({ size: '1.25rem', family: Assets.logoFont })
            .foregroundColor(Assets.textWhite)
            .build(),

          Text(size)
            .modifier
            .backgroundColor(Assets.primaryPurple)
            .foregroundColor(Assets.textWhite)
            .padding({ horizontal: 8, vertical: 4 })
            .cornerRadius(6)
            .margin({ left: 10 })
            .font({ size: '1.15rem', weight: '600', family: Assets.baseFont })
            .build()
        ]
      })
        .modifier
        .paddingBottom(20)
        .build(),

      ...entries.flatMap((entry, index) => [
        Text(entry[0])
          .modifier
          .fontWeight('bold')
          .build()
          .concat(
            Text(entry[1])
              .modifier
              .build()
          ),
        ...(index < entries.length - 1 ? [
          Divider({
            color: Assets.primaryPurple20,
            thickness: 1
          })
            .modifier
            .margin(0)
            .build()
        ] : [])
      ])
    ]
  })
  .modifier
  .background(Assets.primaryPurple10)
  .hover({
    background: Assets.primaryPurple20,
    borderColor: Assets.primaryPurple50,
    transform: 'translateY(-2px)'
  })
  .font({ size: '1rem', family: Assets.baseFont, weight: 'normal' })
  .backdropFilter('blur(15px)')
  .border(1, Assets.primaryPurple30, 'solid')
  .padding(30)
  .cornerRadius(12)
  .base.width('98%')
  .md.width('32%')
  .transition({ property: 'all', duration: 300, easing: 'ease' })
  .shadow(0, 8, 32, Assets.primaryPurple15)
  .build()
}

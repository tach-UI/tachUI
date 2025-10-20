import { VStack, HStack, Text } from '@tachui/primitives'
import { Assets } from '@tachui/core/assets'
import type { ComponentInstance } from '@tachui/core/runtime/types'
import type { FontAssetProxy } from '@tachui/core/assets'

const bodyFont = Assets.bodyFont as FontAssetProxy

export function Patterns(): ComponentInstance {
  const swiftText = `<pre><code><span class="comment">// SwiftUI</span>
<span class="keyword">VStack</span>(spacing: <span class="string">16</span>) {
    <span class="function">Text</span>(<span class="string">"Welcome to TachUI"</span>)
        .<span class="property">font</span>(.<span class="property">title</span>)
        .<span class="property">fontWeight</span>(.<span class="property">bold</span>)
        .<span class="property">foregroundColor</span>(.<span class="property">blue</span>)

    <span class="function">Image</span>(url: <span class="function">URL</span>(string: <span class="string">"/hero.jpg"</span>))
    { image in
        image
            .<span class="property">resizable</span>()
            .<span class="property">aspectRatio</span>(
              <span class="string">16/9</span>,
              contentMode: .<span class="property">fit</span>
            )
            .<span class="property">cornerRadius</span>(<span class="string">12</span>)
    }

    <span class="function">Button</span>(<span class="string">"Get Started"</span>) {
        <span class="function">handleAction</span>()
    }
    .<span class="property">buttonStyle</span>(.<span class="property">borderedProminent</span>)
}
.<span class="property">padding</span>()
.<span class="property">navigationTitle</span>(<span class="string">"Home"</span>)</code></pre>`
  const _swiftText = `<p>poop<span>rocket</span></p>`

  const tachText = `<pre><code><span class="comment">// TachUI - identical patterns</span>
<span class="keyword">VStack</span>({
  children: [
    <span class="function">Text</span>(<span class="string">'Welcome to TachUI'</span>)
      .<span class="property">modifier</span>
      .<span class="property">font</span>({ size: <span class="string">'title'</span> })
      .<span class="property">fontWeight</span>(<span class="string">'bold'</span>)
      .<span class="property">foregroundColor</span>(<span class="string">'blue'</span>)
      .<span class="property">build</span>(),

    <span class="function">Image</span>(<span class="string">'/hero.jpg'</span>)
      .<span class="property">modifier</span>
      .<span class="property">resizable</span>()
      .<span class="property">aspectRatio</span>(<span class="string">16/9</span>, <span class="string">'fit'</span>)
      .<span class="property">cornerRadius</span>(<span class="string">12</span>)
      .<span class="property">build</span>(),

    <span class="function">Button</span>(<span class="string">'Get Started'</span>, handleAction)
      .<span class="property">modifier</span>
      .<span class="property">buttonStyle</span>(<span class="string">'borderedProminent'</span>)
      .<span class="property">build</span>()
  ],
  spacing: <span class="string">16</span>
})
  .<span class="property">modifier</span>
  .<span class="property">padding</span>()
  .<span class="property">navigationTitle</span>(<span class="string">'Home'</span>)
  .<span class="property">build</span>()</code></pre>`

  return VStack({
    element: 'section',
    spacing: 0,
    alignment: 'center',
    children: [
      VStack({
        spacing: 0,
        alignment: 'center',
        children:[
          Text('Familiar Development Patterns')
            .modifier
            .font({ size: '2.5rem', family: '"Madimi One", cursive', weight: 'normal' })
            .textAlign('center')
            .foregroundColor(Assets.textWhite)
            .padding(0)
            .margin(0)
            .textShadow({ x: 0, y: 2, blur: 15, color: 'hsla(251, 91%, 66%, 0.4)' })
            .build(),

           HStack({
            spacing: 0,
            children: [
              VStack({
                spacing: 0,
                alignment: 'leading',
                children: [
                  Text('SwiftUI (Swift)')
                    .modifier
                    .backgroundColor(Assets.primaryPurple20)
                    .foregroundColor(Assets.textWhite)
                    .padding({ horizontal: 20, vertical: 15 })
                    .font({ weight: 400, family: bodyFont, size: '1.15rem' })
                    .borderBottom(1, Assets.primaryPurple30, 'solid')
                    .width('100%')
                    .build(),

                  Text(swiftText)
                    .modifier
                    .backgroundColor('hsl(0, 0%, 12%)')
                    .foregroundColor('hsl(0, 0%, 83%)')
                    .asHTML()
                    .padding(20)
                    .font({ family: '"Monaco", "Menlo", "Ubuntu Mono", monospace', size: '14px' })
                    .lineHeight('1.5')
                    .overflowX('scroll')
                    .width('100%')
                    .height('100%')
                    .build()

                ],
              })
                .modifier
                .backgroundColor('hsl(0, 0%, 12%, 0.9)')
                .cornerRadius(12)
                .border({ width: 1, color: 'hsla(251, 91%, 66%, 0.3)', style: 'solid' })
                .overflow('hidden')
                .flexGrow(1)
                .backdropFilter('blur(15px)')
                .base.width('370px')
                .sm.width('620px')
                .md.width('40%')
                .margin(10)
                .build(),

              // TachUI Code Block
              VStack({
                spacing: 0,
                alignment: 'leading',
                children: [
                  Text('TachUI (TypeScript)')
                    .modifier
                    .backgroundColor(Assets.primaryPurple20)
                    .foregroundColor(Assets.textWhite)
                    .padding({ horizontal: 20, vertical: 15 })
                    .font({ weight: 400, family: bodyFont, size: '1.15rem' })
                    .borderBottom(1, Assets.primaryPurple30, 'solid')
                    .width('100%')
                    .build(),

                  Text(tachText)
                    .modifier
                    .backgroundColor('hsl(0, 0%, 12%)')
                    .foregroundColor('hsl(0, 0%, 83%)')
                    .asHTML()
                    .padding(20)
                    .font({ family: '"Monaco", "Menlo", "Ubuntu Mono", monospace', size: '14px' })
                    .lineHeight('1.5')
                    .whiteSpace('pre')
                    .overflowX('scroll')
                    .width('100%')
                    .height('100%')
                    .build()
                ],
              })
                .modifier
                .backgroundColor('hsl(0, 0%, 12%, 0.9)')
                .cornerRadius(12)
                .border({ width: 1, color: 'hsla(251, 91%, 66%, 0.3)', style: 'solid' })
                .overflow('hidden')
                .flexGrow(1)
                .backdropFilter('blur(15px)')
                .base.width('370px')
                .sm.width('620px')
                .md.width('40%')
                .margin(10)
                .build()
            ]
          })
            .modifier
            .margin({ vertical: 60, horizontal: 0 })
            .alignItems('stretch')
            .base.flexDirection('column')
            .md.flexDirection('row')
            .width('100%')
            .maxWidth('1200px')
            .build(),

          Text('Perfect for iOS developers transitioning to web development.')
            .modifier
            .font({ size: '1.25rem', family: bodyFont, weight: 600 })
            .foregroundColor(Assets.textWhite)
            .textAlign('center')
            .margin({ horizontal: 10 })
            .build(),
          Text('Your iOS development knowledge transfers directly - no new patterns to learn. ')
            .modifier
            .font({ size: '1.25rem', family: bodyFont, weight: 300 })
            .foregroundColor(Assets.textWhite)
            .textAlign('center')
            .margin({ horizontal: 10 })
            .build()

        ]
      })
        .modifier
        .width('100%')
        .build()
    ]
  })
  .modifier
  .foregroundColor(Assets.textWhite)
  .backgroundColor(Assets.darkPurple20)
  .id('comparison')
  .padding({ vertical: 60, horizontal: 0 })
  .width("100%")
  .build()
}

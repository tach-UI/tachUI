import { VStack, HStack, Text } from '@tachui/primitives';
import { Assets } from '@tachui/core/assets';
import type { ComponentInstance } from '@tachui/core/runtime/types';
const logoFont = Assets.logoFont;
export function Performance(): ComponentInstance {
    return VStack({
        element: 'section',
        spacing: 0,
        alignment: 'center',
        children: [
            VStack({
                spacing: 0,
                alignment: 'center',
                children: [
                    Text('Performance-First Architecture')
                        .font({ size: '2.5rem', family: '"Madimi One", cursive', weight: 'normal' })
                        .textAlign('center')
                        .foregroundColor(Assets.textWhite)
                        .padding(0)
                        .margin(0)
                        .marginBottom(60)
                        .textShadow({ x: 0, y: 2, blur: 15, color: 'hsla(251, 91%, 66%, 0.4)' })
                        .build(),
                    HStack({
                        spacing: 30,
                        children: [
                            PerformanceItem('>80%', 'SwiftUI API Compatability'),
                            PerformanceItem('65+', 'Components Available'),
                            PerformanceItem('130+', 'Component Modifiers Available'),
                            PerformanceItem('>85%', 'Modifier Compatability'),
                        ]
                    })
                        .alignItems('stretch')
                        .base.flexDirection('column')
                        .md.flexDirection('row')
                        .build(),
                    Text('Why tachUI is Fast')
                        .font({ size: '1.25rem', family: logoFont, weight: 'normal' })
                        .textAlign('center')
                        .padding({ vertical: 30 })
                        .foregroundColor(Assets.textWhite)
                        .build(),
                    HStack({
                        spacing: 30,
                        children: [
                            FastItem('Fine-Grained Updates', 'Only changed properties trigger DOM updates, not entire components. Surgical precision eliminates unnecessary work.'),
                            FastItem('Zero Virtual DOM', 'Direct DOM manipulation eliminates reconciliation overhead. No diffing algorithms or virtual DOM tree traversal.'),
                        ]
                    })
                        .marginBottom(30)
                        .justifyContent('center')
                        .base.flexDirection('column')
                        .md.flexDirection('row')
                        .build(),
                    HStack({
                        spacing: 30,
                        children: [
                            FastItem('Compile-Time Optimized', 'Build-time optimizations eliminate runtime bloat. Tree-shaking ensures you only ship what you use.'),
                            FastItem('Memory Efficient', 'Automatic cleanup and minimal memory footprint. Smart garbage collection prevents memory leaks.'),
                        ]
                    })
                        .marginBottom(30)
                        .justifyContent('center')
                        .base.flexDirection('column')
                        .md.flexDirection('row')
                        .build(),
                ]
            })
                .padding({ vertical: 0, horizontal: 20 })
                .maxWidth(1200)
                .elementId('features')
                .build()
        ]
    })
        .foregroundColor(Assets.textWhite)
        .padding({ vertical: 80, horizontal: 0 })
        .position('relative')
        .width("100%")
        .build();
}
function PerformanceItem(value: string, desc: string): ComponentInstance {
    return VStack({
        spacing: 0,
        alignment: 'center',
        children: [
            Text(value)
                .fontSize('2rem')
                .fontWeight('bold')
                .foregroundColor(Assets.accentOrange)
                .build(),
            Text(desc)
                .fontSize('1.15rem')
                .textAlign('center')
                .build(),
        ]
    })
        .backgroundColor(Assets.primaryPurple10)
        .backdropFilter({ blur: 15 })
        .border({ width: 1, color: Assets.primaryPurple30, style: 'solid' })
        .cornerRadius(12)
        .dropShadow({ x: 0, y: 8, blur: 32, color: Assets.primaryPurple15 })
        .padding(30)
        .base.width('100%')
        .md.width('23%')
        .hoverEffect('lift')
        .build();
}
function FastItem(header: string, description: string): ComponentInstance {
    return VStack({
        spacing: 0,
        alignment: 'center',
        children: [
            Text(header)
                .fontSize('1.33rem')
                .fontWeight(500)
                .foregroundColor(Assets.accentOrange)
                .marginBottom(15)
                .build(),
            Text(description)
                .fontSize('1.15rem')
                .textAlign('center')
                .build(),
        ]
    })
        .backgroundColor(Assets.primaryPurple10)
        .backdropFilter({ blur: 15 })
        .border({ width: 1, color: Assets.primaryPurple30, style: 'solid' })
        .cornerRadius(2)
        .dropShadow({ x: 0, y: 8, blur: 32, color: Assets.primaryPurple15 })
        .padding(30)
        .base.width('98%')
        .md.width('46%')
        .hoverEffect('lift')
        .elementId('performance')
        .build();
}

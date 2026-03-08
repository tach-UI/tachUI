import { VStack, Text } from '@tachui/primitives';
import { Assets } from '@tachui/core';
import type { ComponentInstance } from '@tachui/core/runtime/types';
import { FeatureItem } from './FeatureItem';
// import { backdropFilter } from '@tachui/core/modifiers'
export function Features(): ComponentInstance {
    const items = [
        { icon: 'brain-circuit', title: 'iOS Developer Friendly', description: 'Familiar API patterns with 70+ components and 258 modifiers. Identical syntax and concepts - iOS developers feel at home immediately with declarative UI patterns. ' },
        { icon: 'replace', title: 'Fine-Grained Reactivity', description: 'SolidJS-inspired signals provide surgical DOM updates without virtual DOM overhead. Only changed properties trigger updates, not entire components.' },
        { icon: 'plug-zap', title: 'Plugin Architecture', description: 'Modular design scales from 60KB core to 150KB full-featured. Import only what you need - perfect for landing pages or complex applications.' },
        { icon: 'swatch-book', title: 'Advanced Styling System', description: 'Comprehensive modifier system with visual effects, transforms, animations, and responsive design. Blur, scale, rotate - all reactive and performant.' },
        { icon: 'panels-top-left', title: 'Complete Navigation', description: 'Stack and tab navigation with routing, deep linking, and desktop multi-window support. NavigationStack, TabView, and WindowGroup with familiar iOS patterns.' },
        { icon: 'text-cursor-input', title: 'Rich Form System', description: '25+ specialized form components with validation, formatting, and accessibility built-in. EmailField, CreditCardField, DatePicker with Luhn validation.' },
        { icon: 'book-type', title: 'TypeScript-First', description: 'Built with TypeScript from day one with strict type safety and excellent IDE support. Full intellisense and compile-time error checking.' },
        { icon: 'shield-check', title: 'Broad Testing', description: 'Comprehensive testing suite with 95%+ coverage, performance monitoring, and modern tooling. Built on Vite with lightning-fast development.' }
    ];
    return VStack({
        element: 'section',
        spacing: 0,
        alignment: 'center',
        children: [
            VStack({
                spacing: 60,
                alignment: 'center',
                children: [
                    Text('Why TachUI?')
                        .font({ size: '2.5rem', family: '"Madimi One", cursive', weight: 'normal' })
                        .textAlign('center')
                        .foregroundColor(Assets.textWhite)
                        .padding(0)
                        .margin(0)
                        .textShadow({ x: 0, y: 2, blur: 15, color: 'hsla(251, 91%, 66%, 0.4)' }),

                    // Features Grid using responsive layout
                    VStack({
                        children: items.map((item) => FeatureItem(item))
                    })
                        .foregroundColor(Assets.textWhite)
                        .flexDirection('row')
                        .flexWrap('wrap')
                        .gap('36px')
                        .alignItems('flex-start')
                ]
            })
                .padding({ vertical: 0, horizontal: 20 })
                .maxWidth(1200)
                .elementId('features')
        ]
    })
        .background(Assets.darkPurple80)
        .foregroundColor(Assets.textWhite)
        .padding({ vertical: 80, horizontal: 0 })
        .position('relative')
        .width("100%")
        .minHeight('600px')
}

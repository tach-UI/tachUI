import { VStack, HStack, Text, Divider } from '@tachui/primitives';
import { Assets } from '@tachui/core';
import type { ComponentInstance } from '@tachui/core/runtime/types';
export function ModularStack(name: string, size: string, entries: string[][]): ComponentInstance {
    const primaryPurple20 = Assets.primaryPurple20.resolve() as string;
    const logoFont = Assets.logoFont;
    const baseFont = Assets.baseFont;
    return VStack({
        spacing: 8,
        alignment: 'leading',
        children: [
            HStack({
                children: [
                    Text(name)
                        .font({ size: '1.25rem', family: logoFont })
                        .foregroundColor(Assets.textWhite)
                        .build(),
                    Text(size)
                        .backgroundColor(Assets.primaryPurple)
                        .foregroundColor(Assets.textWhite)
                        .padding({ horizontal: 8, vertical: 4 })
                        .cornerRadius(6)
                        .margin({ left: 10 })
                        .font({ size: '1.15rem', weight: '600', family: baseFont })
                        .build()
                ]
            })
                .paddingBottom(20)
                .build(),
            ...entries.flatMap((entry, index) => {
                const row = HStack({
                    spacing: 6,
                    alignment: 'center',
                    children: [
                        Text(entry[0])
                            .fontWeight('bold')
                            .build(),
                        Text(entry[1]).build(),
                    ],
                });
                if (index < entries.length - 1) {
                    const divider = Divider({
                        color: primaryPurple20,
                        thickness: 1,
                    })
                        .margin(0).build();
                    return [row, divider];
                }
                return [row];
            })
        ]
    })
        .background(Assets.primaryPurple10)
        .hover({
        background: primaryPurple20,
        borderColor: Assets.primaryPurple50.resolve() as string,
        transform: 'translateY(-2px)'
    })
        .font({ size: '1rem', family: baseFont, weight: 'normal' })
        .backdropFilter('blur(15px)')
        .border(1, Assets.primaryPurple30, 'solid')
        .padding(30)
        .cornerRadius(12)
        .base.width('98%')
        .md.width('32%')
        .transition({ property: 'all', duration: 300, easing: 'ease' })
        .shadow(0, 8, 32, Assets.primaryPurple15.resolve() as string)
        .build();
}

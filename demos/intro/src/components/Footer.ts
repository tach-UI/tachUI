import { VStack, HStack, Text, Link } from "@tachui/primitives";
import { Assets } from "@tachui/core/assets";
import type { ComponentInstance } from "@tachui/core/runtime/types";
export function Footer(): ComponentInstance {
    return VStack({
        element: "footer",
        spacing: 0,
        alignment: "center",
        children: [
            HStack({
                spacing: 0,
                alignment: "center",
                children: [
                    LinkWrapper("https://tachui.dev/docs/", "Documentation"),
                    LinkWrapper("https://www.npmjs.com/org/tachui", "NPM"),
                    LinkWrapper("https://github.com/tach-UI/demos", "Demos"),
                    LinkWrapper("https://github.com/tach-UI/tachUI", "Github"),
                    LinkWrapper("https://github.com/tach-UI/tachUI/issues", "Issues"),
                ],
            })
                .font({ size: 16, weight: 300 })
                .paddingBottom(20)
                .base.flexDirection("column")
                .md.flexDirection("row")
                .build(),
            Text("Copyright ©2025 the tachUI team, all rights reserved. Released under ")
                .font({ size: 16, weight: 300 })
                .paddingBottom(20)
                .build()
                .concat(Link("MPL-2.0 License", "https://www.mozilla.org/en-US/MPL/2.0/")
                .foregroundColor(Assets.accentOrange)
                .textDecoration("underline")
                .build()),
            Text("SwiftUI is a trademark of Apple Inc. tachUI is not affiliated with, endorsed by, or sponsored by Apple Inc.")
                .font({ size: 12, weight: 300 })
                .foregroundColor(Assets.white60)
                .build(),
        ],
    })
        .background(Assets.darkPurple90)
        .foregroundColor(Assets.textWhite)
        .padding({ vertical: 40, horizontal: 20 })
        .backdropFilter("blur(15px)")
        .borderTop(1, Assets.primaryPurple30, "solid")
        .width("100%")
        .minHeight("600px")
        .build();
}
function LinkWrapper(url: string, text: string): ComponentInstance {
    return Link(text, url)
        .foregroundColor(Assets.textWhite)
        .typography({ decoration: "none" })
        .padding({ horizontal: 15, vertical: 8 })
        .cornerRadius(4)
        .hover({
        color: Assets.accentOrange,
    })
        .build();
}

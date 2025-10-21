import { VStack, Text } from "@tachui/primitives";
import { Assets } from "@tachui/core/assets";
import type { ComponentInstance } from "@tachui/core/runtime/types";

export function Build(): ComponentInstance {
  return VStack({
    element: "section",
    spacing: 0,
    alignment: "center",
    children: [
      VStack({
        spacing: 0,
        alignment: "center",
        children: [
          Text("Ready to Build Something Amazing?")
            .modifier.font({
              size: "2.5rem",
              family: '"Madimi One", cursive',
              weight: "normal",
            })
            .textAlign("center")
            .foregroundColor(Assets.textWhite)
            .padding(0)
            .margin(0)
            .textShadow({
              x: 0,
              y: 2,
              blur: 15,
              color: "hsla(251, 91%, 66%, 0.4)",
            })
            .build(),

          Text("Start building applications with familiar SwiftUI patterns")
            .modifier.font({ size: "1.5rem", weight: "normal" })
            .textAlign("center")
            .foregroundColor(Assets.textWhite)
            .padding(0)
            .margin({ vertical: 30 })
            .textShadow({
              x: 0,
              y: 2,
              blur: 15,
              color: "hsla(251, 91%, 66%, 0.4)",
            })
            .build(),

          VStack({
            spacing: 10,
            alignment: "leading",
            children: [
              Text("Prerequisites")
                .modifier.font({ size: "1.15rem", weight: 700 })
                .width("100%")
                .borderBottom(1, Assets.accentOrange15, "solid")
                .build(),

              Text(
                `Node.js: 20+
pnpm: 10.14.0+ (recommended) or npm 9+
TypeScript: 5.8+ support in your editor
`,
                { element: "pre" } as any,
              ),

              Text("Install tachUI (and plugins as needed)")
                .modifier.font({ size: "1.15rem", weight: 700 })
                .width("100%")
                .marginTop(30)
                .borderBottom(1, Assets.accentOrange15, "solid")
                .build(),

              Text(
                `# Using pnpm (recommended)
pnpm add @tachui/core@0.7.0-alpha2

# Using npm
npm install @tachui/core@0.7.0-alpha2

# Using yarn
yarn add @tachui/core@0.7.0-alpha2

Optional Plugins

Add additional functionality as needed:

# Form components and validation
pnpm add @tachui/forms@0.7.0-alpha2

# Navigation system
pnpm add @tachui/navigation@0.7.0-alpha2

# Icon system (Lucide integration)
pnpm add @tachui/symbols@0.7.0-alpha2

# Mobile patterns (alerts, action sheets)
pnpm add @tachui/mobile-patterns@0.7.0-alpha2
`,
                { element: "pre" } as any,
              ),
            ],
          })
            .modifier.backgroundColor(Assets.darkPurple80)
            .padding(20)
            .border(1, Assets.accentOrange15, "solid")
            .cornerRadius(2)
            .build(),
        ],
      })
        .modifier.padding({ vertical: 0, horizontal: 20 })
        .maxWidth(1200)
        .id("cta")
        .build(),
    ],
  })
    .modifier.background(Assets.darkPurple80)
    .foregroundColor(Assets.textWhite)
    .padding({ vertical: 80, horizontal: 0 })
    .position("relative")
    .width("100%")
    .minHeight("600px")
    .build();
}

import { HStack, Text, Button } from "@tachui/primitives";
import { Assets, LinearGradient } from "@tachui/core/assets";
import type { ComponentInstance } from "@tachui/core/runtime/types";
import type { FontAssetProxy } from "@tachui/core/assets";

const logoFont = Assets.logoFont as FontAssetProxy;
const baseFont = Assets.baseFont as FontAssetProxy;

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export function Header() {
  return HStack({
    element: "header",
    alignment: "center",
    children: [
      HStack({
        element: "nav",
        children: [
          // Logo
          Text("tachUI")
            .modifier.font({ size: "24px", family: logoFont })
            .foregroundColor(Assets.primaryPurple)
            .textShadow({
              x: 0,
              y: 0,
              blur: 10,
              color: "rgba(139, 92, 246, 0.5)",
            })
            .build(),

          // Navigation links
          HStack({
            spacing: 0,
            children: [
              NavButton("Features", "features"),
              NavButton("Comparison", "comparison"),
              NavButton("Architecture", "architecture"),
              NavButton("Performance", "performance"),
            ],
          })
            .modifier.foregroundColor(Assets.textWhite)
            .font({ weight: "500", family: '"Dosis", sans-serif', size: 16 })
            .display("none")
            .build(),

          // CTA Button using proper tachUI modifiers with Assets
          Button("Get Started", () => scrollToSection("cta"))
            .modifier.background(
              LinearGradient({
                colors: [Assets.primaryPurple, Assets.secondaryPurple],
                startPoint: "topLeading",
                endPoint: "bottomTrailing",
              }),
            )
            .foregroundColor(Assets.textWhite)
            .padding({ horizontal: 20, vertical: 10 })
            .cornerRadius(2)
            .font({ weight: "600", family: baseFont, size: 16 })
            .shadow({
              x: 0,
              y: 4,
              radius: 15,
              color: "rgba(139, 92, 246, 0.3)",
            })
            .border({ width: 0 })
            .cursor("pointer")
            .transition({ property: "all", duration: 200, easing: "ease" })
            .build(),
        ],
      })
        .modifier.width("100%")
        .maxWidth("1200px")
        .margin({ vertical: 0, horizontal: "auto" })
        .padding({ vertical: 0, horizontal: 20 })
        .height(60)
        .justifyContent("space-between")
        .build(),
    ],
  })
    .modifier.backgroundColor(Assets.headerBackground)
    .borderBottom(1, Assets.borderPurple, "solid")
    .position("fixed")
    .css({
      top: 0,
      left: 0,
      right: 0,
    })
    .zIndex(1000)
    .build();
}

function NavButton(text: string, anchor: string): ComponentInstance {
  return Button(text, () => scrollToSection(anchor))
    .modifier.opacity(0.9)
    .backgroundColor("transparent")
    .border({ width: 0 })
    .padding({ horizontal: 15, vertical: 8 })
    .cursor("pointer")
    .font({ size: "16px", family: baseFont, weight: "bold" })
    .textCase("uppercase")
    .transition({ property: "color", duration: 200, easing: "ease" })
    .build();
}

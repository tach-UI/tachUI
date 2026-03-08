import { VStack, HStack, Text, Button, Spacer } from "@tachui/primitives";
import { Assets, LinearGradient } from "@tachui/core";
import type { ComponentInstance } from "@tachui/core/runtime/types";
import { Symbol } from "@tachui/symbols";
const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
};
export function Hero(): ComponentInstance {
    return VStack({
        element: "section",
        spacing: 0,
        children: [
            VStack({
                spacing: 0,
                children: [
                    // Definition List Structure - exact match to marketing.html
                    VStack({
                        spacing: 8,
                        children: [
                            // Version Badge
                            HStack({
                                spacing: 12,
                                children: [
                                    Spacer(),

                                    Text("🚀 v0.9.0 Just Released!")
                                        .font({ size: "1.1rem", family: Assets.baseFont, weight: "700" })
                                        .foregroundColor(Assets.accentOrange)
                                        .backgroundColor(Assets.darkPurple)
                                        .border({ width: 1, color: Assets.accentOrange, style: "solid" })
                                        .cornerRadius(24)
                                        .padding({ vertical: 10, horizontal: 20 }),
                                ],
                                alignment: "right",
                            })
                                .width('100%')
                                .offset(96, 32),

                            Text("tachUI(isA: Framework)")
                                .responsive({ fontSize: { base: "2rem", sm: "2.5rem", md: "3rem", lg: "3.5rem" } })
                                .gradientText("linear-gradient(to bottom, hsla(0, 0%, 100%, 1) 0%, hsla(218, 100%, 94%, 1) 50%, hsla(225, 92%, 90%, 1) 100%)")
                                .padding({ bottom: 8 }),

                            Text(".writtenIn(TypeScript).first")
                                .padding({ bottom: 4 })
                                .before({
                                    content: "• • ",
                                    color: "hsl(0, 0%, 100%)",
                                    opacity: 0.1,
                                }),
                            Text(".inspiredBy(SwiftUI)")
                                .padding({ bottom: 4 })
                                .before({
                                    content: "• • ",
                                    color: "hsl(0, 0%, 100%)",
                                    opacity: 0.1,
                                }),
                            Text(".inspiredBy(SolidJS)")
                                .padding({ bottom: 4 })
                                .before({
                                    content: "• • ",
                                    color: "hsl(0, 0%, 100%)",
                                    opacity: 0.1,
                                }),
                            Text(".forThe(Web).and(more)")
                                .padding({ bottom: 4 })
                                .before({
                                    content: "• • ",
                                    color: "hsl(0, 0%, 100%)",
                                    opacity: 0.1,
                                }),
                        ],
                        alignment: "leading",
                    })
                        .fontFamily(Assets.logoFont)
                        .paddingVertical(40)
                        .gradientText("linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c7d2fe 100%)")
                        .textShadow({ x: 0, y: 4, blur: 20, color: "hsla(251, 91%, 66%, 0.5)" })
                        .responsive({
                          fontSize: { base: "1.15rem", sm: "1.5rem", md: "2rem", lg: "2.5rem" },
                        })
                        .base.paddingHorizontal(20)
                        .lg.paddingHorizontal("16rem"),

                    Text("TypeScript framework inspired by SwiftUI integrated with a fine-grained reactive core")
                        .font({ size: "1.25rem", family: Assets.baseFont, weight: "400" })
                        .textAlign("center")
                        .opacity(0.9)
                        .margin({ horizontal: "auto", vertical: 0 }),

                    VStack({
                        spacing: 8,
                        children: [
                            HStack({
                                spacing: 10,
                                children: [
                                    Symbol("siren", {
                                        renderingMode: "monochrome", primaryColor: Assets.accentOrange, size: 32, weight: 500  }
                                    ),
                                    Text("PRE-RELEASE / EARLY ACCESS / BLEEDING EDGE")
                                        .font({ size: "1.25rem", family: Assets.baseFont, weight: "600" })
                                        .foregroundColor(Assets.accentOrange),
                                ],
                                alignment: "center",
                            }),
                            Text("This is a preview version released for early testing and community feedback. Features and APIs may change before the stable release.")
                                .font({ size: "1.15rem", family: Assets.baseFont })
                                .foregroundColor(Assets.textWhite)
                                .opacity(0.85)
                                .textAlign("center")
                                .lineHeight("1.4")
                                .padding({ top: 8, bottom: 0 }),
                        ],
                        alignment: "center",
                    })
                        .backgroundColor(Assets.accentOrange15)
                        .border({ width: 1, color: Assets.accentOrange40, style: "solid" })
                        .cornerRadius(2)
                        .padding({ vertical: 16, horizontal: 20 })
                        .marginVertical(30)
                        .responsive()
                        .base.marginHorizontal(20)
                        .md.marginHorizontal("auto")
                        .maxWidth("500px")
                        .backdropFilter({ blur: 10 }),
                    // Hero buttons using proper tachUI modifiers
                    HStack({
                        spacing: 20,
                        children: [
                            Button("Get Started", () => scrollToSection("cta"))
                                .background(LinearGradient({
                                    colors: [Assets.primaryPurple, Assets.secondaryPurple],
                                    startPoint: "topLeading",
                                    endPoint: "bottomTrailing",
                                }))
                                .foregroundColor(Assets.textWhite)
                                .padding({ vertical: 15, horizontal: 30 })
                                .cornerRadius(2)
                                .font({ weight: "600", family: 'Dosis, sans-serif', size: 16 })
                                .shadow({ x: 0, y: 6, blur: 25, color: Assets.primaryPurple40 })
                                .hoverEffect("lift")
                                .border({ width: 0 })
                                .cursor("pointer"),

                            Button("View on GitHub", () => {
                                window.open("https://github.com/tach-UI/tachUI", "_self");
                            })
                                .backgroundColor(Assets.white10)
                                .foregroundColor(Assets.textWhite)
                                .opacity(0.9)
                                .border({ width: 2, color: Assets.primaryPurple60, style: "solid", })
                                .padding({ vertical: 13, horizontal: 28 })
                                .cornerRadius(2)
                                .font({ weight: "600",  family: Assets.baseFont, size: 16 })
                                .cursor("pointer")
                                .backdropFilter({ blur: 10 })
                                .hoverEffect("lift"),
                        ],
                        alignment: "center",
                    })
                        .width("100%")
                        .justifyContent("center"),
                ],
                alignment: "center",
            }),
        ],
        alignment: "center",
    })
        .background(LinearGradient({
        colors: [Assets.darkPurple70, Assets.darkPurple70],
        startPoint: "topLeading",
        endPoint: "bottomTrailing",
    }))
        .foregroundColor(Assets.textWhite)
        .border({ bottom: { width: 2, color: Assets.primaryPurple60, style: "solid" } })
        .padding({ top: 120, right: 20, bottom: 80, left: 20 })
        .position("relative")
        .width("100%")
        .minHeight("600px");
}

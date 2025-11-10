/*


      // Features Section - matching marketing.html
      VStack({
        spacing: 60,
        children: [
          Text('Why TachUI?')
                        .font({ size: '2.5rem', family: '"Madimi One", cursive', weight: 'normal' })
            .textAlign('center')
            .foregroundColor(Assets.textWhite)
            .padding({ bottom: 60 })
            .shadow({ x: 0, y: 2, radius: 15, color: 'rgba(139, 92, 246, 0.4)' })
            .build(),

          // Features Grid using proper tachUI layout
          VStack({
            spacing: 40,
            children: [
              // Feature 1: iOS Developer Friendly
              VStack({
                spacing: 20,
                children: [
                  Text('🚀')
                                        .font({ size: '48px' })
                    .width('48px')
                    .height('48px')
                    .foregroundColor(Assets.primaryPurple)
                    .padding({ bottom: 20 })
                    .addModifier(dropShadow('0 4px 8px rgba(139, 92, 246, 0.3)'))
                    .build(),

                  Text('iOS Developer Friendly')
                                        .font({ size: '1.25rem', family: '"Madimi One", cursive', weight: 'normal' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .padding({ bottom: 15 })
                    .shadow({ x: 0, y: 1, radius: 8, color: 'rgba(139, 92, 246, 0.3)' })
                    .build(),

                  Text('Familiar API patterns with 66 components and 130+ modifiers. Identical syntax and concepts - iOS developers feel at home immediately with declarative UI patterns.')
                                        .font({ family: '"Dosis", sans-serif', weight: '400' })
                    .foregroundColor(Assets.textWhite)
                    .opacity(0.85)
                    .textAlign('center')
                    .lineHeight('1.6')
                    .build()
                ],
                alignment: 'center'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ width: 1, color: Assets.borderPurple, style: 'solid' })
                .padding({ all: 30 })
                .cornerRadius(2)
                .shadow({ x: 0, y: 8, radius: 32, color: 'rgba(139, 92, 246, 0.15)' })
                .transition({ property: 'all', duration: 300, easing: 'ease' })
                .addModifier(backdropFilter({ blur: 15 }))
                .build(),

              // Row 1: Secondary Features
              HStack({
                spacing: 25,
                children: [
                  VStack({
                    spacing: 15,
                    children: [
                      Text('⚡')
                                                .font({ size: '1.8rem' })
                        .build(),

                      Text('Fine-Grained Reactivity')
                                                .font({ size: '1.1rem', weight: '600', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .build(),

                      Text('SolidJS-inspired signals for performance')
                                                .font({ size: '0.9rem', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .opacity(0.85)
                        .build()
                    ],
                    alignment: 'center'
                  })
                                        .backgroundColor(Assets.cardBackground)
                    .border({ color: Assets.borderPurple, width: 1 })
                    .padding({ all: 20 })
                    .cornerRadius(12)
                    .minHeight('140px')
                    .flexGrow(1)
                    .build(),

                  VStack({
                    spacing: 15,
                    children: [
                      Text('📦')
                                                .font({ size: '1.8rem' })
                        .build(),

                      Text('Plugin Architecture')
                                                .font({ size: '1.1rem', weight: '600', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .build(),

                      Text('Now 99.89% smaller! From 6.2MB to 7KB')
                                                .font({ size: '0.9rem', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.accentOrange)
                        .textAlign('center')
                        .opacity(0.95)
                        .fontWeight('600')
                        .build()
                    ],
                    alignment: 'center'
                  })
                                        .backgroundColor(Assets.cardBackground)
                    .border({ color: Assets.borderPurple, width: 1 })
                    .padding({ all: 20 })
                    .cornerRadius(12)
                    .minHeight('140px')
                    .flexGrow(1)
                    .build(),

                  VStack({
                    spacing: 15,
                    children: [
                      Text('🎨')
                                                .font({ size: '1.8rem' })
                        .build(),

                      Text('Advanced Styling System')
                                                .font({ size: '1.1rem', weight: '600', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .build(),

                      Text('Comprehensive modifier system')
                                                .font({ size: '0.9rem', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .opacity(0.85)
                        .build()
                    ],
                    alignment: 'center'
                  })
                                        .backgroundColor(Assets.cardBackground)
                    .border({ color: Assets.borderPurple, width: 1 })
                    .padding({ all: 20 })
                    .cornerRadius(12)
                    .minHeight('140px')
                    .flexGrow(1)
                    .build()
                ],
                alignment: 'stretch'
              })
            ],
            alignment: 'stretch'
          }),

          // Row 2: Complete Navigation, Rich Form System, TypeScript-First, Comprehensive Testing
          HStack({
            spacing: 25,
            children: [
              VStack({
                spacing: 15,
                children: [
                  Text('🧭')
                                                .font({ size: '1.8rem' })
                        .build(),

                      Text('Complete Navigation')
                                                .font({ size: '1.1rem', weight: '600', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .build(),

                      Text('Stack and tab navigation with routing')
                                                .font({ size: '0.9rem', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .opacity(0.85)
                        .build()
                    ],
                    alignment: 'center'
                  })
                                        .backgroundColor(Assets.cardBackground)
                    .border({ color: Assets.borderPurple, width: 1 })
                    .padding({ all: 20 })
                    .cornerRadius(12)
                    .minHeight('140px')
                    .flexGrow(1)
                    .build(),

                  VStack({
                    spacing: 15,
                    children: [
                      Text('📝')
                                                .font({ size: '1.8rem' })
                        .build(),

                      Text('Rich Form System')
                                                .font({ size: '1.1rem', weight: '600', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .build(),

                      Text('25+ specialized form components')
                                                .font({ size: '0.9rem', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .opacity(0.85)
                        .build()
                    ],
                    alignment: 'center'
                  })
                                        .backgroundColor(Assets.cardBackground)
                    .border({ color: Assets.borderPurple, width: 1 })
                    .padding({ all: 20 })
                    .cornerRadius(12)
                    .minHeight('140px')
                    .flexGrow(1)
                    .build(),

                  VStack({
                    spacing: 15,
                    children: [
                      Text('💠')
                                                .font({ size: '1.8rem' })
                        .build(),

                      Text('TypeScript-First')
                                                .font({ size: '1.1rem', weight: '600', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .build(),

                      Text('Built with TypeScript from day one')
                                                .font({ size: '0.9rem', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .opacity(0.85)
                        .build()
                    ],
                    alignment: 'center'
                  })
                                        .backgroundColor(Assets.cardBackground)
                    .border({ color: Assets.borderPurple, width: 1 })
                    .padding({ all: 20 })
                    .cornerRadius(12)
                    .minHeight('140px')
                    .flexGrow(1)
                    .build(),

                  VStack({
                    spacing: 15,
                    children: [
                      Text('🧪')
                                                .font({ size: '1.8rem' })
                        .build(),

                      Text('Comprehensive Testing')
                                                .font({ size: '1.1rem', weight: '600', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .build(),

                      Text('95%+ test coverage for reliability')
                                                .font({ size: '0.9rem', family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .textAlign('center')
                        .opacity(0.85)
                        .build()
                    ],
                    alignment: 'center'
                  })
                                        .backgroundColor(Assets.cardBackground)
                    .border({ color: Assets.borderPurple, width: 1 })
                    .padding({ all: 20 })
                    .cornerRadius(12)
                    .minHeight('140px')
                    .flexGrow(1)
                    .build()
                ],
                alignment: 'stretch'
              })
            ],
            alignment: 'stretch'
          })
                        .maxWidth('1200px')
            .build()
        ],
        alignment: 'center'
      })
                .backgroundColor(Assets.darkPurple)
        .opacity(0.8)
        .padding({ top: 80, bottom: 80, left: 40, right: 40 })
        .backdropFilter('blur(10px)')
        .elementId('features')
        .build(),

      // Code Comparison Section
      VStack({
        spacing: 40,
        children: [
          Text('Familiar iOS Development Patterns')
                        .font({ size: '2.2rem', family: '"Madimi One", cursive' })
            .foregroundColor(Assets.textWhite)
            .textAlign('center')
            .build(),

          HStack({
            spacing: 40,
            children: [
              // SwiftUI Code Block
              VStack({
                spacing: 0,
                children: [
                  Text('SwiftUI (Swift)')
                                        .backgroundColor(Assets.primaryPurple)
                    .foregroundColor(Assets.textWhite)
                    .padding({ horizontal: 20, vertical: 15 })
                    .font({ weight: '600', family: '"Dosis", sans-serif' })
                    .build(),

                  Text(swiftText)
                                        .backgroundColor('hsl(0, 0%, 12%)')
                    .foregroundColor('hsl(0, 0%, 83%)')
                    .padding({ all: 20 })
                    .font({ family: '"Monaco", "Menlo", "Ubuntu Mono", monospace', size: '14px' })
                    .lineHeight('1.5')
                    .whiteSpace('pre')
                    .build()
                ],
                alignment: 'stretch'
              })
                                .backgroundColor('hsl(0, 0%, 12%)')
                .cornerRadius(12)
                .border({ width: 1, color: 'rgba(139, 92, 246, 0.3)', style: 'solid' })
                .overflow('hidden')
                .flexGrow(1)
                .css({
                  'backdrop-filter': 'blur(15px)'
                })
                .build(),

              // TachUI Code Block
              VStack({
                spacing: 0,
                children: [
                  Text('TachUI (TypeScript)')
                                        .backgroundColor(Assets.primaryPurple)
                    .foregroundColor(Assets.textWhite)
                    .padding({ horizontal: 20, vertical: 15 })
                    .font({ weight: '600', family: '"Dosis", sans-serif' })
                    .build(),

                  Text(tachText)
                                        .backgroundColor('hsl(0, 0%, 12%)')
                    .foregroundColor('hsl(0, 0%, 83%)')
                    .padding({ all: 20 })
                    .font({ family: '"Monaco", "Menlo", "Ubuntu Mono", monospace', size: '14px' })
                    .lineHeight('1.5')
                    .whiteSpace('pre')
                    .build()
                ],
                alignment: 'stretch'
              })
                                .backgroundColor('hsl(0, 0%, 12%)')
                .cornerRadius(12)
                .border({ width: 1, color: 'rgba(139, 92, 246, 0.3)', style: 'solid' })
                .overflow('hidden')
                .flexGrow(1)
                .css({
                  'backdrop-filter': 'blur(15px)'
                })
                .build()
            ],
            alignment: 'stretch'
          }),

          Text('Perfect for iOS developers transitioning to web development.')
                        .font({ size: '1.1rem', family: '"Dosis", sans-serif', weight: 'bold' })
            .foregroundColor(Assets.textWhite)
            .textAlign('center')
            .opacity(0.8)
            .build()
        ],
        alignment: 'center'
      })
                .backgroundColor(Assets.darkPurple)
        .padding({ top: 60, bottom: 60, horizontal: 40 })
        .setAttribute('id', 'comparison')
        .build(),

      // Architecture Section
      VStack({
        spacing: 40,
        children: [
          Text('Modular Architecture')
                        .font({ size: '2.2rem', family: '"Madimi One", cursive' })
            .foregroundColor(Assets.textWhite)
            .textAlign('center')
            .build(),

          VStack({
            spacing: 30,
            children: [
              // Core Package
              VStack({
                spacing: 20,
                children: [
                  HStack({
                    spacing: 10,
                    children: [
                      Text('@tachui/core')
                                                .font({ size: '1.25rem', family: '"Madimi One", cursive' })
                        .foregroundColor(Assets.textWhite)
                        .build(),

                      Text('7KB')
                                                .backgroundColor(Assets.primaryPurple)
                        .foregroundColor(Assets.textWhite)
                        .padding({ horizontal: 8, vertical: 4 })
                        .cornerRadius(6)
                        .font({ size: '0.85rem', weight: '600', family: '"Dosis", sans-serif' })
                        .build()
                    ],
                    alignment: 'center'
                  }),

                  VStack({
                    spacing: 8,
                    children: [
                      Text('• Production-minimal bundle - Core reactive system only')
                                                .font({ family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.85)
                        .build(),

                      Text('• Zero TypeScript overhead - 99.89% bundle reduction achieved')
                                                .font({ family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.85)
                        .build(),

                      Text('• Perfect for: Maximum performance applications, landing pages')
                                                .font({ family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.85)
                        .build()
                    ],
                    alignment: 'leading'
                  })
                ],
                alignment: 'leading'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .build(),

              // Navigation Package
              VStack({
                spacing: 20,
                children: [
                  HStack({
                    spacing: 10,
                    children: [
                      Text('@tachui/navigation')
                                                .font({ size: '1.25rem', family: '"Madimi One", cursive' })
                        .foregroundColor(Assets.textWhite)
                        .build(),

                      Text('+25KB')
                                                .backgroundColor(Assets.primaryPurple)
                        .foregroundColor(Assets.textWhite)
                        .padding({ horizontal: 8, vertical: 4 })
                        .cornerRadius(6)
                        .font({ size: '0.85rem', weight: '600', family: '"Dosis", sans-serif' })
                        .build()
                    ],
                    alignment: 'center'
                  }),

                  VStack({
                    spacing: 8,
                    children: [
                      Text('• 9 navigation components - NavigationStack, TabView, NavigationLink')
                                                .font({ family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.85)
                        .build(),

                      Text('• SwiftUI routing - Path-based navigation with type safety')
                                                .font({ family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.85)
                        .build(),

                      Text('• Perfect for: Single-page applications, mobile apps')
                                                .font({ family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.85)
                        .build()
                    ],
                    alignment: 'leading'
                  })
                ],
                alignment: 'leading'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .build(),

              // Forms Package
              VStack({
                spacing: 20,
                children: [
                  HStack({
                    spacing: 10,
                    children: [
                      Text('@tachui/forms')
                                                .font({ size: '1.25rem', family: '"Madimi One", cursive' })
                        .foregroundColor(Assets.textWhite)
                        .build(),

                      Text('+35KB')
                                                .backgroundColor(Assets.primaryPurple)
                        .foregroundColor(Assets.textWhite)
                        .padding({ horizontal: 8, vertical: 4 })
                        .cornerRadius(6)
                        .font({ size: '0.85rem', weight: '600', family: '"Dosis", sans-serif' })
                        .build()
                    ],
                    alignment: 'center'
                  }),

                  VStack({
                    spacing: 8,
                    children: [
                      Text('• 24 specialized components - EmailField, CreditCardField, DatePicker')
                                                .font({ family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.85)
                        .build(),

                      Text('• Advanced validation - Built-in rules, custom validators')
                                                .font({ family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.85)
                        .build(),

                      Text('• Perfect for: Data-heavy applications, complex forms')
                                                .font({ family: '"Dosis", sans-serif' })
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.85)
                        .build()
                    ],
                    alignment: 'leading'
                  })
                ],
                alignment: 'leading'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .build()
            ],
            alignment: 'center'
          })
        ],
        alignment: 'center'
      })
                .backgroundColor(Assets.midPurple)
        .padding({ top: 60, bottom: 60, horizontal: 40 })
        .setAttribute('id', 'architecture')
        .build(),

      // Bundle Size Chart Section
      VStack({
        spacing: 40,
        children: [
          Text('Bundle Size Scaling')
                        .font({ size: '2.2rem', family: '"Madimi One", cursive' })
            .foregroundColor(Assets.textWhite)
            .textAlign('center')
            .build(),

          VStack({
            spacing: 15,
            children: [
              // Minimal Production Bar
              HStack({
                spacing: 20,
                children: [
                  Text('Minimal Production')
                                        .font({ size: '0.95rem', weight: '500', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .minWidth('120px')
                    .build(),

                  VStack({
                    spacing: 0,
                    children: [
                      HStack({
                        spacing: 0,
                        children: [
                          VStack({ children: [] })
                                                        .backgroundColor(Assets.accentOrange)
                            .height('20px')
                            .width('5%')
                            .css({ 'border-radius': '10px 0 0 10px' })
                            .build(),

                          VStack({ children: [] })
                                                        .backgroundColor('hsla(139, 92, 246, 0.2)')
                            .height('20px')
                            .width('95%')
                            .css({ 'border-radius': '0 10px 10px 0' })
                            .build()
                        ],
                        alignment: 'stretch'
                      })
                    ],
                    alignment: 'stretch'
                  })
                                        .flexGrow(1)
                    .maxWidth('200px')
                    .build(),

                  Text('~7KB')
                                        .font({ size: '0.95rem', weight: '600', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.accentOrange)
                    .minWidth('60px')
                    .build()
                ],
                alignment: 'center'
              }),

              // + Navigation Bar
              HStack({
                spacing: 20,
                children: [
                  Text('+ Navigation')
                                        .font({ size: '0.95rem', weight: '500', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .minWidth('120px')
                    .build(),

                  VStack({
                    spacing: 0,
                    children: [
                      HStack({
                        spacing: 0,
                        children: [
                          VStack({ children: [] })
                                                        .backgroundColor(Assets.primaryPurple)
                            .height('20px')
                            .width('57%')
                            .css({ 'border-radius': '10px 0 0 10px' })
                            .build(),

                          VStack({ children: [] })
                                                        .backgroundColor('hsla(139, 92, 246, 0.2)')
                            .height('20px')
                            .width('43%')
                            .css({ 'border-radius': '0 10px 10px 0' })
                            .build()
                        ],
                        alignment: 'stretch'
                      })
                    ],
                    alignment: 'stretch'
                  })
                                        .flexGrow(1)
                    .maxWidth('200px')
                    .build(),

                  Text('~85KB')
                                        .font({ size: '0.95rem', weight: '600', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.accentOrange)
                    .minWidth('60px')
                    .build()
                ],
                alignment: 'center'
              }),

              // + Forms Bar
              HStack({
                spacing: 20,
                children: [
                  Text('+ Forms')
                                        .font({ size: '0.95rem', weight: '500', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .minWidth('120px')
                    .build(),

                  VStack({
                    spacing: 0,
                    children: [
                      HStack({
                        spacing: 0,
                        children: [
                          VStack({ children: [] })
                                                        .backgroundColor(Assets.primaryPurple)
                            .height('20px')
                            .width('80%')
                            .css({ 'border-radius': '10px 0 0 10px' })
                            .build(),

                          VStack({ children: [] })
                                                        .backgroundColor('hsla(139, 92, 246, 0.2)')
                            .height('20px')
                            .width('20%')
                            .css({ 'border-radius': '0 10px 10px 0' })
                            .build()
                        ],
                        alignment: 'stretch'
                      })
                    ],
                    alignment: 'stretch'
                  })
                                        .flexGrow(1)
                    .maxWidth('200px')
                    .build(),

                  Text('~120KB')
                                        .font({ size: '0.95rem', weight: '600', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.accentOrange)
                    .minWidth('60px')
                    .build()
                ],
                alignment: 'center'
              }),

              // Full Framework Bar
              HStack({
                spacing: 20,
                children: [
                  Text('Full Framework')
                                        .font({ size: '0.95rem', weight: '500', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .minWidth('120px')
                    .build(),

                  VStack({
                    spacing: 0,
                    children: [
                      HStack({
                        spacing: 0,
                        children: [
                          VStack({ children: [] })
                                                        .backgroundColor(Assets.primaryPurple)
                            .height('20px')
                            .width('100%')
                            .cornerRadius(10)
                            .build()
                        ],
                        alignment: 'stretch'
                      })
                    ],
                    alignment: 'stretch'
                  })
                                        .flexGrow(1)
                    .maxWidth('200px')
                    .build(),

                  Text('~150KB')
                                        .font({ size: '0.95rem', weight: '600', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.accentOrange)
                    .minWidth('60px')
                    .build()
                ],
                alignment: 'center'
              }),

              VStack({
                spacing: 10,
                children: [
                  Text('🏆 BREAKTHROUGH: 99.89% Bundle Reduction Achieved!')
                                        .font({ size: '1.1rem', family: '"Dosis", sans-serif', weight: '700' })
                    .foregroundColor(Assets.accentOrange)
                    .textAlign('center')
                    .build(),

                  Text('From 6.2MB TypeScript bloat to 7KB production-optimized core')
                                        .font({ size: '0.95rem', family: '"Dosis", sans-serif', style: 'italic' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .opacity(0.8)
                    .build()
                ],
                alignment: 'center'
              })
                                .padding({ top: 15 })
                .build()
            ],
            alignment: 'stretch'
          })
                        .maxWidth('400px')
            .build()
        ],
        alignment: 'center'
      })
                .backgroundColor(Assets.darkPurple)
        .padding({ top: 60, bottom: 60, horizontal: 40 })
        .build(),

      // Performance Section
      VStack({
        spacing: 40,
        children: [
          Text('Performance-First Architecture')
                        .font({ size: '2.2rem', family: '"Madimi One", cursive' })
            .foregroundColor(Assets.textWhite)
            .textAlign('center')
            .build(),

          HStack({
            spacing: 30,
            children: [
              VStack({
                spacing: 10,
                children: [
                  Text('95%')
                                        .font({ size: '2rem', family: '"Madimi One", cursive' })
                    .foregroundColor(Assets.accentOrange)
                    .build(),

                  Text('iOS API Compatibility')
                                        .font({ weight: '500', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .opacity(0.85)
                    .build()
                ],
                alignment: 'center'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .build(),

              VStack({
                spacing: 10,
                children: [
                  Text('66')
                                        .font({ size: '2rem', family: '"Madimi One", cursive' })
                    .foregroundColor(Assets.accentOrange)
                    .build(),

                  Text('Total Components')
                                        .font({ weight: '500', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .opacity(0.85)
                    .build()
                ],
                alignment: 'center'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .build(),

              VStack({
                spacing: 10,
                children: [
                  Text('130+')
                                        .font({ size: '2rem', family: '"Madimi One", cursive' })
                    .foregroundColor(Assets.accentOrange)
                    .build(),

                  Text('Modifiers Available')
                                        .font({ weight: '500', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .opacity(0.85)
                    .build()
                ],
                alignment: 'center'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .build(),

              VStack({
                spacing: 10,
                children: [
                  Text('95%+')
                                        .font({ size: '2rem', family: '"Madimi One", cursive' })
                    .foregroundColor(Assets.accentOrange)
                    .build(),

                  Text('Test Coverage')
                                        .font({ weight: '500', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .opacity(0.85)
                    .build()
                ],
                alignment: 'center'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .build()
            ],
            alignment: 'center'
          })
        ],
        alignment: 'center'
      })
                .backgroundColor(Assets.darkPurple)
        .padding({ top: 60, bottom: 60, horizontal: 40 })
        .setAttribute('id', 'performance')
        .build(),

      // Performance Deep Dive Section
      VStack({
        spacing: 50,
        children: [
          Text('Why TachUI is Fast')
                        .font({ size: '2.2rem', family: '"Madimi One", cursive' })
            .foregroundColor(Assets.textWhite)
            .textAlign('center')
            .build(),

          // Performance Feature Cards
          HStack({
            spacing: 30,
            children: [
              VStack({
                spacing: 15,
                children: [
                  Text('🎯')
                                        .font({ size: '2.5rem' })
                    .build(),

                  Text('Fine-Grained Updates')
                                        .font({ size: '1.3rem', weight: '600', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .build(),

                  Text('Only changed properties trigger DOM updates. No full component re-renders or virtual DOM diffing overhead.')
                                        .font({ size: '1rem', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .opacity(0.85)
                    .build()
                ],
                alignment: 'center'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .flexGrow(1)
                .build(),

              VStack({
                spacing: 15,
                children: [
                  Text('🚫')
                                        .font({ size: '2.5rem' })
                    .build(),

                  Text('Zero Virtual DOM')
                                        .font({ size: '1.3rem', weight: '600', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .build(),

                  Text('Direct DOM manipulation eliminates reconciliation overhead. Updates are applied immediately without intermediate steps.')
                                        .font({ size: '1rem', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .opacity(0.85)
                    .build()
                ],
                alignment: 'center'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .flexGrow(1)
                .build()
            ],
            alignment: 'stretch'
          }),

          HStack({
            spacing: 30,
            children: [
              VStack({
                spacing: 15,
                children: [
                  Text('⚙️')
                                        .font({ size: '2.5rem' })
                    .build(),

                  Text('Compile-Time Optimized')
                                        .font({ size: '1.3rem', weight: '600', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .build(),

                  Text('Build-time optimizations eliminate runtime bloat. Dead code elimination and tree-shaking reduce bundle sizes.')
                                        .font({ size: '1rem', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .opacity(0.85)
                    .build()
                ],
                alignment: 'center'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .flexGrow(1)
                .build(),

              VStack({
                spacing: 15,
                children: [
                  Text('🧠')
                                        .font({ size: '2.5rem' })
                    .build(),

                  Text('Memory Efficient')
                                        .font({ size: '1.3rem', weight: '600', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .build(),

                  Text('Automatic cleanup and minimal memory footprint. Signals automatically dispose when components are removed.')
                                        .font({ size: '1rem', family: '"Dosis", sans-serif' })
                    .foregroundColor(Assets.textWhite)
                    .textAlign('center')
                    .opacity(0.85)
                    .build()
                ],
                alignment: 'center'
              })
                                .backgroundColor(Assets.cardBackground)
                .border({ color: Assets.borderPurple, width: 1 })
                .padding({ all: 30 })
                .cornerRadius(12)
                .flexGrow(1)
                .build()
            ],
            alignment: 'stretch'
          })
        ],
        alignment: 'center'
      })
                .backgroundColor(Assets.midPurple)
        .padding({ top: 60, bottom: 60, horizontal: 40 })
        .build(),

      // Call to Action Section
      VStack({
        spacing: 40,
        children: [
          Text('Ready to Build Something Amazing?')
                        .font({ size: '2.2rem', family: '"Madimi One", cursive' })
            .foregroundColor(Assets.textWhite)
            .textAlign('center')
            .build(),

          Text('Start building applications with familiar SwiftUI patterns')
                        .font({ size: '1.25rem', weight: '400', family: '"Dosis", sans-serif' })
            .foregroundColor(Assets.textWhite)
            .textAlign('center')
            .opacity(0.9)
            .build(),

          HStack({
            spacing: 20,
            children: [
              Button('Get Started', () => console.log('Get Started clicked'))
                                .backgroundColor(Assets.primaryPurple)
                .foregroundColor(Assets.textWhite)
                .padding({ horizontal: 30, vertical: 15 })
                .cornerRadius(2)
                .font({ weight: '600', family: '"Dosis", sans-serif' })
                .build(),

              Button('View Components', () => console.log('View Components clicked'))
                                .backgroundColor('hsla(0, 0%, 100%, 0.1)')
                .foregroundColor(Assets.textWhite)
                .padding({ horizontal: 28, vertical: 13 })
                .cornerRadius(2)
                .font({ weight: '600', family: '"Dosis", sans-serif' })
                .border({ color: Assets.primaryPurple, width: 2 })
                .build()
            ],
            alignment: 'center'
          }),

          // Quick Start Code Block
          VStack({
            spacing: 15,
            children: [
              Text('Quick Start:')
                                .font({ size: '1.2rem', weight: '600', family: '"Dosis", sans-serif' })
                .foregroundColor(Assets.accentOrange)
                .build(),

              Text(`# Install TachUI CLI globally
npm install -g @tachui/cli
tacho init my-app

# Or add to existing project
npm install @tachui/core`)
                                .backgroundColor('hsl(0, 0%, 12%)')
                .foregroundColor('hsl(0, 0%, 83%)')
                .padding({ all: 20 })
                .cornerRadius(8)
                .font({ family: '"Monaco", "Menlo", "Ubuntu Mono", monospace', size: '14px' })
                .lineHeight('1.5')
                .whiteSpace('pre')
                .border({ width: 1, color: 'rgba(255, 165, 0, 0.3)', style: 'solid' })
                .maxWidth('500px')
                .build()
            ],
            alignment: 'center'
          })
                        .backgroundColor(Assets.warningBackground)
            .border({ color: Assets.accentOrange, width: 1 })
            .padding({ all: 25 })
            .cornerRadius(12)
            .maxWidth('600px')
            .build()
        ],
        alignment: 'center'
      })
                .backgroundColor(Assets.midPurple)
        .padding({ top: 60, bottom: 60, horizontal: 40 })
        .setAttribute('id', 'cta')
        .build(),

      // Footer
      VStack({
        spacing: 20,
        children: [
          HStack({
            spacing: 30,
            children: [
              Text('Documentation')
                                .foregroundColor(Assets.textWhite)
                .font({ weight: '400', family: '"Dosis", sans-serif' })
                .build(),

              Text('API Reference')
                                .foregroundColor(Assets.textWhite)
                .font({ weight: '400', family: '"Dosis", sans-serif' })
                .build(),

              Text('Examples')
                                .foregroundColor(Assets.textWhite)
                .font({ weight: '400', family: '"Dosis", sans-serif' })
                .build(),

              Text('GitHub')
                                .foregroundColor(Assets.textWhite)
                .font({ weight: '400', family: '"Dosis", sans-serif' })
                .build()
            ],
            alignment: 'center'
          }),

          Text('© 2025 TachUI Team. Released under the MIT License.')
                        .foregroundColor(Assets.textWhite)
            .font({ family: '"Dosis", sans-serif' })
            .textAlign('center')
            .build(),

          Text('Latest Release: v1.4 • Components: 66 • Modifiers: 130+ • iOS Compatibility: 95% • Test Coverage: 95%+')
                        .foregroundColor(Assets.textWhite)
            .font({ size: '14px', family: '"Dosis", sans-serif' })
            .textAlign('center')
            .opacity(0.8)
            .build(),

          Text('SwiftUI is a trademark of Apple Inc. TachUI is not affiliated with, endorsed by, or sponsored by Apple Inc.')
                        .foregroundColor(Assets.textWhite)
            .font({ size: '12px', family: '"Dosis", sans-serif' })
            .textAlign('center')
            .opacity(0.6)
            .padding({ top: 15 })
            .build()
        ],
        alignment: 'center'
      })
                .backgroundColor(Assets.darkPurple)
        .padding({ top: 40, bottom: 40, horizontal: 40 })
        .build()
    ]
  })
    .build()



*/

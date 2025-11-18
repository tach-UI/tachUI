---
cssclasses:
  - full-page
---

# Building a Web Framework that got me excited for FrontEnd Development again

Six weeks ago, I started what I thought would be a quick experiment. As an engineering leader, I've watched frontend development become increasingly complex—and honestly, less enjoyable than it used to be. I needed to do some native SwiftUI work for a project I was deep in and that really triggered me (in a decent way).

**That trigger moment wasn't the syntax or the performance—it was the creative flow.** Upfront CSS planning or frameworks? Design System architecture or implementation? Not required before building. Just iterative, refinable development that felt... natural. From my visual/Fine Arts background, this resonated deeply.

So I asked: **Why can't / shouldn't web development feel this intuitive?**

## Introducing tachUI: SwiftUI-Inspired Web Framework

Six weeks (and 115,000+ lines of code and 4500+ tests) later, I'm sharing **tachUI**—a framework that brings SwiftUI's declarative approach to web development, built from the ground up with modern tooling.

```typescript
VStack({ spacing: 12 })
  .modifier
  .padding(16)
  .backgroundColor('#ffffff')
  .cornerRadius(8)
  .children([
    Text(product.title)
      .font({ size: 18, weight: 'semibold' }),
    
    Button("Add to Cart")
      .backgroundColor('#3b82f6')
      .onTap(() => addToCart(product.id))
  ])
  .build()
```

**What makes this different:**

- **It ain't React!** - but it is built on fine-grained reactivity, more akin to SolidJS
- **~60KB core bundle** - performance without the bloat
- **150+ SwiftUI modifiers** - familiar patterns for mobile developers, and plenty of web-native ones too
- **TypeScript-first** - because developer experience matters

## The AI Development Experiment

This project became something bigger than technical exploration—it's been my deep dive into **AI-assisted development workflows**. The questions you ask yourself as a developer-leader change completely when you have sophisticated AI support. It mirrors mentoring relationships in fascinating ways.

## What's Next

tachUI is in alpha (0.8.1 is coming any minute now) and ready for **developers who are tired of the current ecosystem**, those interested in **declarative patterns**, or anyone wanting to **bridge SwiftUI and web development**.

I'd love collaborators, feedback, or just to connect with others exploring these patterns. Frontend frameworks are abundant, but sometimes you need to build the tool that makes development enjoyable again.

**Try it:** `npm install @tachui/core@0.8.0-alpha`  
**Explore:** https://tachui.dev
**GitHub:** https://github.com/tach-UI/tachUI
**npm:** https://www.npmjs.com/org/tachui

_What tools would make development more enjoyable for you?_

#WebDevelopment #SwiftUI #TypeScript #DeveloperExperience #OpenSource #AI
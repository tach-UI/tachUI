/**
 * Universal Reactivity Test Pattern for TachUI Components
 *
 * Use this pattern to verify any component's reactive behavior
 * Copy and adapt this code to test specific components
 */
import { VStack, HStack } from "@tachui/primitives/layout";
import { Text } from "@tachui/primitives/display";
import { Button } from "@tachui/primitives/controls";
import { ComponentInstance } from "@tachui/core/runtime/types";
import { createSignal, createComputed } from "@tachui/core/reactive";
/**
 * STEP 1: Test Basic Signal Reactivity (Should Always Work)
 */
export function testBasicReactivity(): ComponentInstance {
    const [count, setCount] = createSignal(0);
    const increment = () => setCount(prev => prev + 1);
    const reset = () => setCount(0);
    console.log("ReactivityTest - Basic: Initializing with count:", count());
    // ✅ This should always work - Text with signal
    return VStack({
        spacing: 8,
        children: [
            Text("Basic Reactivity Test")
                .fontSize(16).fontWeight(600).build(),
            Text(`Count: ${count()}`)
                .fontSize(14).build(),
            HStack({
                spacing: 8,
                children: [
                    Button({ title: "Increment", action: increment }),
                    Button({ title: "Reset", action: reset })
                ]
            })
        ]
    })
        .padding(16).backgroundColor("rgba(0,255,0,0.1)").cornerRadius(8).build();
}
/**
 * STEP 2: Test Array-Based Reactivity (Should Work with VStack/ForEach)
 */
export function testArrayReactivity(): ComponentInstance {
    const [items, setItems] = createSignal(['Item 1', 'Item 2']);
    const addItem = () => {
        setItems(prev => [...prev, `Item ${prev.length + 1}`]);
        console.log("ReactivityTest - Array: Added item, total:", items().length);
    };
    const clearItems = () => {
        setItems([]);
        console.log("ReactivityTest - Array: Cleared items");
    };
    // ✅ This should work - VStack with reactive children
    const reactiveList = createComputed(() => {
        const currentItems = items();
        console.log("ReactivityTest - Array: Creating list with", currentItems.length, "items");
        return currentItems.map((item, index) => Text(`${index + 1}. ${item}`)
            .padding(4).build());
    });
    return VStack({
        spacing: 8,
        children: [
            Text("Array Reactivity Test")
                .fontSize(16).fontWeight(600).build(),
            Text(`Items: ${items().length}`)
                .fontSize(14).build(),
            HStack({
                spacing: 8,
                children: [
                    Button({ title: "Add Item", action: addItem }),
                    Button({ title: "Clear", action: clearItems })
                ]
            }),
            VStack({
                children: reactiveList(), // ✅ Should work
                spacing: 4
            })
        ]
    })
        .padding(16).backgroundColor("rgba(0,0,255,0.1)").cornerRadius(8).build();
}
/**
 * STEP 3: Test ScrollView Reactivity (KNOWN TO FAIL - Framework Bug)
 */
export function testScrollViewReactivity(): ComponentInstance {
    const [items, setItems] = createSignal(['Scroll 1', 'Scroll 2', 'Scroll 3']);
    const addItem = () => {
        setItems(prev => [...prev, `Scroll ${prev.length + 1}`]);
        console.log("ReactivityTest - ScrollView: Added item, total:", items().length);
    };
    // ❌ This pattern FAILS with "TypeError: t.flatMap is not a function" 
    let scrollViewTest;
    try {
        const reactiveScrollChildren = createComputed(() => {
            const currentItems = items();
            console.log("ReactivityTest - ScrollView: Creating children with", currentItems.length, "items");
            return currentItems.map(item => Text(item).padding(8).build());
        });
        scrollViewTest = Text("ScrollView test disabled - causes flatMap error")
            .padding(8).backgroundColor("rgba(255,0,0,0.2)").build();
    }
    catch (error) {
        console.error("ReactivityTest - ScrollView: Error creating reactive ScrollView:", error);
        scrollViewTest = Text(`ScrollView Error: ${error.message}`)
            .padding(8).backgroundColor("rgba(255,0,0,0.2)").build();
    }
    return VStack({
        spacing: 8,
        children: [
            Text("ScrollView Reactivity Test (Framework Bug)")
                .fontSize(16).fontWeight(600).build(),
            Text(`Items: ${items().length}`)
                .fontSize(14).build(),
            Button({ title: "Add Item", action: addItem }),
            scrollViewTest
        ]
    })
        .padding(16).backgroundColor("rgba(255,255,0,0.1)").cornerRadius(8).build();
}
/**
 * COMPLETE REACTIVITY TEST SUITE
 * Add this to any component to verify all reactive patterns
 */
export function ReactivityTestSuite(): ComponentInstance {
    console.log("ReactivityTestSuite - Initializing complete test suite");
    return VStack({
        spacing: 16,
        children: [
            Text("TachUI Reactivity Test Suite")
                .fontSize(20).fontWeight(700).textAlign("center").build(),
            Text("Use this to verify reactive behavior in any component")
                .fontSize(14).opacity(0.7).textAlign("center").build(),
            testBasicReactivity(),
            testArrayReactivity(),
            testScrollViewReactivity()
        ]
    })
        .padding(16).build();
}

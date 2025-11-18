/**
 * Modifier Builder Implementation
 *
 * Provides a fluent API for chaining modifiers on components,
 * similar to SwiftUI's modifier system.
 */
import type { Signal } from '../reactive/types';
import type { ComponentInstance, ComponentProps } from '../runtime/types';
import type { StatefulBackgroundValue } from '../gradients/types';
import type { ColorValue } from './types';
import type { FontAsset } from '../assets/FontAsset';
import type { AnimationModifierProps, AppearanceModifierProps, LayoutModifierProps, ModifiableComponent, Modifier, ModifierBuilder } from './types';
import type { AsHTMLOptions } from '@tachui/modifiers/utility';
export declare function setExternalModifierRegistry(registry: any): void;
/**
 * Concrete modifier builder implementation
 *
 * Note: This class intentionally does not implement all ModifierBuilder methods.
 * Missing methods are handled dynamically via the Proxy in createModifierBuilder(),
 * which looks them up in the global modifier registry at runtime.
 */
export declare class ModifierBuilderImpl<T extends ComponentInstance = ComponentInstance> {
    private component;
    private modifiers;
    constructor(component: T);
    frame(width?: number | string, height?: number | string): ModifierBuilder<T>;
    frame(options: LayoutModifierProps['frame']): ModifierBuilder<T>;
    layoutPriority(priority: number | Signal<number>): ModifierBuilder<T>;
    absolutePosition(x: number | Signal<number>, y: number | Signal<number>): ModifierBuilder<T>;
    foregroundColor(color: ColorValue): ModifierBuilder<T>;
    backgroundColor(color: ColorValue): ModifierBuilder<T>;
    background(value: StatefulBackgroundValue | Signal<string>): ModifierBuilder<T>;
    font(options: AppearanceModifierProps['font']): ModifierBuilder<T>;
    font(size: number | string): ModifierBuilder<T>;
    fontWeight(weight: NonNullable<AppearanceModifierProps['font']>['weight']): ModifierBuilder<T>;
    fontSize(size: number | string | Signal<number> | Signal<string>): ModifierBuilder<T>;
    fontFamily(family: string | FontAsset | Signal<string | FontAsset>): ModifierBuilder<T>;
    opacity(value: number | Signal<number>): ModifierBuilder<T>;
    cornerRadius(radius: number | Signal<number>): ModifierBuilder<T>;
    border(width: number | Signal<number>, color?: ColorValue): ModifierBuilder<T>;
    border(options: AppearanceModifierProps['border']): ModifierBuilder<T>;
    borderWidth(width: number | Signal<number>): ModifierBuilder<T>;
    blur(radius: number | Signal<number>): ModifierBuilder<T>;
    brightness(amount: number | Signal<number>): ModifierBuilder<T>;
    contrast(amount: number | Signal<number>): ModifierBuilder<T>;
    saturation(amount: number | Signal<number>): ModifierBuilder<T>;
    hueRotation(angle: number | Signal<number>): ModifierBuilder<T>;
    grayscale(amount: number | Signal<number>): ModifierBuilder<T>;
    colorInvert(amount?: number | Signal<number>): ModifierBuilder<T>;
    highPriorityGesture(gesture: any, including?: ('all' | 'subviews' | 'none')[]): ModifierBuilder<T>;
    simultaneousGesture(gesture: any, including?: ('all' | 'subviews' | 'none')[]): ModifierBuilder<T>;
    transform(value: string | Signal<string>): ModifierBuilder<T>;
    animation(options: AnimationModifierProps['animation']): ModifierBuilder<T>;
    task(operation: () => Promise<void> | void, options?: {
        id?: string;
        priority?: 'background' | 'userInitiated' | 'utility' | 'default';
    }): ModifierBuilder<T>;
    /**
     * @deprecated DO NOT USE - This is an internal API only.
     * Always use direct modifier methods instead of .modifier()
     *
     * BAD:  component.modifier(padding(16))
     * GOOD: component.padding(16)
     *
     * If you need a modifier from @tachui/modifiers, import and use it directly:
     * BAD:  component.modifier(shadow({ radius: 4 }))
     * GOOD: import { shadow } from '@tachui/modifiers'
     *       const mod = shadow({ radius: 4 })
     *       // Then apply via registry or component method
     */
    modifier(modifier: Modifier): ModifierBuilder<T>;
    addModifierInternal(modifier: Modifier): ModifierBuilder<T>;
    resizable(): ModifierBuilder<T>;
    /**
     * Add modifier to internal list (used by responsive builder)
     */
    addModifier(modifier: Modifier): void;
    onTap(handler: (event: MouseEvent) => void): ModifierBuilder<T>;
    onFocus(handler: (isFocused: boolean) => void): ModifierBuilder<T>;
    onBlur(handler: (isFocused: boolean) => void): ModifierBuilder<T>;
    onKeyDown(handler: (event: KeyboardEvent) => void): ModifierBuilder<T>;
    onScroll(handler: (event: Event) => void): ModifierBuilder<T>;
    onKeyPress(handler: (event: KeyboardEvent) => void): ModifierBuilder<T>;
    onKeyUp(handler: (event: KeyboardEvent) => void): ModifierBuilder<T>;
    onDoubleClick(handler: (event: MouseEvent) => void): ModifierBuilder<T>;
    onContextMenu(handler: (event: MouseEvent) => void): ModifierBuilder<T>;
    onWheel(handler: (event: WheelEvent) => void): ModifierBuilder<T>;
    onInput(handler: (event: InputEvent) => void): ModifierBuilder<T>;
    onChange(handler: (value: any, event?: Event) => void): ModifierBuilder<T>;
    onCopy(handler: (event: ClipboardEvent) => void): ModifierBuilder<T>;
    onCut(handler: (event: ClipboardEvent) => void): ModifierBuilder<T>;
    onPaste(handler: (event: ClipboardEvent) => void): ModifierBuilder<T>;
    onSelect(handler: (event: Event) => void): ModifierBuilder<T>;
    customProperties(_options: {
        properties: Record<string, string | number>;
    }): ModifierBuilder<T>;
    customProperty(_name: string, _value: string | number): ModifierBuilder<T>;
    cssVariables(_variables: Record<string, string | number>): ModifierBuilder<T>;
    themeColors(_colors: Record<string, string>): ModifierBuilder<T>;
    designTokens(_tokens: Record<string, string | number>): ModifierBuilder<T>;
    disabled(isDisabled?: boolean | Signal<boolean>): ModifierBuilder<T>;
    asHTML(options?: AsHTMLOptions): ModifierBuilder<T>;
    build(): T;
    private applyModifiersToPropsForTesting;
    role(value: string): ModifierBuilder<T>;
    ariaLabel(value: string): ModifierBuilder<T>;
    ariaLive(value: 'off' | 'polite' | 'assertive'): ModifierBuilder<T>;
    ariaDescribedBy(value: string): ModifierBuilder<T>;
    ariaModal(value: boolean): ModifierBuilder<T>;
    onTouchStart(handler: (event: TouchEvent) => void): ModifierBuilder<T>;
    onTouchMove(handler: (event: TouchEvent) => void): ModifierBuilder<T>;
    onTouchEnd(handler: (event: TouchEvent) => void): ModifierBuilder<T>;
    onSwipeLeft(handler: () => void): ModifierBuilder<T>;
    onSwipeRight(handler: () => void): ModifierBuilder<T>;
    navigationTitle(title: string): ModifierBuilder<T>;
    navigationBarHidden(hidden?: boolean): ModifierBuilder<T>;
    navigationBarItems(options: {
        leading?: ComponentInstance | ComponentInstance[];
        trailing?: ComponentInstance | ComponentInstance[];
    }): ModifierBuilder<T>;
    transitions(config: any): ModifierBuilder<T>;
    onAppear(_handler: () => void): ModifierBuilder<T>;
    onDisappear(_handler: () => void): ModifierBuilder<T>;
    refreshable(_onRefresh: () => Promise<void>, _isRefreshing?: boolean | Signal<boolean>): ModifierBuilder<T>;
    scaleEffect(x: number, y?: number, anchor?: 'center' | 'top' | 'bottom' | 'leading' | 'trailing' | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'): ModifierBuilder<T>;
}
/**
 * Create a modifier builder for a component with dynamic method support
 */
export declare function createModifierBuilder<T extends ComponentInstance>(component: T): ModifierBuilder<T>;
/**
 * Apply modifiers to a component instance
 */
export declare function applyModifiers<T extends ComponentInstance>(component: T, modifiers: Modifier[]): ModifiableComponent<ComponentProps>;
/**
 * Utility functions for common modifier patterns
 */
export declare const modifierUtils: {
    /**
     * Create a padding modifier with all sides
     */
    paddingAll(value: number): Modifier;
};
//# sourceMappingURL=builder.d.ts.map

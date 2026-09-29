// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Generated at: 2026-09-29T16:38:47.299Z
// Plugins: @tachui/modifiers@0.11.7 (verified), @tachui/responsive@0.11.7 (verified), @tachui/grid@0.11.7 (verified), @tachui/viewport@0.11.7 (verified), @tachui/mobile@0.11.7 (verified), @tachui/forms@0.11.7 (verified), @tachui/fragments@0.11.7 (verified)
//
// Run `pnpm --filter @tachui/core generate-modifier-types` to regenerate.

import type { ModifierBuilder, ModifiableComponent } from '../modifiers/types'
import type { ComponentInstance, ComponentProps } from '../runtime/types'

declare module '@tachui/core/modifiers/types' {
  interface ModifierBuilder<T extends ComponentInstance = ComponentInstance> {
    // Accessibility modifiers (16)
    aria(attributes: AriaAttributes): ModifierBuilder<T>;
    ariaDescribedBy(value: string): ModifierBuilder<T>;
    ariaLabel(value: string): ModifierBuilder<T>;
    ariaLive(value: 'off' | 'polite' | 'assertive'): ModifierBuilder<T>;
    ariaModal(value: boolean): ModifierBuilder<T>;
    cssVariables(variables: CSSPropertiesMap): ModifierBuilder<T>;
    customProperties(options: CustomPropertiesOptions): ModifierBuilder<T>;
    customProperty(name: string, value: CSSPropertyValue, scope?: 'local' | 'global' | 'root'): ModifierBuilder<T>;
    data(attributes: DataAttributes): ModifierBuilder<T>;
    elementId(value: IdValue): ModifierBuilder<T>;
    id(value: IdValue): ModifierBuilder<T>;
    /**
     * Sets placeholder text on form inputs and keeps a data attribute in sync.
     * @plugin @tachui/forms (priority 70)
     */
    placeholder(value: PlaceholderValue): ModifierBuilder<T>;
    /**
     * Marks form inputs as required, wiring ARIA attributes and optional custom messaging.
     * @plugin @tachui/forms (priority 72)
     */
    required(options?: RequiredInput): ModifierBuilder<T>;
    role(value: string): ModifierBuilder<T>;
    tabIndex(value: TabIndexValue): ModifierBuilder<T>;
    viewId(value: IdValue): ModifierBuilder<T>;

    // Animation modifiers (2)
    animation(options?: AnimationModifierProps['animation']): ModifierBuilder<T>;
    transform(value: string | Signal<string>): ModifierBuilder<T>;

    // Appearance modifiers (126)
    active(styles: HoverStyles): ModifierBuilder<T>;
    advancedTransform(config: Advanced3DTransformConfig | MatrixTransformConfig): ModifierBuilder<T>;
    animatedShadow(_duration?: number): ModifierBuilder<T>;
    backdropFilter(value: BackdropFilterConfig | string, fallbackColor?: ColorValue): ModifierBuilder<T>;
    backfaceVisibility(value: 'visible' | 'hidden'): ModifierBuilder<T>;
    background(value: string | any): ModifierBuilder<T>;
    backgroundBlendMode(mode: BlendMode): ModifierBuilder<T>;
    backgroundColor(color: string | any): ModifierBuilder<T>;
    backgroundImage(source: ImageAssetProxy | string, options?: BackgroundImageOptions): ModifierBuilder<T>;
    blackAndWhite(contrastAmount?: number): ModifierBuilder<T>;
    blendMode(mode: BlendMode): ModifierBuilder<T>;
    blur(radius: number): ModifierBuilder<T>;
    border(optionsOrWidth: BorderOptions | number | string, color?: string, style?: BorderStyle): ModifierBuilder<T>;
    borderBottom(width: number | string, color: string, style?: BorderStyle): ModifierBuilder<T>;
    borderLeft(width: number | string, color: string, style?: BorderStyle): ModifierBuilder<T>;
    borderRight(width: number | string, color: string, style?: BorderStyle): ModifierBuilder<T>;
    borderTop(width: number | string, color: string, style?: BorderStyle): ModifierBuilder<T>;
    brightness(value: number): ModifierBuilder<T>;
    buttonHover(): ModifierBuilder<T>;
    cardHover(): ModifierBuilder<T>;
    clipped(enabled?: boolean): ModifierBuilder<T>;
    clipShape(shape: ClipShapeName | Shape, parameters?: Record<string, any>): ModifierBuilder<T>;
    colorInvert(): ModifierBuilder<T>;
    compositingGroup(): ModifierBuilder<T>;
    conditionalHover(effect: SwiftUIHoverEffect, isEnabled: boolean | Signal<boolean>): ModifierBuilder<T>;
    contrast(value: number): ModifierBuilder<T>;
    coolTone(hueShift?: string): ModifierBuilder<T>;
    cornerRadius(value: number | Signal<number>): ModifierBuilder<T>;
    customGlassmorphism(blur: number, saturate?: number, brightness?: number, fallbackColor?: ColorValue): ModifierBuilder<T>;
    darkModeInvert(): ModifierBuilder<T>;
    disabledCursor(): ModifierBuilder<T>;
    draggableCursor(): ModifierBuilder<T>;
    dropShadow(config: DropShadowConfig | DropShadowConfig[] | string): ModifierBuilder<T>;
    elevationShadow(level: number): ModifierBuilder<T>;
    faded(contrastAmount?: number, saturationAmount?: number): ModifierBuilder<T>;
    filter(config: FilterConfig | string): ModifierBuilder<T>;
    filterDropShadow(shadow: string): ModifierBuilder<T>;
    focus(styles: HoverStyles): ModifierBuilder<T>;
    font(options: FontOptions | string): ModifierBuilder<T>;
    fontFamily(family: string | AssetValue): ModifierBuilder<T>;
    fontPreset(preset: string): ModifierBuilder<T>;
    fontSize(size: any): ModifierBuilder<T>;
    fontStyle(style: FontStyle): ModifierBuilder<T>;
    fontWeight(weight: any): ModifierBuilder<T>;
    foregroundColor(color: string | any): ModifierBuilder<T>;
    glassmorphism(intensity?: GlassmorphismIntensity, customFallback?: ColorValue): ModifierBuilder<T>;
    glowEffect(color: string, intensity?: number): ModifierBuilder<T>;
    gradientText(gradient: string): ModifierBuilder<T>;
    grayscale(value: number | boolean): ModifierBuilder<T>;
    helpCursor(): ModifierBuilder<T>;
    highContrastMode(): ModifierBuilder<T>;
    highKey(brightnessAmount?: number, contrastAmount?: number): ModifierBuilder<T>;
    hover(styles: HoverStyles, transition?: string | number): ModifierBuilder<T>;
    hoverEffect(effect: SwiftUIHoverEffect, isEnabled?: boolean | Signal<boolean>): ModifierBuilder<T>;
    hoverWithTransition(styles: HoverStyles, duration?: number): ModifierBuilder<T>;
    hueRotate(angle: string | number): ModifierBuilder<T>;
    hueRotation(angle: string): ModifierBuilder<T>;
    hyphens(value: HyphensValue): ModifierBuilder<T>;
    imageHover(): ModifierBuilder<T>;
    insetShadow(config: Omit<ShadowConfig, 'inset'>): ModifierBuilder<T>;
    interactiveCursor(): ModifierBuilder<T>;
    invert(value: number | boolean): ModifierBuilder<T>;
    layeredShadow(layers?: number, opacityMultiplier?: number): ModifierBuilder<T>;
    letterSpacing(value: number | string): ModifierBuilder<T>;
    lineClamp(lines: number): ModifierBuilder<T>;
    lineHeight(value: number | string): ModifierBuilder<T>;
    linkHover(): ModifierBuilder<T>;
    loadingCursor(): ModifierBuilder<T>;
    lowKey(brightnessAmount?: number, contrastAmount?: number): ModifierBuilder<T>;
    matrix(values: [ number, number, number, number, number, number ]): ModifierBuilder<T>;
    matrix3d(values: [ number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number ]): ModifierBuilder<T>;
    neonEffect(color: string, intensity?: number): ModifierBuilder<T>;
    neumorphism(_backgroundColor: string, dark?: boolean): ModifierBuilder<T>;
    neumorphismPressed(_backgroundColor: string, dark?: boolean): ModifierBuilder<T>;
    opacity(value: number | Signal<number>): ModifierBuilder<T>;
    overflow(value: 'visible' | 'hidden' | 'scroll' | 'auto'): ModifierBuilder<T>;
    overflowWrap(value: OverflowWrapValue): ModifierBuilder<T>;
    perspective(value: ReactiveTransformValue<number>): ModifierBuilder<T>;
    perspectiveOrigin(value: string): ModifierBuilder<T>;
    pressed(styles: HoverStyles): ModifierBuilder<T>;
    reactiveShadow(condition: Signal<boolean>, trueShadow: ShadowConfig, falseShadow?: ShadowConfig): ModifierBuilder<T>;
    rotate(angle: ReactiveTransformValue<string | number>): ModifierBuilder<T>;
    rotate3d(x: number, y: number, z: number, angle: string): ModifierBuilder<T>;
    rotateX(angle: ReactiveTransformValue<string | number>): ModifierBuilder<T>;
    rotateY(angle: ReactiveTransformValue<string | number>): ModifierBuilder<T>;
    rotateZ(angle: ReactiveTransformValue<string | number>): ModifierBuilder<T>;
    saturate(value: number): ModifierBuilder<T>;
    saturation(amount: number): ModifierBuilder<T>;
    scale(value: ReactiveTransformValue<number> | { x?: ReactiveTransformValue<number>; y?: ReactiveTransformValue<number>; }): ModifierBuilder<T>;
    scale3d(x: number, y: number, z: number): ModifierBuilder<T>;
    scaleX(value: number): ModifierBuilder<T>;
    scaleY(value: number): ModifierBuilder<T>;
    scaleZ(value: number): ModifierBuilder<T>;
    sepia(value: number | boolean): ModifierBuilder<T>;
    shadow(config: ShadowConfig | ShadowConfig[] | string): ModifierBuilder<T>;
    shadowPreset(preset: ShadowPreset): ModifierBuilder<T>;
    shadows(configs: ShadowConfig[]): ModifierBuilder<T>;
    skew(angles: { x?: ReactiveTransformValue<string | number>; y?: ReactiveTransformValue<string | number>; }): ModifierBuilder<T>;
    softFocus(blurAmount?: number): ModifierBuilder<T>;
    subtleBlur(): ModifierBuilder<T>;
    swiftUIShadow(config?: { color?: string; radius?: number; x?: number; y?: number; }): ModifierBuilder<T>;
    textAlign(value: TextAlign): ModifierBuilder<T>;
    textCase(value: TextTransform): ModifierBuilder<T>;
    textCursor(): ModifierBuilder<T>;
    textDecoration(value: TextDecoration): ModifierBuilder<T>;
    textEmbossed(lightColor?: string, darkColor?: string): ModifierBuilder<T>;
    textEngraved(darkColor?: string, lightColor?: string): ModifierBuilder<T>;
    textOutline(color: string, thickness?: number): ModifierBuilder<T>;
    textOverflow(value: 'clip' | 'ellipsis' | 'fade' | string): ModifierBuilder<T>;
    textShadow(config: ReactiveTextShadowConfig | ReactiveTextShadowConfig[] | string): ModifierBuilder<T>;
    textShadowStrong(color?: string): ModifierBuilder<T>;
    textShadowSubtle(color?: string): ModifierBuilder<T>;
    textTransform(value: TextTransform): ModifierBuilder<T>;
    transformStyle(value: 'flat' | 'preserve-3d'): ModifierBuilder<T>;
    translate(offset: { x?: ReactiveTransformValue<number | string>; y?: ReactiveTransformValue<number | string>; }): ModifierBuilder<T>;
    translate3d(x?: number | string, y?: number | string, z?: number | string): ModifierBuilder<T>;
    translateX(value: number | string): ModifierBuilder<T>;
    translateY(value: number | string): ModifierBuilder<T>;
    translateZ(value: number | string): ModifierBuilder<T>;
    typography(options: TypographyOptions): ModifierBuilder<T>;
    vibrant(saturationAmount?: number, contrastAmount?: number): ModifierBuilder<T>;
    vintagePhoto(sepiaAmount?: number, contrastAmount?: number): ModifierBuilder<T>;
    warmTone(hueShift?: string): ModifierBuilder<T>;
    whiteSpace(value: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces'): ModifierBuilder<T>;
    wordBreak(value: WordBreakValue): ModifierBuilder<T>;
    zoomCursor(mode?: 'in' | 'out'): ModifierBuilder<T>;

    // Custom modifiers (28)
    after(styles: PseudoElementStyles): ModifierBuilder<T>;
    asHTML(options?: AsHTMLOptions): ModifierBuilder<T>;
    badge(color?: string, size?: number, text?: string): ModifierBuilder<T>;
    before(styles: PseudoElementStyles): ModifierBuilder<T>;
    cornerRibbon(text: string, color?: string, textColor?: string): ModifierBuilder<T>;
    css(properties: ReactiveCSSOptions): ModifierBuilder<T>;
    cssProperty(property: string, value: CSSValue): ModifierBuilder<T>;
    cssVariable(name: string, value: CSSValue): ModifierBuilder<T>;
    cursor(value: UtilityOptions['cursor']): ModifierBuilder<T>;
    display(value: UtilityOptions['display']): ModifierBuilder<T>;
    iconAfter(icon: string, styles?: Omit<PseudoElementStyles, 'content'>): ModifierBuilder<T>;
    iconBefore(icon: string, styles?: Omit<PseudoElementStyles, 'content'>): ModifierBuilder<T>;
    lineAfter(color?: string, thickness?: number, length?: number): ModifierBuilder<T>;
    lineBefore(color?: string, thickness?: number, length?: number): ModifierBuilder<T>;
    navigationBarHidden(hidden?: boolean): ModifierBuilder<T>;
    navigationBarItems(options: { leading?: ComponentInstance | ComponentInstance[]; trailing?: ComponentInstance | ComponentInstance[]; }): ModifierBuilder<T>;
    navigationTitle(title: string): ModifierBuilder<T>;
    outline(value: string): ModifierBuilder<T>;
    outlineOffset(value: number | string): ModifierBuilder<T>;
    overflowX(value: UtilityOptions['overflowX']): ModifierBuilder<T>;
    overflowY(value: UtilityOptions['overflowY']): ModifierBuilder<T>;
    pseudoElements(options: PseudoElementOptions): ModifierBuilder<T>;
    quotes(openQuote?: string, closeQuote?: string): ModifierBuilder<T>;
    spinner(size?: number, color?: string, borderWidth?: number): ModifierBuilder<T>;
    task(options: NonNullable<LifecycleModifierProps['task']>): ModifierBuilder<T>;
    tooltip(text: string, position?: 'top' | 'bottom' | 'left' | 'right', backgroundColor?: string, textColor?: string): ModifierBuilder<T>;
    underline(color?: string, thickness?: number, opacity?: number): ModifierBuilder<T>;
    utility(options: ReactiveUtilityOptions): ModifierBuilder<T>;

    // Interaction modifiers (51)
    activatable(): ModifierBuilder<T>;
    /**
     * When false, pointer events pass through the element to what is behind it.
     * @plugin @tachui/modifiers (priority 95)
     */
    allowsHitTesting(enabled: boolean): ModifierBuilder<T>;
    disabled(isDisabled?: boolean | Signal<boolean>): ModifierBuilder<T>;
    editable(): ModifierBuilder<T>;
    /**
     * Makes the element focusable, with optional keyboard activation or editing.
     * @plugin @tachui/modifiers (priority 75)
     */
    focusable(isFocusable?: boolean, interactions?: ('activate' | 'edit')[]): ModifierBuilder<T>;
    /**
     * Focuses or blurs the element, following a signal if given.
     * @plugin @tachui/modifiers (priority 75)
     */
    focused(focusedValue: boolean | Signal<boolean>): ModifierBuilder<T>;
    highPriorityGesture(gesture: any, including?: GestureInclusion): ModifierBuilder<T>;
    /**
     * Marks the component as a fragment that hydrates on the client.
     * @plugin @tachui/fragments (priority 300)
     */
    interactive(): ModifierBuilder<T>;
    /**
     * Calls action when the key is pressed with the given modifier keys.
     * @plugin @tachui/modifiers (priority 80)
     */
    keyboardShortcut(options: KeyboardShortcutOptions): ModifierBuilder<T>;
    /**
     * Executes a callback when the component enters the viewport.
     * @plugin @tachui/viewport (priority 110)
     */
    onAppear(handler: () => void): ModifierBuilder<T>;
    onBlur(callback: (isFocused: boolean) => void): ModifierBuilder<T>;
    onChange(handler: (value: any, event?: Event) => void): ModifierBuilder<T>;
    onContextMenu(callback: (event: MouseEvent) => void): ModifierBuilder<T>;
    /**
     * Reports the pointer location while it hovers the element, and null when it leaves.
     * @plugin @tachui/modifiers (priority 70)
     */
    onContinuousHover(options: OnContinuousHoverOptions): ModifierBuilder<T>;
    onCopy(handler: (event: ClipboardEvent) => void): ModifierBuilder<T>;
    onCut(handler: (event: ClipboardEvent) => void): ModifierBuilder<T>;
    /**
     * Executes a callback when the component leaves the viewport.
     * @plugin @tachui/viewport (priority 110)
     */
    onDisappear(handler: () => void): ModifierBuilder<T>;
    onDoubleClick(callback: (event: MouseEvent) => void): ModifierBuilder<T>;
    onFocus(callback: (isFocused: boolean) => void): ModifierBuilder<T>;
    onHover(callback: (isHovered: boolean) => void): ModifierBuilder<T>;
    onInput(handler: (event: InputEvent) => void): ModifierBuilder<T>;
    onKeyDown(callback: (event: KeyboardEvent) => void): ModifierBuilder<T>;
    onKeyPress(callback: (event: KeyboardEvent) => void): ModifierBuilder<T>;
    onKeyUp(callback: (event: KeyboardEvent) => void): ModifierBuilder<T>;
    /**
     * Calls perform after the pointer is held for minimumDuration without moving past maximumDistance.
     * @plugin @tachui/modifiers (priority 85)
     */
    onLongPressGesture(options: OnLongPressGestureOptions): ModifierBuilder<T>;
    onMouseDown(callback: (event: MouseEvent) => void): ModifierBuilder<T>;
    onMouseEnter(callback: (event: MouseEvent) => void): ModifierBuilder<T>;
    onMouseLeave(callback: (event: MouseEvent) => void): ModifierBuilder<T>;
    onMouseUp(callback: (event: MouseEvent) => void): ModifierBuilder<T>;
    onPaste(handler: (event: ClipboardEvent) => void): ModifierBuilder<T>;
    onScroll(handler: (event: Event) => void): ModifierBuilder<T>;
    onSelect(handler: (event: Event) => void): ModifierBuilder<T>;
    onSwipeLeft(handler: () => void): ModifierBuilder<T>;
    onSwipeRight(handler: () => void): ModifierBuilder<T>;
    onTap(handler: (event: MouseEvent) => void): ModifierBuilder<T>;
    onTouchEnd(handler: (event: TouchEvent) => void): ModifierBuilder<T>;
    onTouchMove(handler: (event: TouchEvent) => void): ModifierBuilder<T>;
    onTouchStart(handler: (event: TouchEvent) => void): ModifierBuilder<T>;
    onWheel(handler: (event: WheelEvent) => void): ModifierBuilder<T>;
    overscrollBehavior(value: OverscrollBehaviorValue): ModifierBuilder<T>;
    overscrollBehaviorX(value: OverscrollBehaviorValue): ModifierBuilder<T>;
    overscrollBehaviorY(value: OverscrollBehaviorValue): ModifierBuilder<T>;
    /**
     * Adds pull-to-refresh gesture support with built-in loading indicator management.
     * @plugin @tachui/mobile (priority 120)
     */
    refreshable(options: RefreshableOptions): ModifierBuilder<T>;
    scroll(config: ScrollConfig): ModifierBuilder<T>;
    scrollBehavior(value: 'auto' | 'smooth'): ModifierBuilder<T>;
    scrollMargin(margin: number | string | { top?: number | string; right?: number | string; bottom?: number | string; left?: number | string; }): ModifierBuilder<T>;
    scrollPadding(padding: number | string | { top?: number | string; right?: number | string; bottom?: number | string; left?: number | string; }): ModifierBuilder<T>;
    scrollSnap(type: 'none' | 'x mandatory' | 'y mandatory' | 'x proximity' | 'y proximity' | 'both mandatory' | 'both proximity', align?: 'start' | 'end' | 'center', stop?: 'normal' | 'always'): ModifierBuilder<T>;
    simultaneousGesture(gesture: any, including?: GestureInclusion): ModifierBuilder<T>;
    /**
     * Captures and restores fragment state across hydration.
     * @plugin @tachui/fragments (priority 300)
     */
    snapshot(properties: FragmentSnapshotHandlers): ModifierBuilder<T>;
    /**
     * Attaches validation rules to form inputs, wiring blur/input handlers and ARIA state.
     * @plugin @tachui/forms (priority 74)
     */
    validation(...rules: ValidationArgs[]): ModifierBuilder<T>;

    // Layout modifiers (60)
    absolutePosition(x: number | Signal<number>, y?: number | Signal<number>): ModifierBuilder<T>;
    alignItems(value: FlexboxOptions['alignItems']): ModifierBuilder<T>;
    alignSelf(value: FlexboxOptions['alignSelf']): ModifierBuilder<T>;
    aspectRatio(ratio?: number, contentMode?: ContentMode): ModifierBuilder<T>;
    fixedSize(horizontal?: boolean, vertical?: boolean): ModifierBuilder<T>;
    flexBasis(value: FlexboxOptions['flexBasis']): ModifierBuilder<T>;
    flexbox(options: ReactiveFlexboxOptions): ModifierBuilder<T>;
    flexDirection(value: FlexboxOptions['flexDirection']): ModifierBuilder<T>;
    flexGrow(value: number): ModifierBuilder<T>;
    flexShrink(value: number): ModifierBuilder<T>;
    flexWrap(value: FlexboxOptions['flexWrap']): ModifierBuilder<T>;
    frame(options: any): ModifierBuilder<T>;
    gap(value: FlexValue): ModifierBuilder<T>;
    /**
     * Places a grid item into a named CSS grid area.
     * @plugin @tachui/grid (priority 180)
     */
    gridArea(area: string): ModifierBuilder<T>;
    /**
     * Aligns a grid item within its cell on horizontal or vertical axes.
     * @plugin @tachui/grid (priority 180)
     */
    gridCellAlignment(alignment: 'start' | 'center' | 'end' | 'stretch', axis?: 'horizontal' | 'vertical' | 'both'): ModifierBuilder<T>;
    /**
     * SwiftUI compatibility alias for gridCellAlignment.
     * @plugin @tachui/grid (priority 180)
     */
    gridCellAnchor(alignment: 'start' | 'center' | 'end' | 'stretch', axis?: 'horizontal' | 'vertical' | 'both'): ModifierBuilder<T>;
    /**
     * SwiftUI compatibility alias for gridColumnSpan.
     * @plugin @tachui/grid (priority 180)
     */
    gridCellColumns(span: ReactiveNumber, start?: ReactiveNumber): ModifierBuilder<T>;
    /**
     * SwiftUI compatibility alias for gridRowSpan.
     * @plugin @tachui/grid (priority 180)
     */
    gridCellRows(span: ReactiveNumber, start?: ReactiveNumber): ModifierBuilder<T>;
    /**
     * Spans a grid item across multiple columns with optional starting column.
     * @plugin @tachui/grid (priority 180)
     */
    gridColumnSpan(span: ReactiveNumber, start?: ReactiveNumber): ModifierBuilder<T>;
    /**
     * Applies a full grid configuration including span, start, area, and alignment.
     * @plugin @tachui/grid (priority 180)
     */
    gridItemConfig(config: GridSpanConfig): ModifierBuilder<T>;
    /**
     * Spans a grid item across multiple rows with optional starting row.
     * @plugin @tachui/grid (priority 180)
     */
    gridRowSpan(span: ReactiveNumber, start?: ReactiveNumber): ModifierBuilder<T>;
    height(value: Dimension | Signal<Dimension>): ModifierBuilder<T>;
    justifyContent(value: FlexboxOptions['justifyContent']): ModifierBuilder<T>;
    layoutPriority(priority: number | Signal<number>): ModifierBuilder<T>;
    margin(optionsOrAll: ReactiveMarginOptions | MarginValue | Signal<MarginValue>): ModifierBuilder<T>;
    marginBottom(value: MarginValue | Signal<MarginValue>): ModifierBuilder<T>;
    marginHorizontal(value: MarginValue | Signal<MarginValue>): ModifierBuilder<T>;
    marginLeading(value: MarginValue | Signal<MarginValue>): ModifierBuilder<T>;
    marginLeft(value: MarginValue | Signal<MarginValue>): ModifierBuilder<T>;
    marginRight(value: MarginValue | Signal<MarginValue>): ModifierBuilder<T>;
    marginTop(value: MarginValue | Signal<MarginValue>): ModifierBuilder<T>;
    marginTrailing(value: MarginValue | Signal<MarginValue>): ModifierBuilder<T>;
    marginVertical(value: MarginValue | Signal<MarginValue>): ModifierBuilder<T>;
    maxHeight(value: Dimension | Signal<Dimension>): ModifierBuilder<T>;
    maxWidth(value: Dimension | Signal<Dimension>): ModifierBuilder<T>;
    /**
     * Attaches custom CSS rules for a media query to a component.
     * @plugin @tachui/responsive (priority 80)
     */
    mediaQuery(query: string, styles: Record<string, any>): ModifierBuilder<T>;
    minHeight(value: Dimension | Signal<Dimension>): ModifierBuilder<T>;
    minWidth(value: Dimension | Signal<Dimension>): ModifierBuilder<T>;
    offset(x: number | Signal<number>, y?: number | Signal<number>): ModifierBuilder<T>;
    overlay(content: OverlayContent, alignmentOrOptions?: OverlayAlignment | Signal<OverlayAlignment> | Omit<OverlayOptions, 'content'>): ModifierBuilder<T>;
    padding(optionsOrAll: ReactivePaddingOptions | PaddingValue | Signal<PaddingValue>): ModifierBuilder<T>;
    paddingBottom(value: PaddingValue | Signal<PaddingValue>): ModifierBuilder<T>;
    paddingHorizontal(value: PaddingValue | Signal<PaddingValue>): ModifierBuilder<T>;
    paddingLeading(value: PaddingValue | Signal<PaddingValue>): ModifierBuilder<T>;
    paddingLeft(value: PaddingValue | Signal<PaddingValue>): ModifierBuilder<T>;
    paddingRight(value: PaddingValue | Signal<PaddingValue>): ModifierBuilder<T>;
    paddingTop(value: PaddingValue | Signal<PaddingValue>): ModifierBuilder<T>;
    paddingTrailing(value: PaddingValue | Signal<PaddingValue>): ModifierBuilder<T>;
    paddingVertical(value: PaddingValue | Signal<PaddingValue>): ModifierBuilder<T>;
    position(value: PositionValue | PositionCoordinates): ModifierBuilder<T>;
    resizable(): ModifierBuilder<T>;
    /**
     * Applies responsive style mappings across configured breakpoints.
     * @plugin @tachui/responsive (priority 80)
     */
    responsive(config: ResponsiveStyleConfig): ModifierBuilder<T>;
    /**
     * Configures responsive flexbox layout properties such as direction, wrap, and gap.
     * @plugin @tachui/responsive (priority 80)
     */
    responsiveLayout(config: { direction?: ResponsiveValue<'row' | 'column' | 'row-reverse' | 'column-reverse'>; wrap?: ResponsiveValue<'nowrap' | 'wrap' | 'wrap-reverse'>; justify?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'>; align?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'>; gap?: ResponsiveValue<number | string>; }): ModifierBuilder<T>;
    /**
     * Creates a responsive modifier from a single style property/value map.
     * @plugin @tachui/responsive (priority 80)
     */
    responsiveProperty(property: string, value: ResponsiveValue<unknown>): ModifierBuilder<T>;
    rotationEffect(angle: number | Signal<number>, anchor?: RotationAnchor): ModifierBuilder<T>;
    scaleEffect(x: number | Signal<number>, y?: number | Signal<number>, anchor?: ScaleAnchor): ModifierBuilder<T>;
    size(options: ReactiveSizeOptions): ModifierBuilder<T>;
    transition(optionsOrProperty: TransitionConfig | string, duration?: number, easing?: string, delay?: number): ModifierBuilder<T>;
    width(value: Dimension | Signal<Dimension>): ModifierBuilder<T>;
    zIndex(value: number): ModifierBuilder<T>;
  }

  interface ModifiableComponent<T extends ComponentProps = ComponentProps> {
    // Accessibility modifiers (16)
    aria(attributes: AriaAttributes): this;
    ariaDescribedBy(value: string): this;
    ariaLabel(value: string): this;
    ariaLive(value: 'off' | 'polite' | 'assertive'): this;
    ariaModal(value: boolean): this;
    cssVariables(variables: CSSPropertiesMap): this;
    customProperties(options: CustomPropertiesOptions): this;
    customProperty(name: string, value: CSSPropertyValue, scope?: 'local' | 'global' | 'root'): this;
    data(attributes: DataAttributes): this;
    elementId(value: IdValue): this;
    id(value: IdValue): this;
    /**
     * Sets placeholder text on form inputs and keeps a data attribute in sync.
     * @plugin @tachui/forms (priority 70)
     */
    placeholder(value: PlaceholderValue): this;
    /**
     * Marks form inputs as required, wiring ARIA attributes and optional custom messaging.
     * @plugin @tachui/forms (priority 72)
     */
    required(options?: RequiredInput): this;
    role(value: string): this;
    tabIndex(value: TabIndexValue): this;
    viewId(value: IdValue): this;

    // Animation modifiers (2)
    animation(options?: AnimationModifierProps['animation']): this;
    transform(value: string | Signal<string>): this;

    // Appearance modifiers (126)
    active(styles: HoverStyles): this;
    advancedTransform(config: Advanced3DTransformConfig | MatrixTransformConfig): this;
    animatedShadow(_duration?: number): this;
    backdropFilter(value: BackdropFilterConfig | string, fallbackColor?: ColorValue): this;
    backfaceVisibility(value: 'visible' | 'hidden'): this;
    background(value: string | any): this;
    backgroundBlendMode(mode: BlendMode): this;
    backgroundColor(color: string | any): this;
    backgroundImage(source: ImageAssetProxy | string, options?: BackgroundImageOptions): this;
    blackAndWhite(contrastAmount?: number): this;
    blendMode(mode: BlendMode): this;
    blur(radius: number): this;
    border(optionsOrWidth: BorderOptions | number | string, color?: string, style?: BorderStyle): this;
    borderBottom(width: number | string, color: string, style?: BorderStyle): this;
    borderLeft(width: number | string, color: string, style?: BorderStyle): this;
    borderRight(width: number | string, color: string, style?: BorderStyle): this;
    borderTop(width: number | string, color: string, style?: BorderStyle): this;
    brightness(value: number): this;
    buttonHover(): this;
    cardHover(): this;
    clipped(enabled?: boolean): this;
    clipShape(shape: ClipShapeName | Shape, parameters?: Record<string, any>): this;
    colorInvert(): this;
    compositingGroup(): this;
    conditionalHover(effect: SwiftUIHoverEffect, isEnabled: boolean | Signal<boolean>): this;
    contrast(value: number): this;
    coolTone(hueShift?: string): this;
    cornerRadius(value: number | Signal<number>): this;
    customGlassmorphism(blur: number, saturate?: number, brightness?: number, fallbackColor?: ColorValue): this;
    darkModeInvert(): this;
    disabledCursor(): this;
    draggableCursor(): this;
    dropShadow(config: DropShadowConfig | DropShadowConfig[] | string): this;
    elevationShadow(level: number): this;
    faded(contrastAmount?: number, saturationAmount?: number): this;
    filter(config: FilterConfig | string): this;
    filterDropShadow(shadow: string): this;
    focus(styles: HoverStyles): this;
    font(options: FontOptions | string): this;
    fontFamily(family: string | AssetValue): this;
    fontPreset(preset: string): this;
    fontSize(size: any): this;
    fontStyle(style: FontStyle): this;
    fontWeight(weight: any): this;
    foregroundColor(color: string | any): this;
    glassmorphism(intensity?: GlassmorphismIntensity, customFallback?: ColorValue): this;
    glowEffect(color: string, intensity?: number): this;
    gradientText(gradient: string): this;
    grayscale(value: number | boolean): this;
    helpCursor(): this;
    highContrastMode(): this;
    highKey(brightnessAmount?: number, contrastAmount?: number): this;
    hover(styles: HoverStyles, transition?: string | number): this;
    hoverEffect(effect: SwiftUIHoverEffect, isEnabled?: boolean | Signal<boolean>): this;
    hoverWithTransition(styles: HoverStyles, duration?: number): this;
    hueRotate(angle: string | number): this;
    hueRotation(angle: string): this;
    hyphens(value: HyphensValue): this;
    imageHover(): this;
    insetShadow(config: Omit<ShadowConfig, 'inset'>): this;
    interactiveCursor(): this;
    invert(value: number | boolean): this;
    layeredShadow(layers?: number, opacityMultiplier?: number): this;
    letterSpacing(value: number | string): this;
    lineClamp(lines: number): this;
    lineHeight(value: number | string): this;
    linkHover(): this;
    loadingCursor(): this;
    lowKey(brightnessAmount?: number, contrastAmount?: number): this;
    matrix(values: [ number, number, number, number, number, number ]): this;
    matrix3d(values: [ number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number ]): this;
    neonEffect(color: string, intensity?: number): this;
    neumorphism(_backgroundColor: string, dark?: boolean): this;
    neumorphismPressed(_backgroundColor: string, dark?: boolean): this;
    opacity(value: number | Signal<number>): this;
    overflow(value: 'visible' | 'hidden' | 'scroll' | 'auto'): this;
    overflowWrap(value: OverflowWrapValue): this;
    perspective(value: ReactiveTransformValue<number>): this;
    perspectiveOrigin(value: string): this;
    pressed(styles: HoverStyles): this;
    reactiveShadow(condition: Signal<boolean>, trueShadow: ShadowConfig, falseShadow?: ShadowConfig): this;
    rotate(angle: ReactiveTransformValue<string | number>): this;
    rotate3d(x: number, y: number, z: number, angle: string): this;
    rotateX(angle: ReactiveTransformValue<string | number>): this;
    rotateY(angle: ReactiveTransformValue<string | number>): this;
    rotateZ(angle: ReactiveTransformValue<string | number>): this;
    saturate(value: number): this;
    saturation(amount: number): this;
    scale(value: ReactiveTransformValue<number> | { x?: ReactiveTransformValue<number>; y?: ReactiveTransformValue<number>; }): this;
    scale3d(x: number, y: number, z: number): this;
    scaleX(value: number): this;
    scaleY(value: number): this;
    scaleZ(value: number): this;
    sepia(value: number | boolean): this;
    shadow(config: ShadowConfig | ShadowConfig[] | string): this;
    shadowPreset(preset: ShadowPreset): this;
    shadows(configs: ShadowConfig[]): this;
    skew(angles: { x?: ReactiveTransformValue<string | number>; y?: ReactiveTransformValue<string | number>; }): this;
    softFocus(blurAmount?: number): this;
    subtleBlur(): this;
    swiftUIShadow(config?: { color?: string; radius?: number; x?: number; y?: number; }): this;
    textAlign(value: TextAlign): this;
    textCase(value: TextTransform): this;
    textCursor(): this;
    textDecoration(value: TextDecoration): this;
    textEmbossed(lightColor?: string, darkColor?: string): this;
    textEngraved(darkColor?: string, lightColor?: string): this;
    textOutline(color: string, thickness?: number): this;
    textOverflow(value: 'clip' | 'ellipsis' | 'fade' | string): this;
    textShadow(config: ReactiveTextShadowConfig | ReactiveTextShadowConfig[] | string): this;
    textShadowStrong(color?: string): this;
    textShadowSubtle(color?: string): this;
    textTransform(value: TextTransform): this;
    transformStyle(value: 'flat' | 'preserve-3d'): this;
    translate(offset: { x?: ReactiveTransformValue<number | string>; y?: ReactiveTransformValue<number | string>; }): this;
    translate3d(x?: number | string, y?: number | string, z?: number | string): this;
    translateX(value: number | string): this;
    translateY(value: number | string): this;
    translateZ(value: number | string): this;
    typography(options: TypographyOptions): this;
    vibrant(saturationAmount?: number, contrastAmount?: number): this;
    vintagePhoto(sepiaAmount?: number, contrastAmount?: number): this;
    warmTone(hueShift?: string): this;
    whiteSpace(value: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces'): this;
    wordBreak(value: WordBreakValue): this;
    zoomCursor(mode?: 'in' | 'out'): this;

    // Custom modifiers (28)
    after(styles: PseudoElementStyles): this;
    asHTML(options?: AsHTMLOptions): this;
    badge(color?: string, size?: number, text?: string): this;
    before(styles: PseudoElementStyles): this;
    cornerRibbon(text: string, color?: string, textColor?: string): this;
    css(properties: ReactiveCSSOptions): this;
    cssProperty(property: string, value: CSSValue): this;
    cssVariable(name: string, value: CSSValue): this;
    cursor(value: UtilityOptions['cursor']): this;
    display(value: UtilityOptions['display']): this;
    iconAfter(icon: string, styles?: Omit<PseudoElementStyles, 'content'>): this;
    iconBefore(icon: string, styles?: Omit<PseudoElementStyles, 'content'>): this;
    lineAfter(color?: string, thickness?: number, length?: number): this;
    lineBefore(color?: string, thickness?: number, length?: number): this;
    navigationBarHidden(hidden?: boolean): this;
    navigationBarItems(options: { leading?: ComponentInstance | ComponentInstance[]; trailing?: ComponentInstance | ComponentInstance[]; }): this;
    navigationTitle(title: string): this;
    outline(value: string): this;
    outlineOffset(value: number | string): this;
    overflowX(value: UtilityOptions['overflowX']): this;
    overflowY(value: UtilityOptions['overflowY']): this;
    pseudoElements(options: PseudoElementOptions): this;
    quotes(openQuote?: string, closeQuote?: string): this;
    spinner(size?: number, color?: string, borderWidth?: number): this;
    task(options: NonNullable<LifecycleModifierProps['task']>): this;
    tooltip(text: string, position?: 'top' | 'bottom' | 'left' | 'right', backgroundColor?: string, textColor?: string): this;
    underline(color?: string, thickness?: number, opacity?: number): this;
    utility(options: ReactiveUtilityOptions): this;

    // Interaction modifiers (51)
    activatable(): this;
    /**
     * When false, pointer events pass through the element to what is behind it.
     * @plugin @tachui/modifiers (priority 95)
     */
    allowsHitTesting(enabled: boolean): this;
    disabled(isDisabled?: boolean | Signal<boolean>): this;
    editable(): this;
    /**
     * Makes the element focusable, with optional keyboard activation or editing.
     * @plugin @tachui/modifiers (priority 75)
     */
    focusable(isFocusable?: boolean, interactions?: ('activate' | 'edit')[]): this;
    /**
     * Focuses or blurs the element, following a signal if given.
     * @plugin @tachui/modifiers (priority 75)
     */
    focused(focusedValue: boolean | Signal<boolean>): this;
    highPriorityGesture(gesture: any, including?: GestureInclusion): this;
    /**
     * Marks the component as a fragment that hydrates on the client.
     * @plugin @tachui/fragments (priority 300)
     */
    interactive(): this;
    /**
     * Calls action when the key is pressed with the given modifier keys.
     * @plugin @tachui/modifiers (priority 80)
     */
    keyboardShortcut(options: KeyboardShortcutOptions): this;
    /**
     * Executes a callback when the component enters the viewport.
     * @plugin @tachui/viewport (priority 110)
     */
    onAppear(handler: () => void): this;
    onBlur(callback: (isFocused: boolean) => void): this;
    onChange(handler: (value: any, event?: Event) => void): this;
    onContextMenu(callback: (event: MouseEvent) => void): this;
    /**
     * Reports the pointer location while it hovers the element, and null when it leaves.
     * @plugin @tachui/modifiers (priority 70)
     */
    onContinuousHover(options: OnContinuousHoverOptions): this;
    onCopy(handler: (event: ClipboardEvent) => void): this;
    onCut(handler: (event: ClipboardEvent) => void): this;
    /**
     * Executes a callback when the component leaves the viewport.
     * @plugin @tachui/viewport (priority 110)
     */
    onDisappear(handler: () => void): this;
    onDoubleClick(callback: (event: MouseEvent) => void): this;
    onFocus(callback: (isFocused: boolean) => void): this;
    onHover(callback: (isHovered: boolean) => void): this;
    onInput(handler: (event: InputEvent) => void): this;
    onKeyDown(callback: (event: KeyboardEvent) => void): this;
    onKeyPress(callback: (event: KeyboardEvent) => void): this;
    onKeyUp(callback: (event: KeyboardEvent) => void): this;
    /**
     * Calls perform after the pointer is held for minimumDuration without moving past maximumDistance.
     * @plugin @tachui/modifiers (priority 85)
     */
    onLongPressGesture(options: OnLongPressGestureOptions): this;
    onMouseDown(callback: (event: MouseEvent) => void): this;
    onMouseEnter(callback: (event: MouseEvent) => void): this;
    onMouseLeave(callback: (event: MouseEvent) => void): this;
    onMouseUp(callback: (event: MouseEvent) => void): this;
    onPaste(handler: (event: ClipboardEvent) => void): this;
    onScroll(handler: (event: Event) => void): this;
    onSelect(handler: (event: Event) => void): this;
    onSwipeLeft(handler: () => void): this;
    onSwipeRight(handler: () => void): this;
    onTap(handler: (event: MouseEvent) => void): this;
    onTouchEnd(handler: (event: TouchEvent) => void): this;
    onTouchMove(handler: (event: TouchEvent) => void): this;
    onTouchStart(handler: (event: TouchEvent) => void): this;
    onWheel(handler: (event: WheelEvent) => void): this;
    overscrollBehavior(value: OverscrollBehaviorValue): this;
    overscrollBehaviorX(value: OverscrollBehaviorValue): this;
    overscrollBehaviorY(value: OverscrollBehaviorValue): this;
    /**
     * Adds pull-to-refresh gesture support with built-in loading indicator management.
     * @plugin @tachui/mobile (priority 120)
     */
    refreshable(options: RefreshableOptions): this;
    scroll(config: ScrollConfig): this;
    scrollBehavior(value: 'auto' | 'smooth'): this;
    scrollMargin(margin: number | string | { top?: number | string; right?: number | string; bottom?: number | string; left?: number | string; }): this;
    scrollPadding(padding: number | string | { top?: number | string; right?: number | string; bottom?: number | string; left?: number | string; }): this;
    scrollSnap(type: 'none' | 'x mandatory' | 'y mandatory' | 'x proximity' | 'y proximity' | 'both mandatory' | 'both proximity', align?: 'start' | 'end' | 'center', stop?: 'normal' | 'always'): this;
    simultaneousGesture(gesture: any, including?: GestureInclusion): this;
    /**
     * Captures and restores fragment state across hydration.
     * @plugin @tachui/fragments (priority 300)
     */
    snapshot(properties: FragmentSnapshotHandlers): this;
    /**
     * Attaches validation rules to form inputs, wiring blur/input handlers and ARIA state.
     * @plugin @tachui/forms (priority 74)
     */
    validation(...rules: ValidationArgs[]): this;

    // Layout modifiers (60)
    absolutePosition(x: number | Signal<number>, y?: number | Signal<number>): this;
    alignItems(value: FlexboxOptions['alignItems']): this;
    alignSelf(value: FlexboxOptions['alignSelf']): this;
    aspectRatio(ratio?: number, contentMode?: ContentMode): this;
    fixedSize(horizontal?: boolean, vertical?: boolean): this;
    flexBasis(value: FlexboxOptions['flexBasis']): this;
    flexbox(options: ReactiveFlexboxOptions): this;
    flexDirection(value: FlexboxOptions['flexDirection']): this;
    flexGrow(value: number): this;
    flexShrink(value: number): this;
    flexWrap(value: FlexboxOptions['flexWrap']): this;
    frame(options: any): this;
    gap(value: FlexValue): this;
    /**
     * Places a grid item into a named CSS grid area.
     * @plugin @tachui/grid (priority 180)
     */
    gridArea(area: string): this;
    /**
     * Aligns a grid item within its cell on horizontal or vertical axes.
     * @plugin @tachui/grid (priority 180)
     */
    gridCellAlignment(alignment: 'start' | 'center' | 'end' | 'stretch', axis?: 'horizontal' | 'vertical' | 'both'): this;
    /**
     * SwiftUI compatibility alias for gridCellAlignment.
     * @plugin @tachui/grid (priority 180)
     */
    gridCellAnchor(alignment: 'start' | 'center' | 'end' | 'stretch', axis?: 'horizontal' | 'vertical' | 'both'): this;
    /**
     * SwiftUI compatibility alias for gridColumnSpan.
     * @plugin @tachui/grid (priority 180)
     */
    gridCellColumns(span: ReactiveNumber, start?: ReactiveNumber): this;
    /**
     * SwiftUI compatibility alias for gridRowSpan.
     * @plugin @tachui/grid (priority 180)
     */
    gridCellRows(span: ReactiveNumber, start?: ReactiveNumber): this;
    /**
     * Spans a grid item across multiple columns with optional starting column.
     * @plugin @tachui/grid (priority 180)
     */
    gridColumnSpan(span: ReactiveNumber, start?: ReactiveNumber): this;
    /**
     * Applies a full grid configuration including span, start, area, and alignment.
     * @plugin @tachui/grid (priority 180)
     */
    gridItemConfig(config: GridSpanConfig): this;
    /**
     * Spans a grid item across multiple rows with optional starting row.
     * @plugin @tachui/grid (priority 180)
     */
    gridRowSpan(span: ReactiveNumber, start?: ReactiveNumber): this;
    height(value: Dimension | Signal<Dimension>): this;
    justifyContent(value: FlexboxOptions['justifyContent']): this;
    layoutPriority(priority: number | Signal<number>): this;
    margin(optionsOrAll: ReactiveMarginOptions | MarginValue | Signal<MarginValue>): this;
    marginBottom(value: MarginValue | Signal<MarginValue>): this;
    marginHorizontal(value: MarginValue | Signal<MarginValue>): this;
    marginLeading(value: MarginValue | Signal<MarginValue>): this;
    marginLeft(value: MarginValue | Signal<MarginValue>): this;
    marginRight(value: MarginValue | Signal<MarginValue>): this;
    marginTop(value: MarginValue | Signal<MarginValue>): this;
    marginTrailing(value: MarginValue | Signal<MarginValue>): this;
    marginVertical(value: MarginValue | Signal<MarginValue>): this;
    maxHeight(value: Dimension | Signal<Dimension>): this;
    maxWidth(value: Dimension | Signal<Dimension>): this;
    /**
     * Attaches custom CSS rules for a media query to a component.
     * @plugin @tachui/responsive (priority 80)
     */
    mediaQuery(query: string, styles: Record<string, any>): this;
    minHeight(value: Dimension | Signal<Dimension>): this;
    minWidth(value: Dimension | Signal<Dimension>): this;
    offset(x: number | Signal<number>, y?: number | Signal<number>): this;
    overlay(content: OverlayContent, alignmentOrOptions?: OverlayAlignment | Signal<OverlayAlignment> | Omit<OverlayOptions, 'content'>): this;
    padding(optionsOrAll: ReactivePaddingOptions | PaddingValue | Signal<PaddingValue>): this;
    paddingBottom(value: PaddingValue | Signal<PaddingValue>): this;
    paddingHorizontal(value: PaddingValue | Signal<PaddingValue>): this;
    paddingLeading(value: PaddingValue | Signal<PaddingValue>): this;
    paddingLeft(value: PaddingValue | Signal<PaddingValue>): this;
    paddingRight(value: PaddingValue | Signal<PaddingValue>): this;
    paddingTop(value: PaddingValue | Signal<PaddingValue>): this;
    paddingTrailing(value: PaddingValue | Signal<PaddingValue>): this;
    paddingVertical(value: PaddingValue | Signal<PaddingValue>): this;
    position(value: PositionValue | PositionCoordinates): this;
    resizable(): this;
    /**
     * Applies responsive style mappings across configured breakpoints.
     * @plugin @tachui/responsive (priority 80)
     */
    responsive(config: ResponsiveStyleConfig): this;
    /**
     * Configures responsive flexbox layout properties such as direction, wrap, and gap.
     * @plugin @tachui/responsive (priority 80)
     */
    responsiveLayout(config: { direction?: ResponsiveValue<'row' | 'column' | 'row-reverse' | 'column-reverse'>; wrap?: ResponsiveValue<'nowrap' | 'wrap' | 'wrap-reverse'>; justify?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'>; align?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'>; gap?: ResponsiveValue<number | string>; }): this;
    /**
     * Creates a responsive modifier from a single style property/value map.
     * @plugin @tachui/responsive (priority 80)
     */
    responsiveProperty(property: string, value: ResponsiveValue<unknown>): this;
    rotationEffect(angle: number | Signal<number>, anchor?: RotationAnchor): this;
    scaleEffect(x: number | Signal<number>, y?: number | Signal<number>, anchor?: ScaleAnchor): this;
    size(options: ReactiveSizeOptions): this;
    transition(optionsOrProperty: TransitionConfig | string, duration?: number, easing?: string, delay?: number): this;
    width(value: Dimension | Signal<Dimension>): this;
    zIndex(value: number): this;
  }
}

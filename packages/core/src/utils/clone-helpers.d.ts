import type { ComponentInstance, CloneOptions } from '../runtime/types';
export declare function clonePropsPreservingReactivity<T extends Record<string, unknown>>(props: T, options?: CloneOptions): T;
export declare function createResetLifecycleState(): {
    mounted: boolean;
    cleanup: (() => void)[];
    domElements: Map<string, Element> | undefined;
    primaryElement: Element | undefined;
    domReady: boolean;
};
export declare function resetLifecycleState(target: ComponentInstance): void;
//# sourceMappingURL=clone-helpers.d.ts.map
/**
 * Event Delegation System (Phase 3)
 *
 * Provides centralized event handling to reduce per-element listener overhead.
 * Instead of attaching N listeners for N elements, we attach 1 listener per event type
 * at the container level and route events to the correct handlers.
 */
type EventHandler = (event: Event) => void;
export declare class EventDelegator {
    private containerListeners;
    private elementHandlers;
    private handlerCounts;
    /**
     * Register an event handler with delegation
     */
    register(container: Element, element: Element, eventType: string, handler: EventHandler): () => void;
    /**
     * Unregister an event handler
     */
    private unregister;
    /**
     * Ensure root listener exists for event type on container
     */
    private ensureRootListener;
    /**
     * Remove root listener for event type on container
     */
    private removeRootListener;
    /**
     * Handle delegated event by finding target handler
     */
    private handleDelegatedEvent;
    /**
     * Check if event type should use delegation
     */
    shouldDelegate(eventType: string): boolean;
    /**
     * Check if event type should use passive listeners
     */
    shouldBePassive(eventType: string): boolean;
    /**
     * Get metrics for debugging
     */
    getMetrics(container: Element): {
        eventTypes: string[];
        totalHandlers: number;
        handlersPerType: Record<string, number>;
    };
    /**
     * Cleanup all handlers for a container
     */
    cleanupContainer(container: Element): void;
}
/**
 * Global event delegator instance
 */
export declare const globalEventDelegator: EventDelegator;
//# sourceMappingURL=event-delegation.d.ts.map

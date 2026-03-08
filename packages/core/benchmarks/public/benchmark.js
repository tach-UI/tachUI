var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/reactive/types.ts
var types_exports = {};
__reExport(types_exports, reactive_star);
import * as reactive_star from "@tachui/types/reactive";

// src/reactive/context.ts
var computationIdCounter = 0;
var ownerIdCounter = 0;
var moduleInstanceId = Math.random().toString(36).substr(2, 6);
var currentComputation = null;
var currentOwner = null;
var isBatching = false;
var moduleInstances = /* @__PURE__ */ new Set();
moduleInstances.add(moduleInstanceId);
var reactiveContext = {
  get currentComputation() {
    return currentComputation;
  },
  set currentComputation(value) {
    currentComputation = value;
  },
  get currentOwner() {
    return currentOwner;
  },
  set currentOwner(value) {
    currentOwner = value;
  },
  get isBatching() {
    return isBatching;
  },
  set isBatching(value) {
    isBatching = value;
  }
};
function getCurrentComputation() {
  const computation = reactiveContext.currentComputation;
  return computation;
}
function getCurrentOwner() {
  return reactiveContext.currentOwner;
}
function isBatchingUpdates() {
  return reactiveContext.isBatching;
}
var OwnerImpl = class {
  constructor(parent = null) {
    __publicField(this, "id");
    __publicField(this, "parent");
    __publicField(this, "context", /* @__PURE__ */ new Map());
    __publicField(this, "cleanups", []);
    __publicField(this, "sources", /* @__PURE__ */ new Set());
    __publicField(this, "disposed", false);
    this.id = ++ownerIdCounter;
    this.parent = parent;
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const computation of this.sources) {
      computation.dispose();
    }
    this.sources.clear();
    for (const cleanup of this.cleanups) {
      try {
        cleanup();
      } catch (error) {
        console.error("Error in cleanup function:", error);
      }
    }
    this.cleanups.length = 0;
    if (this.parent && !this.parent.disposed) {
      this.parent.sources.delete(this);
    }
  }
};
var ComputationImpl = class {
  constructor(fn, owner = null) {
    __publicField(this, "id");
    __publicField(this, "owner");
    __publicField(this, "fn");
    __publicField(this, "sources", /* @__PURE__ */ new Set());
    // Signals this computation depends on
    __publicField(this, "observers", /* @__PURE__ */ new Set());
    // Computations that depend on this
    __publicField(this, "state", types_exports.ComputationState.Dirty);
    __publicField(this, "value");
    this.id = ++computationIdCounter;
    this.fn = fn;
    this.owner = owner;
    if (owner && !owner.disposed) {
      owner.sources.add(this);
    }
  }
  execute() {
    if (this.state === types_exports.ComputationState.Disposed) {
      return this.value;
    }
    for (const source of this.sources) {
      if (source && typeof source === "object" && "removeObserver" in source) {
        ;
        source.removeObserver(this);
      }
    }
    this.sources.clear();
    const prevComputation = reactiveContext.currentComputation;
    reactiveContext.currentComputation = this;
    try {
      this.state = types_exports.ComputationState.Clean;
      this.value = this.fn();
      return this.value;
    } catch (error) {
      this.state = types_exports.ComputationState.Disposed;
      if (typeof process === "undefined" || true) {
        console.error("Error in computation:", error);
      }
      throw error;
    } finally {
      reactiveContext.currentComputation = prevComputation;
    }
  }
  dispose() {
    if (this.state === types_exports.ComputationState.Disposed) return;
    this.state = types_exports.ComputationState.Disposed;
    for (const source of this.sources) {
      if (source && typeof source === "object" && "removeObserver" in source) {
        ;
        source.removeObserver(this);
      }
    }
    this.sources.clear();
    for (const observer of this.observers) {
      observer.sources.delete(this);
    }
    this.observers.clear();
    if (this.owner && !this.owner.disposed) {
      this.owner.sources.delete(this);
    }
  }
};
function createRoot(fn) {
  const owner = new OwnerImpl(reactiveContext.currentOwner);
  const prevOwner = reactiveContext.currentOwner;
  reactiveContext.currentOwner = owner;
  try {
    return fn(() => owner.dispose());
  } finally {
    reactiveContext.currentOwner = prevOwner;
  }
}
var flushFunction = null;
function setFlushFunction(fn) {
  flushFunction = fn;
}

// src/reactive/cleanup.ts
function onCleanup(fn) {
  const owner = getCurrentOwner();
  if (owner && !owner.disposed) {
    owner.cleanups.push(fn);
  } else if (__DEV__) {
    console.warn("onCleanup called outside of reactive context");
  }
}
if (typeof globalThis.__DEV__ === "undefined") {
  ;
  globalThis.__DEV__ = true;
}

// src/reactive/equality.ts
var defaultEquals = (a, b) => a === b;

// src/reactive/unified-scheduler.ts
var UpdatePriority = /* @__PURE__ */ ((UpdatePriority2) => {
  UpdatePriority2[UpdatePriority2["Immediate"] = 0] = "Immediate";
  UpdatePriority2[UpdatePriority2["High"] = 1] = "High";
  UpdatePriority2[UpdatePriority2["Normal"] = 2] = "Normal";
  UpdatePriority2[UpdatePriority2["Low"] = 3] = "Low";
  UpdatePriority2[UpdatePriority2["Idle"] = 4] = "Idle";
  return UpdatePriority2;
})(UpdatePriority || {});
var ReactiveError = class extends Error {
  constructor(message, cause, node) {
    super(message);
    this.cause = cause;
    this.node = node;
    this.name = "ReactiveError";
  }
};
var _ReactiveScheduler = class _ReactiveScheduler {
  constructor() {
    __publicField(this, "updateQueues", /* @__PURE__ */ new Map());
    __publicField(this, "isFlushPending", false);
    __publicField(this, "isDestroyed", false);
    // Error handling
    __publicField(this, "errorHandlers", /* @__PURE__ */ new Set());
    __publicField(this, "maxRetries", 3);
    // Performance tracking
    __publicField(this, "totalUpdateCycles", 0);
    __publicField(this, "totalUpdateTime", 0);
    __publicField(this, "errorCount", 0);
    __publicField(this, "nodeRegistry", /* @__PURE__ */ new WeakSet());
    for (const priority of Object.values(UpdatePriority)) {
      if (typeof priority === "number") {
        this.updateQueues.set(priority, /* @__PURE__ */ new Set());
      }
    }
  }
  static getInstance() {
    if (!_ReactiveScheduler.instance) {
      _ReactiveScheduler.instance = new _ReactiveScheduler();
    }
    return _ReactiveScheduler.instance;
  }
  /**
   * Schedule reactive node for update
   */
  schedule(node) {
    if (this.isDestroyed) return;
    this.nodeRegistry.add(node);
    const queue = this.getQueue(node.priority);
    queue.add(node);
    if (!this.isFlushPending) {
      this.isFlushPending = true;
      this.scheduleFlush(node.priority);
    }
  }
  /**
   * Process all queued updates by priority
   */
  async flush() {
    if (this.isDestroyed) return;
    this.isFlushPending = false;
    const startTime = performance.now();
    try {
      for (const priority of [
        0 /* Immediate */,
        1 /* High */,
        2 /* Normal */,
        3 /* Low */,
        4 /* Idle */
      ]) {
        const queue = this.updateQueues.get(priority);
        if (!queue || queue.size === 0) continue;
        const nodesToUpdate = Array.from(queue);
        queue.clear();
        for (const node of nodesToUpdate) {
          try {
            await this.updateNodeWithRetry(node);
          } catch (error) {
            this.handleReactiveError(
              new ReactiveError(`Failed to update ${node.type} node ${node.id}`, error, node)
            );
          }
        }
        if (this.hasHigherPriorityWork(priority)) {
          return this.flush();
        }
      }
      this.totalUpdateCycles++;
    } finally {
      const endTime = performance.now();
      this.totalUpdateTime += endTime - startTime;
    }
  }
  /**
   * Update node with retry logic
   */
  async updateNodeWithRetry(node, attempt = 1) {
    try {
      node.notify();
    } catch (error) {
      if (attempt < this.maxRetries) {
        console.warn(`Reactive update failed, retrying (${attempt}/${this.maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, attempt * 10));
        return this.updateNodeWithRetry(node, attempt + 1);
      } else {
        throw error;
      }
    }
  }
  /**
   * Schedule flush based on priority
   */
  scheduleFlush(priority) {
    switch (priority) {
      case 0 /* Immediate */:
        void this.flush();
        break;
      case 1 /* High */:
        queueMicrotask(() => this.flush());
        break;
      case 2 /* Normal */:
        if (typeof requestAnimationFrame !== "undefined") {
          requestAnimationFrame(() => this.flush());
        } else {
          queueMicrotask(() => this.flush());
        }
        break;
      case 3 /* Low */:
      case 4 /* Idle */:
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(() => this.flush(), { timeout: 1e3 });
        } else {
          setTimeout(() => this.flush(), 50);
        }
        break;
    }
  }
  /**
   * Check if there's higher priority work waiting
   */
  hasHigherPriorityWork(currentPriority) {
    for (let priority = 0 /* Immediate */; priority < currentPriority; priority++) {
      const queue = this.updateQueues.get(priority);
      if (queue && queue.size > 0) {
        return true;
      }
    }
    return false;
  }
  /**
   * Get queue for priority level
   */
  getQueue(priority) {
    const queue = this.updateQueues.get(priority);
    if (!queue) {
      throw new Error(`Invalid priority level: ${priority}`);
    }
    return queue;
  }
  /**
   * Register error handler
   */
  onError(handler) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }
  /**
   * Handle reactive errors with recovery
   */
  handleReactiveError(error) {
    this.errorCount++;
    let handled = false;
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
        handled = true;
      } catch (handlerError) {
        console.error("Error handler threw error:", handlerError);
      }
    }
    if (!handled) {
      console.error("Unhandled reactive error:", error);
      if (true) {
        throw error;
      }
    }
  }
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    let totalNodes = 0;
    for (const queue of this.updateQueues.values()) {
      totalNodes += queue.size;
    }
    return {
      totalNodes,
      updateCycles: this.totalUpdateCycles,
      averageUpdateTime: this.totalUpdateCycles > 0 ? this.totalUpdateTime / this.totalUpdateCycles : 0,
      memoryUsage: this.estimateMemoryUsage(),
      errorCount: this.errorCount
    };
  }
  /**
   * Estimate memory usage (rough approximation)
   */
  estimateMemoryUsage() {
    let usage = 0;
    for (const queue of this.updateQueues.values()) {
      usage += queue.size * 50;
    }
    usage += this.errorHandlers.size * 100;
    return usage;
  }
  /**
   * Check if node is scheduled
   */
  hasNode(node) {
    for (const queue of this.updateQueues.values()) {
      if (queue.has(node)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Flush all pending updates synchronously
   */
  flushSync() {
    if (this.isFlushPending) {
      this.isFlushPending = false;
      void this.flush();
    }
  }
  /**
   * Clear all pending updates
   */
  clearPending() {
    for (const queue of this.updateQueues.values()) {
      queue.clear();
    }
    this.isFlushPending = false;
  }
  /**
   * Cleanup all reactive nodes and destroy scheduler
   */
  destroy() {
    this.isDestroyed = true;
    for (const queue of this.updateQueues.values()) {
      for (const node of queue) {
        try {
          node.cleanup();
        } catch (error) {
          console.error("Error cleaning up reactive node:", error);
        }
      }
      queue.clear();
    }
    this.updateQueues.clear();
    this.errorHandlers.clear();
    _ReactiveScheduler.instance = null;
  }
  /**
   * Get debug information
   */
  getDebugInfo() {
    const queueInfo = {};
    for (const [priority, queue] of this.updateQueues) {
      queueInfo[UpdatePriority[priority]] = queue.size;
    }
    return {
      isFlushPending: this.isFlushPending,
      isDestroyed: this.isDestroyed,
      queueSizes: queueInfo,
      errorHandlerCount: this.errorHandlers.size,
      performance: this.getPerformanceMetrics()
    };
  }
};
__publicField(_ReactiveScheduler, "instance", null);
var ReactiveScheduler = _ReactiveScheduler;

// src/reactive/computed.ts
var ComputedImpl = class extends ComputationImpl {
  constructor(fn, options = {}, owner = getCurrentOwner()) {
    super(fn, owner);
    __publicField(this, "type", "computed");
    __publicField(this, "priority");
    __publicField(this, "_hasValue", false);
    __publicField(this, "_error", null);
    __publicField(this, "equalsFn");
    __publicField(this, "options");
    this.priority = options.priority ?? 2 /* Normal */;
    this.equalsFn = options.equals ?? defaultEquals;
    this.options = options;
  }
  /**
   * Get the computed value, tracking dependency and lazily computing
   */
  getValue() {
    const computation = getCurrentComputation();
    if (computation && computation.state !== types_exports.ComputationState.Disposed) {
      this.observers.add(computation);
      computation.sources.add(this);
    }
    if (this.state === types_exports.ComputationState.Dirty || !this._hasValue) {
      this.execute();
      this._hasValue = true;
    }
    return this.value;
  }
  /**
   * Get the current value without tracking dependency
   */
  peek() {
    if (this.state === types_exports.ComputationState.Dirty || !this._hasValue) {
      this.execute();
      this._hasValue = true;
    }
    return this.value;
  }
  /**
   * Remove an observer (cleanup)
   */
  removeObserver(computation) {
    this.observers.delete(computation);
  }
  /**
   * Execute the computation and notify observers
   */
  execute() {
    const previousValue = this._hasValue ? this.value : void 0;
    const result = super.execute();
    if (!this._hasValue || !this.equalsFn(previousValue, result)) {
      for (const observer of this.observers) {
        if (observer.state !== types_exports.ComputationState.Disposed) {
          observer.state = types_exports.ComputationState.Dirty;
          if ("execute" in observer && typeof observer.execute === "function") {
            queueMicrotask(() => {
              if (observer.state === types_exports.ComputationState.Dirty) {
                observer.execute();
              }
            });
          }
        }
      }
    }
    return result;
  }
  /**
   * Notify method for ReactiveNode compatibility
   */
  notify() {
    this.execute();
  }
  /**
   * Complete cleanup for memory management
   */
  cleanup() {
    for (const source of this.sources) {
      if ("removeObserver" in source) {
        ;
        source.removeObserver(this);
      }
    }
    this.sources.clear();
    for (const observer of this.observers) {
      observer.sources.delete(this);
    }
    this.observers.clear();
    this._hasValue = false;
    this._error = null;
    this.state = types_exports.ComputationState.Disposed;
  }
  /**
   * Dispose the computed value
   */
  dispose() {
    this.cleanup();
    super.dispose();
  }
  /**
   * Debug information
   */
  [Symbol.for("tachui.debug")]() {
    return {
      id: this.id,
      type: this.type,
      value: this._hasValue ? this.value : void 0,
      hasValue: this._hasValue,
      error: this._error?.message,
      state: this.state,
      sourceCount: this.sources.size,
      observerCount: this.observers.size,
      priority: UpdatePriority[this.priority],
      debugName: this.options.debugName,
      equalsFn: this.equalsFn.name || "anonymous"
    };
  }
  toString() {
    return `Computed(${this.options.debugName || this.id}): ${this._hasValue ? this.value : "no value"}`;
  }
};
function createComputed(fn, options) {
  const computed = new ComputedImpl(fn, options);
  const accessor = computed.getValue.bind(computed);
  accessor.peek = computed.peek.bind(computed);
  Object.defineProperty(accessor, Symbol.for("tachui.computed"), {
    value: computed,
    enumerable: false
  });
  return accessor;
}
function isComputed(value) {
  return typeof value === "function" && Symbol.for("tachui.computed") in value;
}

// src/reactive/effect.ts
function createEffect(fn, options = {}) {
  const owner = getCurrentOwner();
  let previousValue;
  let isFirst = true;
  const effectFn = () => {
    const nextValue = fn(previousValue);
    if (!isFirst) {
      previousValue = nextValue;
    } else {
      isFirst = false;
      previousValue = nextValue;
    }
    return nextValue;
  };
  const effect = new ComputationImpl(effectFn, owner);
  if (options.name) {
    Object.defineProperty(effect, "name", {
      value: options.name,
      enumerable: false
    });
  }
  effect.execute();
  return effect;
}

// src/reactive/enhanced-effect.ts
var effectIdCounter = 0;
var EffectImpl = class {
  constructor(effectFn, options = {}) {
    this.effectFn = effectFn;
    __publicField(this, "id", ++effectIdCounter);
    __publicField(this, "type", "effect");
    __publicField(this, "priority");
    __publicField(this, "sources", /* @__PURE__ */ new Set());
    __publicField(this, "observers", /* @__PURE__ */ new Set());
    // Effects don't have observers
    __publicField(this, "isDisposed", false);
    __publicField(this, "cleanupFn");
    __publicField(this, "options");
    __publicField(this, "owner");
    this.priority = options.priority ?? 2 /* Normal */;
    this.options = options;
    this.owner = getCurrentOwner();
    if (options.fireImmediately !== false) {
      this.execute();
    }
  }
  /**
   * Notify method called by unified scheduler
   */
  notify() {
    if (this.isDisposed) return;
    this.execute();
  }
  /**
   * Execute the effect with proper error handling
   */
  execute() {
    if (this.isDisposed) return;
    if (this.cleanupFn) {
      try {
        this.cleanupFn();
      } catch (error) {
        console.error("Effect cleanup error:", error);
      }
      this.cleanupFn = void 0;
    }
    for (const source of this.sources) {
      if ("removeObserver" in source && typeof source.removeObserver === "function") {
        source.removeObserver(this);
      } else if ("observers" in source && source.observers instanceof Set) {
        source.observers.delete(this);
      }
    }
    this.sources.clear();
    const previousComputation = getCurrentComputation();
    const setCurrentComputation = this.setCurrentComputation || (() => {
    });
    setCurrentComputation(this);
    try {
      const result = this.effectFn();
      if (typeof result === "function") {
        this.cleanupFn = result;
      }
    } catch (error) {
      if (this.options.onError) {
        try {
          this.options.onError(error);
        } catch (handlerError) {
          console.error("Effect error handler threw error:", handlerError);
          throw error;
        }
      } else {
        console.error(`Effect ${this.options.debugName || this.id} threw error:`, error);
        throw error;
      }
    } finally {
      setCurrentComputation(previousComputation);
    }
  }
  /**
   * Complete cleanup for memory management
   */
  cleanup() {
    this.isDisposed = true;
    if (this.cleanupFn) {
      try {
        this.cleanupFn();
      } catch (error) {
        console.error("Effect cleanup error:", error);
      }
      this.cleanupFn = void 0;
    }
    for (const source of this.sources) {
      if ("removeObserver" in source && typeof source.removeObserver === "function") {
        source.removeObserver(this);
      } else if ("observers" in source && source.observers instanceof Set) {
        source.observers.delete(this);
      }
    }
    this.sources.clear();
    if (this.owner?.cleanups) {
      const index = this.owner.cleanups.indexOf(this.cleanup.bind(this));
      if (index >= 0) {
        this.owner.cleanups.splice(index, 1);
      }
    }
  }
  /**
   * Dispose the effect (alias for cleanup)
   */
  dispose() {
    this.cleanup();
  }
  /**
   * Check if effect is disposed
   */
  get disposed() {
    return this.isDisposed;
  }
  /**
   * Debug information
   */
  [Symbol.for("tachui.debug")]() {
    return {
      id: this.id,
      type: this.type,
      priority: UpdatePriority[this.priority],
      debugName: this.options.debugName,
      disposed: this.isDisposed,
      sourceCount: this.sources.size,
      hasCleanup: !!this.cleanupFn
    };
  }
  toString() {
    return `Effect(${this.options.debugName || this.id})`;
  }
};

// src/reactive/enhanced-signal.ts
var signalIdCounter = 0;
var EnhancedSignalImpl = class {
  constructor(initialValue, options = {}) {
    __publicField(this, "id", ++signalIdCounter);
    __publicField(this, "type", "signal");
    __publicField(this, "priority");
    __publicField(this, "observers", /* @__PURE__ */ new Set());
    __publicField(this, "_value");
    __publicField(this, "scheduler", ReactiveScheduler.getInstance());
    __publicField(this, "equalsFn");
    __publicField(this, "debugName");
    __publicField(this, "options");
    this._value = initialValue;
    this.options = options;
    this.priority = options.priority ?? 2 /* Normal */;
    this.equalsFn = options.equals ?? defaultEquals;
    this.debugName = options.debugName;
  }
  /**
   * Get the current value and track dependency
   */
  getValue() {
    const computation = getCurrentComputation();
    if (computation && computation.state !== types_exports.ComputationState.Disposed) {
      this.observers.add(computation);
      computation.sources.add(this);
    }
    return this._value;
  }
  /**
   * Get the current value without tracking dependency
   */
  peek() {
    return this._value;
  }
  /**
   * Set a new value using custom equality function
   */
  setValue(newValue) {
    const value = typeof newValue === "function" ? newValue(this._value) : newValue;
    if (!this.equalsFn(value, this._value)) {
      const oldValue = this._value;
      this._value = value;
      if (this.debugName) {
        console.debug(`[Signal:${this.debugName}] ${oldValue} -> ${value}`);
      }
      this.scheduler.schedule(this);
    }
    return value;
  }
  /**
   * Notify all observers (called by scheduler)
   */
  notify() {
    for (const observer of this.observers) {
      if (observer.state !== types_exports.ComputationState.Disposed) {
        observer.state = types_exports.ComputationState.Dirty;
        if ("type" in observer && "priority" in observer) {
          this.scheduler.schedule(observer);
        }
      }
    }
  }
  /**
   * Remove an observer (cleanup)
   */
  removeObserver(computation) {
    this.observers.delete(computation);
  }
  /**
   * Complete cleanup for memory management
   */
  cleanup() {
    for (const observer of this.observers) {
      observer.sources.delete(this);
    }
    this.observers.clear();
  }
  /**
   * Get debug information about this signal
   */
  [Symbol.for("tachui.debug")]() {
    return {
      id: this.id,
      type: this.type,
      value: this._value,
      observerCount: this.observers.size,
      priority: UpdatePriority[this.priority],
      debugName: this.debugName,
      equalsFn: this.equalsFn.name || "anonymous"
    };
  }
  toString() {
    return `Signal(${this.options.debugName || this.id}): ${this._value}`;
  }
};

// src/reactive/signal.ts
var signalIdCounter2 = 0;
var SignalImpl = class {
  constructor(initialValue) {
    __publicField(this, "id");
    __publicField(this, "observers", /* @__PURE__ */ new Set());
    __publicField(this, "_value");
    this.id = ++signalIdCounter2;
    this._value = initialValue;
  }
  /**
   * Get the current value and track dependency
   */
  getValue() {
    const computation = getCurrentComputation();
    if (computation && computation.state !== types_exports.ComputationState.Disposed) {
      this.observers.add(computation);
      computation.sources.add(this);
    } else {
    }
    return this._value;
  }
  /**
   * Get the current value without tracking dependency
   */
  peek() {
    return this._value;
  }
  /**
   * Set a new value and notify observers
   */
  set(newValue) {
    const value = typeof newValue === "function" ? newValue(this._value) : newValue;
    if (value !== this._value) {
      this._value = value;
      this.notify();
    } else {
    }
    return value;
  }
  /**
   * Notify all observers that this signal has changed
   */
  notify() {
    for (const observer of this.observers) {
      if (observer.state !== types_exports.ComputationState.Disposed) {
        observer.state = types_exports.ComputationState.Dirty;
        scheduleUpdate(observer);
      } else {
      }
    }
  }
  /**
   * Remove an observer (cleanup)
   */
  removeObserver(computation) {
    this.observers.delete(computation);
  }
  /**
   * Get debug information about this signal
   */
  [Symbol.for("tachui.debug")]() {
    return {
      id: this.id,
      value: this._value,
      observerCount: this.observers.size,
      type: "Signal"
    };
  }
};
var updateQueue = /* @__PURE__ */ new Set();
var isFlushingUpdates = false;
function scheduleUpdate(computation) {
  updateQueue.add(computation);
  if (!isFlushingUpdates && !isBatchingUpdates()) {
    queueMicrotask(flushUpdates);
  }
}
function flushUpdates() {
  if (isFlushingUpdates) return;
  isFlushingUpdates = true;
  try {
    while (updateQueue.size > 0) {
      const computations = Array.from(updateQueue).sort((a, b) => a.id - b.id);
      updateQueue.clear();
      for (const computation of computations) {
        if (computation.state === types_exports.ComputationState.Dirty) {
          computation.execute();
        }
      }
    }
  } finally {
    isFlushingUpdates = false;
  }
}
function createSignal(initialValue) {
  const signal = new SignalImpl(initialValue);
  const getter = signal.getValue.bind(signal);
  getter.peek = signal.peek.bind(signal);
  const setter = signal.set.bind(signal);
  Object.defineProperty(getter, Symbol.for("tachui.signal"), {
    value: signal,
    enumerable: false
  });
  return [getter, setter];
}
function isSignal(value) {
  return typeof value === "function" && Symbol.for("tachui.signal") in value;
}
setFlushFunction(flushUpdates);

// src/reactive/scheduler.ts
var MicrotaskScheduler = class {
  constructor() {
    __publicField(this, "pending", /* @__PURE__ */ new Set());
    __publicField(this, "isFlushScheduled", false);
  }
  schedule(fn) {
    this.pending.add(fn);
    if (!this.isFlushScheduled) {
      this.isFlushScheduled = true;
      queueMicrotask(() => this.flush());
    }
  }
  flush() {
    if (this.pending.size === 0) {
      this.isFlushScheduled = false;
      return;
    }
    const tasks = Array.from(this.pending);
    this.pending.clear();
    this.isFlushScheduled = false;
    for (const task of tasks) {
      try {
        task();
      } catch (error) {
        console.error("Error in scheduled task:", error);
      }
    }
    if (this.pending.size > 0) {
      this.isFlushScheduled = true;
      queueMicrotask(() => this.flush());
    }
  }
};
var currentScheduler = new MicrotaskScheduler();

// src/reactive/signal-list.ts
function createSignalList(initialItems, keyFn) {
  const itemSignals = /* @__PURE__ */ new Map();
  const [_getIds, _setIds] = createSignal(initialItems.map(keyFn));
  const getIds = _getIds;
  const peekIds = () => _getIds.peek();
  const setIds = (newIds) => {
    const currentIds = peekIds();
    if (!arraysEqual(currentIds, newIds)) {
      _setIds(newIds);
    }
  };
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };
  initialItems.forEach((item) => {
    const key = keyFn(item);
    itemSignals.set(key, createSignal(item));
  });
  const get = (key) => {
    const signal = itemSignals.get(key);
    if (!signal) {
      throw new Error(`SignalList: Item with key "${String(key)}" not found`);
    }
    return signal[0];
  };
  const update = (key, item) => {
    const signal = itemSignals.get(key);
    if (signal) {
      signal[1](item);
    } else {
      itemSignals.set(key, createSignal(item));
      const currentIds = peekIds();
      setIds([...currentIds, key]);
    }
  };
  const detectStructuralChange = (oldKeys, newKeys) => {
    if (oldKeys.length !== newKeys.length) {
      return true;
    }
    const oldKeySet = new Set(oldKeys);
    const newKeySet = new Set(newKeys);
    if (oldKeySet.size !== newKeySet.size) {
      return true;
    }
    for (const key of newKeys) {
      if (!oldKeySet.has(key)) {
        return true;
      }
    }
    return false;
  };
  const set = (items) => {
    const newKeys = items.map(keyFn);
    const newKeySet = new Set(newKeys);
    const currentKeys = peekIds();
    items.forEach((item) => {
      const key = keyFn(item);
      const signal = itemSignals.get(key);
      if (signal) {
        signal[1](item);
      } else {
        itemSignals.set(key, createSignal(item));
      }
    });
    currentKeys.forEach((key) => {
      if (!newKeySet.has(key)) {
        itemSignals.delete(key);
      }
    });
    const structureChanged = detectStructuralChange(currentKeys, newKeys);
    if (structureChanged) {
      setIds(newKeys);
    }
  };
  const readItemValue = (key, shouldTrack) => {
    const signal = itemSignals.get(key);
    if (!signal) return null;
    const getter = signal[0];
    if (!getter) return null;
    if (shouldTrack) {
      return getter();
    }
    if (typeof getter.peek === "function") {
      return getter.peek();
    }
    return getter();
  };
  const clear = () => {
    itemSignals.clear();
    setIds([]);
  };
  const remove = (key) => {
    itemSignals.delete(key);
    const currentIds = peekIds();
    setIds(currentIds.filter((k) => k !== key));
  };
  const reorder = (newIds) => {
    const allExist = newIds.every((id) => itemSignals.has(id));
    if (!allExist) {
      throw new Error("[SignalList.reorder] Cannot reorder with unknown ids");
    }
    setIds([...newIds]);
  };
  const getAll = () => {
    const ids = peekIds();
    return ids.map((key) => readItemValue(key, false)).filter((item) => item !== null);
  };
  const getAllReactive = () => {
    const ids = getIds();
    return ids.map((key) => readItemValue(key, true)).filter((item) => item !== null);
  };
  return [
    getAllReactive,
    {
      ids: getIds,
      get,
      update,
      set,
      clear,
      remove,
      reorder,
      getAll
    }
  ];
}

// src/reactive/theme.ts
var [currentTheme, setCurrentTheme] = createSignal("light");
var themeComputed = createComputed(() => {
  const theme = currentTheme();
  if (theme === "system") {
    return detectSystemTheme();
  }
  return theme;
});
function detectSystemTheme() {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

// src/runtime/component-context.ts
var ComponentContextSymbol = Symbol("TachUI.ComponentContext");
var EnvironmentSymbol = Symbol("TachUI.Environment");
var currentComponentContext = null;
var ComponentContextImpl = class {
  constructor(id, parent) {
    __publicField(this, "id");
    __publicField(this, "parent");
    __publicField(this, "providers", /* @__PURE__ */ new Map());
    __publicField(this, "consumers", /* @__PURE__ */ new Set());
    __publicField(this, "cleanup", /* @__PURE__ */ new Set());
    // State management
    __publicField(this, "stateStore", /* @__PURE__ */ new Map());
    __publicField(this, "bindingStore", /* @__PURE__ */ new Map());
    // Performance tracking
    __publicField(this, "createdAt", Date.now());
    __publicField(this, "updateCount", 0);
    this.id = id;
    this.parent = parent;
  }
  /**
   * Store state value for a property
   */
  setState(propertyName, value) {
    this.stateStore.set(propertyName, value);
    this.updateCount++;
  }
  /**
   * Get state value for a property
   */
  getState(propertyName) {
    return this.stateStore.get(propertyName);
  }
  /**
   * Check if state exists for a property
   */
  hasState(propertyName) {
    return this.stateStore.has(propertyName);
  }
  /**
   * Store binding for a property
   */
  setBinding(propertyName, binding) {
    this.bindingStore.set(propertyName, binding);
  }
  /**
   * Get binding for a property
   */
  getBinding(propertyName) {
    return this.bindingStore.get(propertyName);
  }
  /**
   * Provide a value for dependency injection
   */
  provide(symbol, value) {
    this.providers.set(symbol, value);
  }
  /**
   * Consume a value from dependency injection hierarchy
   */
  consume(symbol) {
    this.consumers.add(symbol);
    if (this.providers.has(symbol)) {
      return this.providers.get(symbol);
    }
    let context = this.parent;
    while (context) {
      if (context.providers.has(symbol)) {
        return context.providers.get(symbol);
      }
      context = context.parent;
    }
    return void 0;
  }
  /**
   * Register cleanup function
   */
  onCleanup(fn) {
    this.cleanup.add(fn);
  }
  /**
   * Dispose of context and run cleanup
   */
  dispose() {
    for (const cleanup of this.cleanup) {
      try {
        cleanup();
      } catch (error) {
        console.error(`Error in component context cleanup (${this.id}):`, error);
      }
    }
    this.cleanup.clear();
    this.stateStore.clear();
    this.bindingStore.clear();
    this.providers.clear();
    this.consumers.clear();
  }
  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updateCount: this.updateCount,
      stateCount: this.stateStore.size,
      bindingCount: this.bindingStore.size,
      providerCount: this.providers.size,
      consumerCount: this.consumers.size
    };
  }
};
function createComponentContext(componentId, parent) {
  return new ComponentContextImpl(componentId, parent);
}
function runWithComponentContext(context, fn) {
  const prevContext = currentComponentContext;
  currentComponentContext = context;
  const owner = getCurrentOwner();
  if (owner) {
    owner.context.set(ComponentContextSymbol, context);
  }
  try {
    const result = fn();
    return result;
  } finally {
    if (currentComponentContext === context) {
      currentComponentContext = prevContext;
    }
    if (owner) {
      if (prevContext) {
        owner.context.set(ComponentContextSymbol, prevContext);
      } else {
        owner.context.delete(ComponentContextSymbol);
      }
    }
  }
}

// src/runtime/props.ts
var PropsManager = class {
  constructor(initialProps, validator) {
    this.validator = validator;
    __publicField(this, "propsSignal");
    __publicField(this, "childrenSignal");
    __publicField(this, "changedKeys", /* @__PURE__ */ new Set());
    this.propsSignal = createSignal(this.validateAndMergeProps(initialProps));
    this.childrenSignal = createSignal(initialProps.children);
    createEffect(() => {
      const props = this.propsSignal[0]();
      this.trackChanges(props);
    });
  }
  /**
   * Get current props reactively
   */
  getProps() {
    return this.propsSignal[0]();
  }
  /**
   * Update props with validation and change detection
   */
  setProps(newProps) {
    const currentProps = this.propsSignal[0]();
    const mergedProps = { ...currentProps, ...newProps };
    const validatedProps = this.validateAndMergeProps(mergedProps);
    this.changedKeys.clear();
    Object.keys(newProps).forEach((key) => {
      if (currentProps[key] !== newProps[key]) {
        this.changedKeys.add(key);
      }
    });
    this.propsSignal[1](validatedProps);
    if (newProps.children !== void 0) {
      this.childrenSignal[1](newProps.children);
    }
  }
  /**
   * Get current children reactively
   */
  getChildren() {
    return this.childrenSignal[0]();
  }
  /**
   * Set children directly
   */
  setChildren(children) {
    this.childrenSignal[1](children);
  }
  /**
   * Get keys that changed in last update
   */
  getChangedKeys() {
    return Array.from(this.changedKeys);
  }
  /**
   * Create reactive computed for a specific prop
   */
  createPropComputed(key) {
    return createComputed(() => this.getProps()[key]);
  }
  /**
   * Create effect that runs when specific props change
   */
  createPropsEffect(keys, effect) {
    const effectComputation = createEffect(() => {
      const props = this.getProps();
      const changed = this.getChangedKeys();
      const hasChanges = changed.length === 0 || keys.some((key) => changed.includes(key));
      if (hasChanges) {
        effect(
          props,
          changed.filter((key) => keys.includes(key))
        );
      }
    });
    return () => effectComputation.dispose();
  }
  validateAndMergeProps(props) {
    let validatedProps = props;
    if (this.validator?.defaults) {
      validatedProps = { ...this.validator.defaults, ...props };
    }
    if (this.validator?.required) {
      for (const key of this.validator.required) {
        if (validatedProps[key] === void 0 || validatedProps[key] === null) {
          throw new Error(`Required prop '${String(key)}' is missing`);
        }
      }
    }
    if (this.validator?.validator) {
      const result = this.validator.validator(validatedProps);
      if (typeof result === "string") {
        throw new Error(`Props validation failed: ${result}`);
      } else if (result === false) {
        throw new Error("Props validation failed");
      }
    }
    return validatedProps;
  }
  trackChanges(_props) {
  }
};
var ChildrenManager = class {
  constructor(initialChildren = null) {
    __publicField(this, "childrenSignal");
    this.childrenSignal = createSignal(initialChildren);
  }
  /**
   * Get current children reactively
   */
  getChildren() {
    return this.childrenSignal[0]();
  }
  /**
   * Set new children
   */
  setChildren(children) {
    this.childrenSignal[1](children);
  }
  /**
   * Render children to DOM nodes
   */
  renderChildren() {
    const children = this.getChildren();
    return this.renderChildrenArray(Array.isArray(children) ? children : [children]);
  }
  /**
   * Create fragment with multiple children
   */
  createFragment(children) {
    return { children };
  }
  /**
   * Map children with a function
   */
  mapChildren(mapper) {
    const children = this.getChildren();
    const childArray = Array.isArray(children) ? children : [children];
    return childArray.map(mapper);
  }
  /**
   * Filter children
   */
  filterChildren(predicate) {
    const children = this.getChildren();
    const childArray = Array.isArray(children) ? children : [children];
    return childArray.filter(predicate);
  }
  /**
   * Count non-null children
   */
  countChildren() {
    const children = this.getChildren();
    if (children === null || children === void 0) return 0;
    if (Array.isArray(children)) {
      return children.filter((child) => child !== null && child !== void 0).length;
    }
    return 1;
  }
  renderChildrenArray(children) {
    const nodes = [];
    for (const child of children) {
      if (child === null || child === void 0) {
        continue;
      }
      if (typeof child === "string" || typeof child === "number") {
        nodes.push({
          type: "text",
          text: String(child)
        });
      } else if (typeof child === "boolean") {
      } else if (typeof child === "function") {
        const result = child();
        if (Array.isArray(result)) {
          nodes.push(...result);
        } else {
          nodes.push(result);
        }
      } else if (Array.isArray(child)) {
        nodes.push(...this.renderChildrenArray(child));
      } else if (isModifierBuilder(child)) {
        const builtChild = child.build();
        const result = builtChild.render();
        if (Array.isArray(result)) {
          nodes.push(...result);
        } else {
          nodes.push(result);
        }
      } else if (typeof child === "object" && child !== null && "render" in child) {
        let componentToRender = child;
        if ("build" in child && typeof child.build === "function") {
          componentToRender = child.build();
        }
        const result = componentToRender.render();
        if (Array.isArray(result)) {
          nodes.push(...result);
        } else {
          nodes.push(result);
        }
      }
    }
    return nodes;
  }
};
var RefManager = class {
  constructor(initialValue = null) {
    __publicField(this, "ref");
    this.ref = { current: initialValue };
  }
  /**
   * Get the ref object
   */
  getRef() {
    return this.ref;
  }
  /**
   * Set ref value
   */
  setValue(value) {
    this.ref.current = value;
  }
  /**
   * Get current ref value
   */
  getValue() {
    return this.ref.current;
  }
  /**
   * Apply ref (handle both ref objects and callback refs)
   */
  static applyRef(ref, value) {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(value);
    } else if (typeof ref === "object" && ref !== null) {
      ref.current = value;
    }
  }
  /**
   * Create a new ref
   */
  static createRef(initialValue = null) {
    return { current: initialValue };
  }
  /**
   * Forward ref to another component
   */
  static forwardRef(render) {
    return (props) => {
      const { ref, ...restProps } = props;
      return render(restProps, ref || void 0);
    };
  }
};
function isModifierBuilder(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const hasBuild = "build" in value && typeof value.build === "function";
  if (!hasBuild) {
    return false;
  }
  const hasRender = "render" in value && typeof value.render === "function";
  return !hasRender;
}
var propsUtils = {
  /**
   * Compare props for changes
   */
  compareProps(prevProps, nextProps) {
    const changedKeys = [];
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(prevProps), ...Object.keys(nextProps)]);
    for (const key of allKeys) {
      if (prevProps[key] !== nextProps[key]) {
        changedKeys.push(key);
      }
    }
    return changedKeys;
  },
  /**
   * Shallow compare props
   */
  shallowEqual(prevProps, nextProps) {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    for (const key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    return true;
  },
  /**
   * Pick specific props
   */
  pickProps(props, keys) {
    const picked = {};
    for (const key of keys) {
      picked[key] = props[key];
    }
    return picked;
  },
  /**
   * Omit specific props
   */
  omitProps(props, keys) {
    const omitted = { ...props };
    for (const key of keys) {
      delete omitted[key];
    }
    return omitted;
  }
};

// src/runtime/component.ts
var _ComponentManager = class _ComponentManager {
  constructor() {
    __publicField(this, "components", /* @__PURE__ */ new Map());
    __publicField(this, "contexts", /* @__PURE__ */ new Map());
    __publicField(this, "cleanupQueue", /* @__PURE__ */ new Set());
    __publicField(this, "updateQueue", /* @__PURE__ */ new Set());
    __publicField(this, "isUpdating", false);
  }
  static getInstance() {
    if (!_ComponentManager.instance) {
      _ComponentManager.instance = new _ComponentManager();
    }
    return _ComponentManager.instance;
  }
  /**
   * Register a new component instance
   */
  registerComponent(instance) {
    this.components.set(instance.id, instance);
    if (instance.cleanup) {
      instance.cleanup.forEach((cleanup) => {
        this.cleanupQueue.add(cleanup);
      });
    }
  }
  /**
   * Unregister and cleanup a component
   */
  unregisterComponent(id) {
    const instance = this.components.get(id);
    if (instance) {
      if (instance.cleanup) {
        instance.cleanup.forEach((cleanup) => {
          try {
            cleanup();
          } catch (error) {
            console.error(`Cleanup error for component ${id}:`, error);
          }
        });
      }
      this.components.delete(id);
      if (instance.context) {
        this.cleanupContext(instance.context.id);
      }
    }
  }
  /**
   * Get component instance by ID
   */
  getComponent(id) {
    return this.components.get(id);
  }
  /**
   * Schedule component for update
   */
  scheduleUpdate(id) {
    this.updateQueue.add(id);
    if (!this.isUpdating) {
      this.flushUpdates();
    }
  }
  /**
   * Process all scheduled updates
   */
  async flushUpdates() {
    if (this.isUpdating) return;
    this.isUpdating = true;
    await new Promise((resolve) => queueMicrotask(() => resolve(void 0)));
    const toUpdate = Array.from(this.updateQueue);
    this.updateQueue.clear();
    toUpdate.forEach((id) => {
      const instance = this.components.get(id);
      if (instance) {
        try {
          this.updateComponent(instance);
        } catch (error) {
          console.error(`Update error for component ${id}:`, error);
        }
      }
    });
    this.isUpdating = false;
  }
  /**
   * Update a specific component instance
   */
  updateComponent(instance) {
    if (instance.props) {
      instance.prevProps = { ...instance.props };
    }
    instance.render();
    if (!instance.mounted) {
      instance.mounted = true;
    }
  }
  /**
   * Cleanup context by ID
   */
  cleanupContext(contextId) {
    const context = this.contexts.get(contextId);
    if (context) {
      context.cleanup.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error(`Context cleanup error for ${contextId}:`, error);
        }
      });
      this.contexts.delete(contextId);
    }
  }
  /**
   * Get all registered components (for debugging)
   */
  getAllComponents() {
    return Array.from(this.components.values());
  }
  /**
   * Cleanup all components and resources
   */
  cleanup() {
    Array.from(this.components.keys()).forEach((id) => {
      this.unregisterComponent(id);
    });
    this.cleanupQueue.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.error("Global cleanup error:", error);
      }
    });
    this.cleanupQueue.clear();
    this.updateQueue.clear();
  }
};
__publicField(_ComponentManager, "instance");
var ComponentManager = _ComponentManager;
function createComponent(render, options = {}) {
  const component = (props) => {
    const componentId = generateComponentId();
    const manager = ComponentManager.getInstance();
    const cleanup = [];
    const context = createComponentContext(componentId);
    const propsManager = new PropsManager(props, {
      defaults: options.defaultProps || void 0,
      ...options.validation
    });
    const childrenManager = new ChildrenManager(props.children);
    const refManager = new RefManager();
    let previousProps;
    let mounted = false;
    let cleanupRegistered = false;
    const renderFunction = () => runWithComponentContext(context, () => {
      if (options.lifecycle?.onMount && !mounted) {
        const mountCleanup = options.lifecycle.onMount();
        if (typeof mountCleanup === "function") {
          cleanup.push(mountCleanup);
        }
        mounted = true;
      }
      if (!cleanupRegistered) {
        cleanupRegistered = true;
        createEffect(() => {
          onCleanup(() => {
            if (options.lifecycle?.onUnmount) {
              options.lifecycle.onUnmount();
            }
            cleanup.forEach((fn) => fn());
            manager.unregisterComponent(componentId);
          });
        });
      }
      createEffect(() => {
        const currentProps = propsManager.getProps();
        if (previousProps && options.lifecycle?.onPropsChange) {
          const changedKeys = propsUtils.compareProps(previousProps, currentProps);
          if (changedKeys.length > 0) {
            options.lifecycle.onPropsChange(previousProps, currentProps, changedKeys);
          }
        }
        if (previousProps && options.lifecycle?.onUpdate) {
          options.lifecycle.onUpdate(previousProps, currentProps);
        }
        previousProps = { ...currentProps };
      });
      createEffect(() => {
        const currentChildren = childrenManager.getChildren();
        if (options.lifecycle?.onChildrenChange && previousProps) {
          options.lifecycle.onChildrenChange(previousProps.children, currentChildren);
        }
      });
      try {
        if (options.lifecycle?.onRender) {
          options.lifecycle.onRender();
        }
        const currentProps = propsManager.getProps();
        const currentChildren = childrenManager.getChildren();
        if (previousProps && options.shouldUpdate) {
          if (!options.shouldUpdate(previousProps, currentProps)) {
            return [];
          }
        }
        return render(currentProps, currentChildren);
      } catch (error) {
        if (options.lifecycle?.onError) {
          options.lifecycle.onError(error);
        }
        throw error;
      }
    });
    const instance = {
      type: "component",
      render: renderFunction,
      props: propsManager.getProps(),
      children: childrenManager.getChildren(),
      context,
      cleanup,
      id: componentId,
      ref: props.ref,
      mounted: false
    };
    if (props.ref) {
      RefManager.applyRef(props.ref, refManager.getRef());
    }
    manager.registerComponent(instance);
    return instance;
  };
  if (options.displayName) {
    component.displayName = options.displayName;
  }
  if (options.defaultProps) {
    component.defaultProps = options.defaultProps;
  }
  return component;
}
function generateComponentId() {
  return `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ../registry/src/singleton.ts
var globalRegistryInstance = null;
var _ModifierRegistryImpl = class _ModifierRegistryImpl {
  constructor() {
    __publicField(this, "instanceId");
    __publicField(this, "createdAt");
    __publicField(this, "modifiers", /* @__PURE__ */ new Map());
    __publicField(this, "lazyLoaders", /* @__PURE__ */ new Map());
    __publicField(this, "loadingPromises", /* @__PURE__ */ new Map());
    // Feature flags
    __publicField(this, "featureFlags", {
      proxyModifiers: false,
      // Disabled by default for safe rollout
      autoTypeGeneration: false,
      hmrCacheInvalidation: false,
      pluginValidation: true,
      performanceMonitoring: false,
      metadataRegistration: true
      // Enable for new system
    });
    // Metadata storage for type generation
    __publicField(this, "metadata", /* @__PURE__ */ new Map());
    __publicField(this, "metadataHistory", /* @__PURE__ */ new Map());
    __publicField(this, "conflicts", /* @__PURE__ */ new Map());
    // Plugin metadata storage
    __publicField(this, "plugins", /* @__PURE__ */ new Map());
    _ModifierRegistryImpl.instanceCount++;
    this.instanceId = Math.random().toString(36).substr(2, 9);
    this.createdAt = Date.now();
    if (true) {
      console.log(
        `\u{1F3D7}\uFE0F ModifierRegistry instance created: ${this.instanceId} (total: ${_ModifierRegistryImpl.instanceCount})`
      );
    }
  }
  static validateModifierName(name, options = {}) {
    if (_ModifierRegistryImpl.FORBIDDEN_NAMES.has(name)) {
      throw new Error(
        `Security Error: Cannot register modifier '${name}' (forbidden name)`
      );
    }
    if (!_ModifierRegistryImpl.NAME_PATTERN.test(name)) {
      if (options.strict) {
        throw new Error(
          `Invalid modifier name '${name}'. Modifier names must match ${_ModifierRegistryImpl.NAME_PATTERN}`
        );
      }
      if (true) {
        console.warn(
          `\u26A0\uFE0F Modifier name '${name}' does not match ${_ModifierRegistryImpl.NAME_PATTERN}. Prefer alphanumeric names for best tooling support.`
        );
      }
    }
  }
  register(name, factory) {
    _ModifierRegistryImpl.validateModifierName(name);
    this.modifiers.set(name, factory);
    this.lazyLoaders.delete(name);
    this.loadingPromises.delete(name);
  }
  registerLazy(name, loader) {
    _ModifierRegistryImpl.validateModifierName(name);
    if (this.modifiers.has(name)) {
      if (true) {
        console.warn(
          `\u26A0\uFE0F Modifier '${name}' already registered, skipping lazy registration`
        );
      }
      return;
    }
    this.lazyLoaders.set(name, loader);
  }
  get(name, options) {
    const cached = this.modifiers.get(name);
    if (cached) {
      return cached;
    }
    const loader = this.lazyLoaders.get(name);
    if (!loader) {
      if (true) {
        console.warn(
          `\u26A0\uFE0F Modifier '${name}' not found in registry ${this.instanceId}`
        );
      }
      return void 0;
    }
    if (options?.async) {
      return this.getAsync(name);
    }
    try {
      const factory = loader();
      if (factory instanceof Promise) {
        return factory.then((resolvedFactory) => {
          this.modifiers.set(name, resolvedFactory);
          this.lazyLoaders.delete(name);
          return resolvedFactory;
        }).catch((error) => {
          if (true) {
            console.warn(`\u26A0\uFE0F Failed to load modifier '${name}':`, error);
          }
          return void 0;
        });
      } else {
        this.modifiers.set(name, factory);
        this.lazyLoaders.delete(name);
        return factory;
      }
    } catch (error) {
      if (true) {
        console.warn(
          `\u26A0\uFE0F Failed to load modifier '${name}' synchronously:`,
          error
        );
      }
      return void 0;
    }
  }
  async getAsync(name) {
    const existingPromise = this.loadingPromises.get(name);
    if (existingPromise) {
      return existingPromise;
    }
    const loader = this.lazyLoaders.get(name);
    if (!loader) {
      return void 0;
    }
    const loadPromise = this.loadModifier(name, loader);
    this.loadingPromises.set(name, loadPromise);
    try {
      const factory = await loadPromise;
      this.loadingPromises.delete(name);
      return factory;
    } catch (error) {
      this.loadingPromises.delete(name);
      if (true) {
        console.error(`\u274C Failed to load modifier '${name}':`, error);
      }
      throw error;
    }
  }
  async loadModifier(name, loader) {
    try {
      const factory = await loader();
      this.modifiers.set(name, factory);
      this.lazyLoaders.delete(name);
      return factory;
    } catch (error) {
      if (true) {
        console.error(`\u274C Error loading modifier '${name}':`, error);
      }
      throw error;
    }
  }
  has(name) {
    return this.modifiers.has(name) || this.lazyLoaders.has(name);
  }
  list() {
    const loaded = Array.from(this.modifiers.keys());
    const lazy = Array.from(this.lazyLoaders.keys());
    return [...loaded, ...lazy];
  }
  clear() {
    this.modifiers.clear();
    this.lazyLoaders.clear();
    this.loadingPromises.clear();
    this.metadata.clear();
    this.metadataHistory.clear();
    this.conflicts.clear();
    this.plugins.clear();
    if (true) {
      console.log(
        `\u{1F9F9} Cleared all modifiers and lazy loaders from registry ${this.instanceId}`
      );
    }
  }
  reset() {
    this.clear();
    if (false) {
      _ModifierRegistryImpl.instanceCount = 0;
    }
  }
  validateRegistry() {
    const modifierNames = this.list();
    const duplicates = modifierNames.filter(
      (name, index) => modifierNames.indexOf(name) !== index
    );
    return {
      totalModifiers: this.modifiers.size + this.lazyLoaders.size,
      duplicateNames: duplicates,
      orphanedReferences: [],
      // Could be enhanced to scan for broken references
      instanceId: this.instanceId,
      createdAt: this.createdAt,
      instanceCount: _ModifierRegistryImpl.instanceCount
    };
  }
  /**
   * Get diagnostic information about this registry instance
   */
  getDiagnostics() {
    return {
      instanceId: this.instanceId,
      createdAt: this.createdAt,
      modifierCount: this.modifiers.size,
      lazyLoaderCount: this.lazyLoaders.size,
      modifiers: this.list(),
      loadedModifiers: Array.from(this.modifiers.keys()),
      lazyModifiers: Array.from(this.lazyLoaders.keys()),
      featureFlags: this.featureFlags,
      metadataCount: this.metadata.size
    };
  }
  // ============================================================================
  // Feature Flag Methods
  // ============================================================================
  /**
   * Set feature flags for the registry
   * Allows enabling/disabling features for gradual rollout
   */
  setFeatureFlags(flags) {
    this.featureFlags = {
      ...this.featureFlags,
      ...flags
    };
  }
  /**
   * Get current feature flags
   */
  getFeatureFlags() {
    return { ...this.featureFlags };
  }
  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.featureFlags[feature] === true;
  }
  // ============================================================================
  // Metadata Methods (for build-time type generation)
  // ============================================================================
  /**
   * Register metadata for a modifier (for type generation)
   */
  registerMetadata(modifierMetadata) {
    if (!this.isFeatureEnabled("metadataRegistration")) {
      if (true) {
        console.warn(
          `\u26A0\uFE0F Metadata registration is disabled. Enable 'metadataRegistration' feature flag.`
        );
      }
      return;
    }
    if (!modifierMetadata.plugin) {
      throw new Error(
        `Modifier metadata '${String(modifierMetadata.name)}' must include a plugin identifier`
      );
    }
    if (typeof modifierMetadata.name === "string") {
      _ModifierRegistryImpl.validateModifierName(modifierMetadata.name, {
        strict: true
      });
    }
    const existing = this.metadata.get(modifierMetadata.name);
    const samePlugin = existing?.plugin === modifierMetadata.plugin;
    this.recordMetadataHistoryEntry(modifierMetadata);
    if (!existing) {
      this.metadata.set(modifierMetadata.name, modifierMetadata);
      return;
    }
    if (samePlugin) {
      this.metadata.set(modifierMetadata.name, modifierMetadata);
      return;
    }
    if (modifierMetadata.priority > existing.priority) {
      if (true) {
        console.warn(
          `\u26A0\uFE0F Overriding modifier metadata '${String(modifierMetadata.name)}' from ${existing.plugin} (priority ${existing.priority}) with ${modifierMetadata.plugin} (priority ${modifierMetadata.priority})`
        );
      }
      this.metadata.set(modifierMetadata.name, modifierMetadata);
      return;
    }
    if (modifierMetadata.priority === existing.priority && modifierMetadata.plugin !== existing.plugin && true) {
      console.error(
        `\u274C Metadata conflict for '${String(modifierMetadata.name)}': ${existing.plugin} vs ${modifierMetadata.plugin} (both priority ${modifierMetadata.priority})`
      );
    }
  }
  recordMetadataHistoryEntry(metadata) {
    const entries = this.metadataHistory.get(metadata.name) ?? [];
    const key = `${metadata.plugin}:${metadata.priority}`;
    const existingIndex = entries.findIndex(
      (entry) => `${entry.plugin}:${entry.priority}` === key
    );
    if (existingIndex >= 0) {
      entries[existingIndex] = metadata;
    } else {
      entries.push(metadata);
    }
    this.metadataHistory.set(metadata.name, entries);
    this.refreshConflictsFor(metadata.name, entries);
  }
  refreshConflictsFor(name, entries) {
    const conflictsForName = [];
    const byPriority = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      const priorityMap = byPriority.get(entry.priority) ?? /* @__PURE__ */ new Map();
      priorityMap.set(entry.plugin, entry);
      byPriority.set(entry.priority, priorityMap);
    }
    for (const priorityMap of byPriority.values()) {
      if (priorityMap.size > 1) {
        for (const conflictEntry of priorityMap.values()) {
          conflictsForName.push(conflictEntry);
        }
      }
    }
    if (conflictsForName.length > 0) {
      this.conflicts.set(name, conflictsForName);
    } else {
      this.conflicts.delete(name);
    }
  }
  /**
   * Get metadata for a specific modifier
   */
  getMetadata(name) {
    return this.metadata.get(name);
  }
  /**
   * Get all registered metadata
   */
  getAllMetadata() {
    return Array.from(this.metadata.values());
  }
  /**
   * Get metadata filtered by category
   */
  getModifiersByCategory(category) {
    return this.getAllMetadata().filter((meta) => meta.category === category);
  }
  getMetadataByCategory(category) {
    return this.getModifiersByCategory(category);
  }
  /**
   * Get conflicts (multiple modifiers with same name but different plugins)
   */
  getConflicts() {
    return new Map(
      Array.from(this.conflicts.entries(), ([key, value]) => [key, [...value]])
    );
  }
  registerPlugin(metadata) {
    if (!metadata.name || !metadata.version) {
      throw new Error("Plugin must define both name and version");
    }
    if (!metadata.author) {
      throw new Error(
        `Plugin '${metadata.name}' must include an author or organization`
      );
    }
    if (!metadata.verified && true) {
      console.warn(
        `\u26A0\uFE0F Registering unverified plugin '${metadata.name}'. Install plugins from trusted sources.`
      );
    }
    this.plugins.set(metadata.name, metadata);
  }
  getPluginInfo(name) {
    return this.plugins.get(name);
  }
  listPlugins() {
    return Array.from(this.plugins.values());
  }
};
__publicField(_ModifierRegistryImpl, "instanceCount", 0);
__publicField(_ModifierRegistryImpl, "FORBIDDEN_NAMES", /* @__PURE__ */ new Set([
  "__proto__",
  "constructor",
  "prototype",
  "hasOwnProperty",
  "isPrototypeOf",
  "toString",
  "valueOf"
]));
__publicField(_ModifierRegistryImpl, "NAME_PATTERN", /^[a-zA-Z_$][a-zA-Z0-9_$]*$/);
var ModifierRegistryImpl = _ModifierRegistryImpl;
function getGlobalRegistry() {
  if (!globalRegistryInstance) {
    globalRegistryInstance = new ModifierRegistryImpl();
  }
  return globalRegistryInstance;
}
var globalModifierRegistry = getGlobalRegistry();

// src/modifiers/registry.ts
var RegistryAdapter = class {
  register(name, factory) {
    globalModifierRegistry.register(name, factory);
  }
  get(name) {
    return globalModifierRegistry.get(name);
  }
  has(name) {
    return globalModifierRegistry.has(name);
  }
  list() {
    return globalModifierRegistry.list();
  }
  clear() {
    globalModifierRegistry.clear();
  }
  validateRegistry() {
    return globalModifierRegistry.validateRegistry();
  }
};
var registryAdapter = new RegistryAdapter();
if (true) {
  console.log("\u{1F4E4} Created RegistryAdapter for globalModifierRegistry", {
    registryId: globalModifierRegistry.instanceId,
    currentSize: globalModifierRegistry.list().length
  });
}
function applyModifiersToNode(node, modifiers, context = {}, options = {}) {
  if (!modifiers.length) return node;
  const fullContext = {
    componentId: context.componentId || "unknown",
    phase: context.phase || "creation",
    ...context.element && { element: context.element },
    ...context.parentElement && { parentElement: context.parentElement },
    ...context.componentInstance && {
      componentInstance: context.componentInstance
    },
    ...context.previousModifiers && {
      previousModifiers: context.previousModifiers
    }
  };
  const strategy = options.batch ? "batch" : "sequential";
  switch (strategy) {
    case "batch":
      return applyModifiersBatch(node, modifiers, fullContext, options);
    default:
      return applyModifiersSequential(node, modifiers, fullContext, options);
  }
}
function applyModifiersSequential(node, modifiers, context, options) {
  const sortedModifiers = [...modifiers].sort(
    (a, b) => a.priority - b.priority
  );
  let currentNode = node;
  const effects = [];
  const cleanup = [];
  for (const modifier of sortedModifiers) {
    try {
      const result = modifier.apply(currentNode, context);
      if (result && typeof result === "object" && "type" in result) {
        currentNode = result;
      }
      if (options.immediate && !options.suppressEffects) {
        effects.forEach((effect) => effect());
        effects.length = 0;
      }
    } catch (error) {
      console.error(`Failed to apply modifier ${modifier.type}:`, error);
    }
  }
  if (cleanup.length > 0) {
    const existingCleanup = currentNode.dispose;
    currentNode.dispose = () => {
      cleanup.forEach((fn) => fn());
      if (existingCleanup) existingCleanup();
    };
  }
  return currentNode;
}
function applyModifiersBatch(node, modifiers, context, options) {
  const modifierGroups = groupModifiersByType(modifiers);
  let currentNode = node;
  const allEffects = [];
  const allCleanup = [];
  for (const [type, groupModifiers] of modifierGroups) {
    try {
      currentNode = applyModifierGroup(currentNode, groupModifiers, context);
    } catch (error) {
      if (typeof process === "undefined" || true) {
        console.error(`Failed to apply modifier group ${type}:`, error);
      }
    }
  }
  if (!options.suppressEffects) {
    allEffects.forEach((effect) => effect());
  }
  if (allCleanup.length > 0) {
    const existingCleanup = currentNode.dispose;
    currentNode.dispose = () => {
      allCleanup.forEach((fn) => fn());
      if (existingCleanup) existingCleanup();
    };
  }
  return currentNode;
}
function groupModifiersByType(modifiers) {
  const groups = /* @__PURE__ */ new Map();
  for (const modifier of modifiers) {
    const existing = groups.get(modifier.type) || [];
    existing.push(modifier);
    groups.set(modifier.type, existing);
  }
  return groups;
}
function applyModifierGroup(node, modifiers, context) {
  const sortedModifiers = [...modifiers].sort(
    (a, b) => a.priority - b.priority
  );
  let currentNode = node;
  for (const modifier of sortedModifiers) {
    try {
      const result = modifier.apply(currentNode, context);
      if (result && typeof result === "object" && "type" in result) {
        currentNode = result;
      }
    } catch (error) {
      if (typeof process === "undefined" || true) {
        console.error(`Failed to apply modifier ${modifier.type}:`, error);
      }
    }
  }
  return currentNode;
}

// src/runtime/element-override.ts
var SEMANTIC_TAG_ROLES = /* @__PURE__ */ new Map([
  ["nav", { role: "navigation", applyARIA: true }],
  ["main", { role: "main", applyARIA: true }],
  ["article", { role: "article", applyARIA: true }],
  ["section", { role: "region", applyARIA: true }],
  ["aside", { role: "complementary", applyARIA: true }],
  ["header", { role: "banner", applyARIA: false }],
  // Context dependent - may not always be page banner
  ["footer", { role: "contentinfo", applyARIA: false }],
  // Context dependent - may not always be page footer
  ["form", { role: "form", applyARIA: true }],
  ["search", { role: "search", applyARIA: true }],
  ["dialog", { role: "dialog", applyARIA: true }],
  ["button", { role: "button", applyARIA: false }],
  // Usually implicit
  ["a", { role: "link", applyARIA: false }]
  // Usually implicit
]);
var globalConfig = {
  autoApplySemanticRoles: true,
  warnOnOverrides: true,
  warnOnSemanticIssues: true,
  validateTags: true,
  allowInvalidTags: true
};
function getElementOverrideConfig() {
  return { ...globalConfig };
}

// src/runtime/semantic-role-manager.ts
var _SemanticRoleManager = class _SemanticRoleManager {
  static getInstance() {
    if (!_SemanticRoleManager.instance) {
      _SemanticRoleManager.instance = new _SemanticRoleManager();
    }
    return _SemanticRoleManager.instance;
  }
  /**
   * Apply semantic ARIA attributes to an element based on its tag
   */
  applySemanticAttributes(element, tag, existingAria) {
    const config = getElementOverrideConfig();
    if (!config.autoApplySemanticRoles) return;
    const semanticInfo = SEMANTIC_TAG_ROLES.get(tag);
    if (!semanticInfo || !semanticInfo.applyARIA) return;
    if (existingAria?.role) {
      if (config.warnOnSemanticIssues && true) {
        console.warn(
          `ARIA role '${existingAria.role}' overrides semantic role '${semanticInfo.role}' for tag '${tag}'`
        );
      }
      return;
    }
    if (element.hasAttribute("role")) {
      if (config.warnOnSemanticIssues && true) {
        console.warn(
          `Existing role attribute overrides semantic role '${semanticInfo.role}' for tag '${tag}'`
        );
      }
      return;
    }
    element.setAttribute("role", semanticInfo.role);
  }
  /**
   * Get semantic role information for a tag
   */
  getSemanticRole(tag) {
    return SEMANTIC_TAG_ROLES.get(tag);
  }
  /**
   * Check if a tag has automatic ARIA role application enabled
   */
  hasAutoARIA(tag) {
    const semanticInfo = SEMANTIC_TAG_ROLES.get(tag);
    return semanticInfo ? semanticInfo.applyARIA : false;
  }
  /**
   * Get all tags that support automatic ARIA roles
   */
  getAutoARIATags() {
    return Array.from(SEMANTIC_TAG_ROLES.entries()).filter(([, info]) => info.applyARIA).map(([tag]) => tag);
  }
  /**
   * Apply semantic attributes during DOM node creation
   * This is called by the renderer when creating elements
   */
  processElementNode(element, tag, componentMetadata, existingAria) {
    this.applySemanticAttributes(element, tag, existingAria);
    if (componentMetadata && true) {
      const semanticInfo = this.getSemanticRole(tag);
      if (semanticInfo) {
        element.setAttribute(
          "data-tachui-semantic",
          JSON.stringify({
            originalComponent: componentMetadata.originalType,
            overriddenTo: tag,
            semanticRole: semanticInfo.role,
            autoApplied: semanticInfo.applyARIA
          })
        );
      }
    }
  }
};
__publicField(_SemanticRoleManager, "instance");
var SemanticRoleManager = _SemanticRoleManager;
var semanticRoleManager = SemanticRoleManager.getInstance();

// src/runtime/event-delegation.ts
var DELEGATABLE_EVENTS = /* @__PURE__ */ new Set([
  "click",
  "dblclick",
  "mousedown",
  "mouseup",
  "mouseover",
  "mouseout",
  "mouseenter",
  "mouseleave",
  "focusin",
  // Bubbles, unlike 'focus'
  "focusout",
  // Bubbles, unlike 'blur'
  "input",
  "change",
  "submit",
  "keydown",
  "keyup",
  "keypress"
]);
var PASSIVE_EVENTS = /* @__PURE__ */ new Set([
  "scroll",
  "wheel",
  "touchstart",
  "touchmove",
  "touchend"
]);
var EventDelegator = class {
  constructor() {
    // Map of container -> event type -> root listener
    __publicField(this, "containerListeners", /* @__PURE__ */ new WeakMap());
    // Map of element -> event type -> handler data
    __publicField(this, "elementHandlers", /* @__PURE__ */ new WeakMap());
    // Track number of handlers per container per event type
    __publicField(this, "handlerCounts", /* @__PURE__ */ new WeakMap());
  }
  /**
   * Register an event handler with delegation
   */
  register(container, element, eventType, handler) {
    let elementMap = this.elementHandlers.get(element);
    if (elementMap && elementMap.has(eventType)) {
      this.unregister(container, element, eventType);
    }
    if (!elementMap) {
      elementMap = /* @__PURE__ */ new Map();
      this.elementHandlers.set(element, elementMap);
    }
    elementMap.set(eventType, { handler, element });
    let countMap = this.handlerCounts.get(container);
    if (!countMap) {
      countMap = /* @__PURE__ */ new Map();
      this.handlerCounts.set(container, countMap);
    }
    const currentCount = countMap.get(eventType) || 0;
    countMap.set(eventType, currentCount + 1);
    this.ensureRootListener(container, eventType);
    return () => {
      this.unregister(container, element, eventType);
    };
  }
  /**
   * Unregister an event handler
   */
  unregister(container, element, eventType) {
    const elementMap = this.elementHandlers.get(element);
    if (elementMap) {
      elementMap.delete(eventType);
      if (elementMap.size === 0) {
        this.elementHandlers.delete(element);
      }
    }
    const countMap = this.handlerCounts.get(container);
    if (countMap) {
      const currentCount = countMap.get(eventType) || 0;
      const newCount = currentCount - 1;
      if (newCount <= 0) {
        countMap.delete(eventType);
        this.removeRootListener(container, eventType);
      } else {
        countMap.set(eventType, newCount);
      }
    }
  }
  /**
   * Ensure root listener exists for event type on container
   */
  ensureRootListener(container, eventType) {
    let listenerMap = this.containerListeners.get(container);
    if (!listenerMap) {
      listenerMap = /* @__PURE__ */ new Map();
      this.containerListeners.set(container, listenerMap);
    }
    if (listenerMap.has(eventType)) {
      return;
    }
    const rootListener = (event) => {
      this.handleDelegatedEvent(container, eventType, event);
    };
    const options = PASSIVE_EVENTS.has(eventType) ? { passive: true } : { passive: false };
    container.addEventListener(eventType, rootListener, options);
    listenerMap.set(eventType, rootListener);
  }
  /**
   * Remove root listener for event type on container
   */
  removeRootListener(container, eventType) {
    const listenerMap = this.containerListeners.get(container);
    if (!listenerMap) return;
    const rootListener = listenerMap.get(eventType);
    if (rootListener) {
      container.removeEventListener(eventType, rootListener);
      listenerMap.delete(eventType);
    }
  }
  /**
   * Handle delegated event by finding target handler
   */
  handleDelegatedEvent(container, eventType, event) {
    const target = event.target;
    if (!target) return;
    let currentElement = target;
    while (currentElement && currentElement !== container) {
      const elementMap = this.elementHandlers.get(currentElement);
      if (elementMap) {
        const handlerData = elementMap.get(eventType);
        if (handlerData) {
          try {
            handlerData.handler(event);
          } catch (error) {
            console.error(`Delegated event handler error for ${eventType}:`, error);
          }
          return;
        }
      }
      currentElement = currentElement.parentElement;
    }
  }
  /**
   * Check if event type should use delegation
   */
  shouldDelegate(eventType) {
    return DELEGATABLE_EVENTS.has(eventType);
  }
  /**
   * Check if event type should use passive listeners
   */
  shouldBePassive(eventType) {
    return PASSIVE_EVENTS.has(eventType);
  }
  /**
   * Get metrics for debugging
   */
  getMetrics(container) {
    const countMap = this.handlerCounts.get(container);
    if (!countMap) {
      return { eventTypes: [], totalHandlers: 0, handlersPerType: {} };
    }
    const handlersPerType = {};
    let totalHandlers = 0;
    countMap.forEach((count, eventType) => {
      handlersPerType[eventType] = count;
      totalHandlers += count;
    });
    return {
      eventTypes: Array.from(countMap.keys()),
      totalHandlers,
      handlersPerType
    };
  }
  /**
   * Cleanup all handlers for a container
   */
  cleanupContainer(container) {
    const listenerMap = this.containerListeners.get(container);
    if (listenerMap) {
      listenerMap.forEach((listener, eventType) => {
        container.removeEventListener(eventType, listener);
      });
      this.containerListeners.delete(container);
    }
    this.handlerCounts.delete(container);
  }
};
var globalEventDelegator = new EventDelegator();

// src/runtime/renderer.ts
var debugManager = {
  isEnabled: () => false,
  logComponent: (..._args) => {
  },
  addDebugAttributes: (..._args) => {
  }
};
var DOMRenderer = class {
  constructor() {
    __publicField(this, "nodeMap", /* @__PURE__ */ new WeakMap());
    __publicField(this, "cleanupMap", /* @__PURE__ */ new WeakMap());
    __publicField(this, "renderedNodes", /* @__PURE__ */ new Set());
    // Map each element to its delegation container
    __publicField(this, "elementToContainer", /* @__PURE__ */ new WeakMap());
    __publicField(this, "metrics", {
      created: 0,
      adopted: 0,
      removed: 0,
      inserted: 0,
      moved: 0,
      cacheHits: 0,
      cacheMisses: 0,
      attributeWrites: 0,
      attributeRemovals: 0,
      textUpdates: 0,
      modifierApplications: 0
    });
  }
  /**
   * Render a DOM node to an actual DOM element
   */
  render(node, container) {
    if (Array.isArray(node)) {
      return this.renderFragment(node, container);
    }
    return this.renderSingle(node, container);
  }
  /**
   * Check if a DOM node has been rendered and tracked.
   */
  hasNode(node) {
    return this.nodeMap.has(node);
  }
  /**
   * Get the rendered DOM element associated with a node.
   */
  getRenderedNode(node) {
    return this.nodeMap.get(node);
  }
  /**
   * Render a single DOM node
   */
  renderSingle(node, container) {
    this.renderedNodes.add(node);
    let element;
    switch (node.type) {
      case "element":
        element = this.createOrUpdateElement(node, container);
        break;
      case "text":
        element = this.createOrUpdateTextNode(node);
        break;
      case "comment":
        element = this.createComment(node);
        this.metrics.created++;
        break;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
    this.nodeMap.set(node, element);
    node.element = element;
    if (element instanceof Element && container) {
      this.elementToContainer.set(element, container);
    }
    if (element instanceof Element) {
      let modifiers = [];
      if ("modifiers" in node && Array.isArray(node.modifiers) && node.modifiers.length > 0) {
        modifiers = node.modifiers;
      }
      if ("componentMetadata" in node && node.componentMetadata?.modifiers && Array.isArray(node.componentMetadata.modifiers) && node.componentMetadata.modifiers.length > 0) {
        modifiers = node.componentMetadata.modifiers;
      }
      if (modifiers.length > 0) {
        this.applyModifiersToElement(element, modifiers, node);
      }
    }
    if (node.dispose) {
      this.addCleanup(element, node.dispose);
    }
    if (container) {
      this.appendNode(container, element);
    }
    return element;
  }
  /**
   * Render multiple nodes as a document fragment
   */
  renderFragment(nodes, container) {
    const fragment = document.createDocumentFragment();
    nodes.forEach((node) => {
      const element = this.renderSingle(node);
      fragment.appendChild(element);
    });
    if (container) {
      container.appendChild(fragment);
      this.metrics.inserted += nodes.length;
    }
    return fragment;
  }
  /**
   * Create a DOM element with props and children
   */
  createOrUpdateElement(node, container) {
    if (!node.tag) {
      throw new Error("Element node must have a tag");
    }
    if (node.element && node.element instanceof Element) {
      const element2 = node.element;
      if (container) {
        this.elementToContainer.set(element2, container);
      }
      this.updateProps(element2, node, container);
      this.updateChildren(element2, node);
      return element2;
    }
    const element = document.createElement(node.tag);
    this.metrics.created++;
    if (container) {
      this.elementToContainer.set(element, container);
    }
    this.applyDebugAttributes(element, node);
    this.updateProps(element, node, container);
    this.updateChildren(element, node);
    return element;
  }
  updateProps(element, node, container) {
    const newProps = node.props || {};
    const previousProps = node.__appliedProps || {};
    Object.keys(previousProps).forEach((key) => {
      if (!(key in newProps)) {
        if (key === "key") return;
        if (key === "children") return;
        if (key.startsWith("on")) {
          return;
        }
        this.setElementProp(element, key, void 0);
      }
    });
    Object.entries(newProps).forEach(([key, value]) => {
      if (key === "key" || key === "children") return;
      if (previousProps && previousProps[key] === value) {
        return;
      }
      this.applyProp(element, key, value, container);
    });
    node.__appliedProps = { ...newProps };
    if ("componentMetadata" in node && node.componentMetadata) {
      const metadata = node.componentMetadata;
      if (metadata.overriddenTo && metadata.originalType) {
        if (node.tag) {
          try {
            semanticRoleManager.processElementNode(
              element,
              node.tag,
              metadata,
              newProps?.["aria"] || void 0
            );
          } catch (error) {
            console.warn("[tachUI] Could not process semantic attributes:", error);
          }
        }
      }
    }
  }
  updateChildren(element, node) {
    const previousChildren = node.__renderedChildren || [];
    const newChildren = node.children || [];
    const delegationContainer = this.elementToContainer.get(element);
    const debugChildDiff = typeof process !== "undefined" && process.env?.TACHUI_DEBUG_PHASE1B === "1";
    if (previousChildren.length === newChildren.length && previousChildren.length > 0 && previousChildren.every((child, index) => child === newChildren[index])) {
      newChildren.forEach((child) => {
        this.updateExistingNode(child);
      });
      node.__renderedChildren = newChildren;
      return;
    }
    if (previousChildren.length === 0) {
      newChildren.forEach((child) => {
        if (!child || child.type == null) return;
        const childElement = this.renderSingle(child, delegationContainer);
        this.appendNode(element, childElement);
      });
      node.__renderedChildren = newChildren;
      return;
    }
    const previousByKey = /* @__PURE__ */ new Map();
    const previousKeyless = [];
    previousChildren.forEach((prevChild) => {
      if (prevChild.key != null) {
        previousByKey.set(prevChild.key, prevChild);
      } else {
        previousKeyless.push(prevChild);
      }
    });
    const domNodes = Array.from({ length: newChildren.length });
    newChildren.forEach((child, index) => {
      let matched;
      if (child.key != null) {
        matched = previousByKey.get(child.key);
        if (matched) {
          previousByKey.delete(child.key);
        }
      } else if (previousKeyless.length > 0) {
        matched = previousKeyless.shift();
      }
      if (matched) {
        this.adoptNode(matched, child);
      }
      const rendered = this.renderSingle(child, delegationContainer);
      domNodes[index] = rendered;
    });
    if (debugChildDiff && node.tag) {
      const debugKeys = newChildren.map((child) => child.key ?? null);
      const debugPrevKeys = previousChildren.map((child) => child.key ?? null);
      const debugDom = domNodes.map(
        (domNode) => domNode && "getAttribute" in domNode ? domNode.getAttribute("data-id") : null
      );
      console.log("[diff] state", {
        parent: node.tag,
        prev: debugPrevKeys,
        next: debugKeys,
        dom: debugDom
      });
    }
    previousByKey.forEach((remaining) => {
      this.removeNode(remaining);
    });
    previousKeyless.forEach((remaining) => {
      this.removeNode(remaining);
    });
    const canReorder = typeof element.insertBefore === "function" && typeof element.appendChild === "function";
    if (canReorder) {
      let nextSibling = null;
      for (let i = domNodes.length - 1; i >= 0; i--) {
        const domNode = domNodes[i];
        if (!domNode) continue;
        this.insertNode(element, domNode, nextSibling);
        nextSibling = domNode;
      }
    }
    ;
    node.__renderedChildren = newChildren;
  }
  updateExistingNode(node) {
    if (node.type === "element" && node.element instanceof Element) {
      const container = this.elementToContainer.get(node.element);
      this.updateProps(node.element, node, container);
      this.updateChildren(node.element, node);
    } else if (node.type === "text" && node.element instanceof Text) {
      if (node.element.textContent !== node.text) {
        node.element.textContent = node.text || "";
        this.recordTextUpdate();
      }
    }
  }
  /**
   * Apply debug attributes to DOM element if debug mode is enabled
   */
  applyDebugAttributes(element, node) {
    if (!debugManager.isEnabled()) {
      return;
    }
    let componentType = node.tag || "element";
    let debugLabel;
    if ("componentMetadata" in node && node.componentMetadata) {
      const metadata = node.componentMetadata;
      if (metadata.type) {
        componentType = metadata.type;
      }
    }
    if (node.props && "data-tachui-label" in node.props) {
      debugLabel = node.props["data-tachui-label"];
    }
    if (node.props && "debugLabel" in node.props) {
      debugLabel = node.props.debugLabel;
    }
    debugManager.addDebugAttributes(
      element,
      componentType,
      debugLabel
    );
  }
  /**
   * Create or update a text node
   */
  createOrUpdateTextNode(node) {
    if (node.element && node.element instanceof Text) {
      const textElement = node.element;
      if (textElement.textContent !== node.text) {
        textElement.textContent = node.text || "";
        this.recordTextUpdate();
      }
      if (node.reactiveContent && !node.dispose) {
        const content = node.reactiveContent;
        const effect = createEffect(() => {
          try {
            const newText = content();
            node.text = String(newText);
            const parentElement = textElement.parentElement;
            if (parentElement && parentElement.__tachui_asHTML) {
              return;
            }
            textElement.textContent = node.text;
            this.recordTextUpdate();
          } catch (error) {
            console.error("createOrUpdateTextNode() reactive effect error:", error);
          }
        });
        node.dispose = () => {
          effect.dispose();
        };
      }
      return textElement;
    }
    return this.createTextNode(node);
  }
  /**
   * Create a text node
   */
  createTextNode(node) {
    const textElement = document.createTextNode(node.text || "");
    this.metrics.created++;
    this.recordTextUpdate();
    if (node.reactiveContent) {
      const content = node.reactiveContent;
      const effect = createEffect(() => {
        try {
          const newText = content();
          node.text = String(newText);
          const parentElement = textElement.parentElement;
          if (parentElement && parentElement.__tachui_asHTML) {
            return;
          }
          textElement.textContent = node.text;
          this.recordTextUpdate();
        } catch (error) {
          console.error("createTextNode() reactive effect error:", error);
        }
      });
      node.dispose = () => {
        effect.dispose();
      };
    }
    return textElement;
  }
  /**
   * Create a comment node
   */
  createComment(node) {
    this.metrics.created++;
    return document.createComment(node.text || "");
  }
  /**
   * Apply props to a DOM element with reactive updates
   */
  applyProps(element, props) {
    Object.entries(props).forEach(([key, value]) => {
      this.applyProp(element, key, value);
    });
  }
  /**
   * Apply a single prop to an element
   */
  applyProp(element, key, value, container) {
    if (key === "className" || key === "class") {
      this.applyClassName(element, value);
      return;
    }
    if (key === "style") {
      this.applyStyle(element, value);
      return;
    }
    if (key.startsWith("on") && typeof value === "function") {
      this.applyEventListener(element, key, value, container);
      return;
    }
    if (isSignal(value) || isComputed(value)) {
      const effect = createEffect(() => {
        const currentValue = value();
        this.setElementProp(element, key, currentValue);
      });
      this.addCleanup(element, () => {
        effect.dispose();
      });
      return;
    }
    this.setElementProp(element, key, value);
  }
  /**
   * Set a property on an element
   */
  setElementProp(element, key, value) {
    if (value == null) {
      if (element.hasAttribute(key)) {
        element.removeAttribute(key);
        this.recordAttributeRemoval();
      }
      return;
    }
    const htmlElement = element;
    if ((key === "value" || key === "checked" || key === "disabled") && key in htmlElement) {
      if (htmlElement[key] !== value) {
        htmlElement[key] = value;
        this.recordAttributeWrite();
      }
      return;
    }
    if (typeof value === "boolean") {
      if (value) {
        if (!element.hasAttribute(key)) {
          element.setAttribute(key, "");
          this.recordAttributeWrite();
        }
      } else {
        if (element.hasAttribute(key)) {
          element.removeAttribute(key);
          this.recordAttributeRemoval();
        } else {
          element.removeAttribute(key);
        }
      }
      return;
    }
    const currentValue = element.getAttribute(key);
    const stringValue = String(value);
    if (currentValue !== stringValue) {
      element.setAttribute(key, stringValue);
      this.recordAttributeWrite();
    }
  }
  /**
   * Apply className with reactive updates
   */
  applyClassName(element, value) {
    if (isSignal(value) || isComputed(value)) {
      const effect = createEffect(() => {
        const currentValue = value();
        const newClassName = this.normalizeClassName(currentValue);
        if (element.className !== newClassName) {
          element.className = newClassName;
          this.recordAttributeWrite();
        }
      });
      this.addCleanup(element, () => {
        effect.dispose();
      });
    } else {
      const newClassName = this.normalizeClassName(value);
      if (element.className !== newClassName) {
        element.className = newClassName;
        this.recordAttributeWrite();
      }
    }
  }
  /**
   * Normalize className value
   */
  normalizeClassName(value) {
    if (Array.isArray(value)) {
      return value.filter(Boolean).join(" ");
    }
    if (typeof value === "object" && value !== null) {
      return Object.entries(value).filter(([, condition]) => Boolean(condition)).map(([className]) => className).join(" ");
    }
    return String(value || "");
  }
  /**
   * Apply styles with reactive updates
   */
  applyStyle(element, value) {
    const htmlElement = element;
    if (isSignal(value) || isComputed(value)) {
      const effect = createEffect(() => {
        const currentValue = value();
        this.setElementStyles(htmlElement, currentValue);
      });
      this.addCleanup(element, () => {
        effect.dispose();
      });
    } else {
      this.setElementStyles(htmlElement, value);
    }
  }
  /**
   * Set styles on an element
   */
  setElementStyles(element, styles) {
    if (typeof styles === "string") {
      if (element.style.cssText !== styles) {
        element.style.cssText = styles;
        this.recordAttributeWrite();
      }
      return;
    }
    if (typeof styles === "object" && styles !== null) {
      const prevStyles = element.__appliedStyles || {};
      Object.keys(prevStyles).forEach((property) => {
        if (!(property in styles)) {
          element.style.removeProperty(property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`));
          this.recordAttributeRemoval();
        }
      });
      Object.entries(styles).forEach(([property, value]) => {
        if (isSignal(value) || isComputed(value)) {
          const effect = createEffect(() => {
            const currentValue = value();
            const kebabProperty = property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
            if (currentValue == null) {
              element.style.removeProperty(kebabProperty);
              this.recordAttributeRemoval();
            } else {
              const stringValue = String(currentValue);
              const currentStyleValue = element.style.getPropertyValue(kebabProperty);
              if (currentStyleValue !== stringValue) {
                element.style.setProperty(kebabProperty, stringValue);
                this.recordAttributeWrite();
              }
            }
          });
          this.addCleanup(element, () => {
            effect.dispose();
          });
        } else {
          const kebabProperty = property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
          if (value == null) {
            if (element.style.getPropertyValue(kebabProperty)) {
              element.style.removeProperty(kebabProperty);
              this.recordAttributeRemoval();
            }
          } else {
            const stringValue = String(value);
            const currentStyleValue = element.style.getPropertyValue(kebabProperty);
            if (currentStyleValue !== stringValue) {
              element.style.setProperty(kebabProperty, stringValue);
              this.recordAttributeWrite();
            }
          }
        }
      });
      element.__appliedStyles = { ...styles };
    }
  }
  /**
   * Apply event listener (with delegation if possible)
   */
  applyEventListener(element, eventName, handler, container) {
    let eventType = eventName.slice(2).toLowerCase();
    if (eventType === "focus") {
      eventType = "focusin";
    } else if (eventType === "blur") {
      eventType = "focusout";
    }
    const delegationContainer = container || this.elementToContainer.get(element);
    if (delegationContainer && globalEventDelegator.shouldDelegate(eventType)) {
      const cleanup = globalEventDelegator.register(
        delegationContainer,
        element,
        eventType,
        handler
      );
      this.addCleanup(element, cleanup);
      return;
    }
    const listener = (e) => {
      try {
        handler(e);
      } catch (error) {
        console.error(`Event handler error for ${eventName}:`, error);
      }
    };
    const options = globalEventDelegator.shouldBePassive(eventType) ? { passive: true } : void 0;
    element.addEventListener(eventType, listener, options);
    this.addCleanup(element, () => {
      element.removeEventListener(eventType, listener, options);
    });
  }
  /**
   * Add cleanup function for an element
   */
  addCleanup(element, cleanup) {
    const existing = this.cleanupMap.get(element) || [];
    existing.push(cleanup);
    this.cleanupMap.set(element, existing);
  }
  /**
   * Update an existing DOM node
   */
  updateNode(node, newProps) {
    const element = this.nodeMap.get(node);
    if (!element || typeof element.setAttribute !== "function") {
      return;
    }
    if (newProps) {
      this.applyProps(element, newProps);
    }
  }
  /**
   * Remove a DOM node and run cleanup
   */
  removeNode(node) {
    this.cleanupNode(node, true);
  }
  /**
   * Cleanup a node (and its descendants) and optionally remove from DOM.
   */
  cleanupNode(node, removeFromDom) {
    const element = this.nodeMap.get(node);
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        this.cleanupNode(child, false);
      });
    }
    if (!element) {
      if (node.element !== void 0) {
        node.element = void 0;
      }
      this.renderedNodes.delete(node);
      this.nodeMap.delete(node);
      return;
    }
    const cleanupFunctions = this.cleanupMap.get(element);
    if (cleanupFunctions) {
      cleanupFunctions.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      });
      this.cleanupMap.delete(element);
    }
    if (removeFromDom && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    this.nodeMap.delete(node);
    if (node.element !== void 0) {
      node.element = void 0;
    }
    this.renderedNodes.delete(node);
    this.metrics.removed++;
  }
  /**
   * Create reactive text content
   */
  createReactiveText(textAccessor) {
    const textNode = document.createTextNode("");
    createEffect(() => {
      textNode.textContent = textAccessor();
    });
    return textNode;
  }
  /**
   * Create reactive element with dynamic props
   */
  createReactiveElement(tag, propsAccessor, children) {
    const element = document.createElement(tag);
    createEffect(() => {
      const props = propsAccessor();
      this.applyProps(element, props);
    });
    if (children) {
      children.forEach((child) => {
        const childElement = this.renderSingle(child);
        element.appendChild(childElement);
      });
    }
    return element;
  }
  /**
   * Apply modifiers to a DOM element
   */
  applyModifiersToElement(element, modifiers, node) {
    try {
      if (modifiers.length > 0) {
        this.recordModifierApplications(modifiers.length);
      }
      const componentInstance = node.componentInstance || node.componentMetadata && node.componentMetadata.componentInstance || node._originalComponent || // Use original component if available
      node;
      applyModifiersToNode(
        node,
        modifiers,
        {
          element,
          componentId: node.componentId || "unknown",
          phase: "creation",
          componentInstance
          // Pass the component instance
        },
        {
          batch: true
          // Enable batched modifier application
        }
      );
    } catch (error) {
      console.error("Failed to apply modifiers to element:", error);
    }
  }
  /**
   * Adopt an existing DOM mapping from one node to another.
   */
  adoptNode(oldNode, newNode) {
    const element = this.nodeMap.get(oldNode);
    if (!element) return;
    this.nodeMap.set(newNode, element);
    this.nodeMap.delete(oldNode);
    this.renderedNodes.delete(oldNode);
    this.renderedNodes.add(newNode);
    newNode.element = element;
    if (oldNode.dispose) {
      newNode.dispose = oldNode.dispose;
    }
    if (oldNode.__renderedChildren) {
      newNode.__renderedChildren = oldNode.__renderedChildren;
    }
    if (oldNode.__appliedProps) {
      newNode.__appliedProps = oldNode.__appliedProps;
    }
    this.metrics.adopted++;
  }
  /**
   * Cleanup all tracked elements
   */
  cleanup() {
    for (const node of this.renderedNodes) {
      if (node.dispose && typeof node.dispose === "function") {
        try {
          node.dispose();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      }
    }
    this.renderedNodes.clear();
    this.nodeMap = /* @__PURE__ */ new WeakMap();
    this.cleanupMap = /* @__PURE__ */ new WeakMap();
    this.resetMetrics();
  }
  resetMetrics() {
    this.metrics = {
      created: 0,
      adopted: 0,
      removed: 0,
      inserted: 0,
      moved: 0,
      cacheHits: 0,
      cacheMisses: 0,
      attributeWrites: 0,
      attributeRemovals: 0,
      textUpdates: 0,
      modifierApplications: 0
    };
  }
  getMetrics() {
    return { ...this.metrics };
  }
  recordCacheHit() {
    this.metrics.cacheHits++;
  }
  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }
  insertNode(container, node, nextSibling) {
    const debugChildDiff = typeof process !== "undefined" && process.env?.TACHUI_DEBUG_PHASE1B === "1";
    if (node.parentNode !== container) {
      if (debugChildDiff) {
        console.log("[diff] insertNode append", {
          tag: "tagName" in node ? node.tagName : "text",
          before: nextSibling && "getAttribute" in nextSibling ? nextSibling.getAttribute("data-id") : null
        });
      }
      container.insertBefore(node, nextSibling);
      this.metrics.inserted++;
    } else if (node.nextSibling !== nextSibling) {
      if (debugChildDiff) {
        console.log("[diff] insertNode move", {
          tag: "tagName" in node ? node.tagName : "text",
          before: nextSibling && "getAttribute" in nextSibling ? nextSibling.getAttribute("data-id") : null
        });
      }
      container.insertBefore(node, nextSibling);
      this.metrics.moved++;
    }
  }
  appendNode(container, node) {
    if (node.parentNode !== container) {
      container.appendChild(node);
      this.metrics.inserted++;
    }
  }
  recordAttributeWrite() {
    this.metrics.attributeWrites++;
  }
  recordAttributeRemoval() {
    this.metrics.attributeRemovals++;
  }
  recordTextUpdate() {
    this.metrics.textUpdates++;
  }
  recordModifierApplications(count) {
    this.metrics.modifierApplications += count;
  }
};
var globalRenderer = new DOMRenderer();
function resetRendererMetrics() {
  globalRenderer.resetMetrics();
}
function getRendererMetrics() {
  return globalRenderer.getMetrics();
}
function renderComponent(instance, container) {
  return createRoot(() => {
    let currentNodes = [];
    const keyToNodeCache = /* @__PURE__ */ new Map();
    const populateFromCache = (node) => {
      if (node.key != null) {
        const cached = keyToNodeCache.get(node.key);
        if (cached && cached.type === node.type && cached.tag === node.tag && cached.element) {
          node.element = cached.element;
          if (cached.__appliedProps) {
            node.__appliedProps = cached.__appliedProps;
          }
          if (cached.__renderedChildren) {
            node.__renderedChildren = cached.__renderedChildren;
          }
          globalRenderer.recordCacheHit();
        } else {
          globalRenderer.recordCacheMiss();
        }
      }
      if (node.children) {
        node.children.forEach(populateFromCache);
      }
    };
    const effect = createEffect(() => {
      let componentToRender = instance;
      if ("build" in instance && typeof instance.build === "function") {
        componentToRender = instance.build();
      }
      const renderResult = componentToRender.render();
      const nodes = Array.isArray(renderResult) ? renderResult : [renderResult];
      nodes.forEach(populateFromCache);
      const removalSet = new Set(currentNodes);
      const adoptedByIndex = /* @__PURE__ */ new Set();
      const adoptedOldNodes = /* @__PURE__ */ new Set();
      const minLength = Math.min(currentNodes.length, nodes.length);
      for (let i = 0; i < minLength; i++) {
        const oldNode = currentNodes[i];
        const newNode = nodes[i];
        if (oldNode && newNode && oldNode.type === newNode.type && oldNode.tag === newNode.tag && (oldNode.key === newNode.key || oldNode.key == null && newNode.key == null)) {
          globalRenderer.adoptNode(oldNode, newNode);
          adoptedByIndex.add(newNode);
          adoptedOldNodes.add(oldNode);
          removalSet.delete(oldNode);
        }
      }
      currentNodes.forEach((node) => {
        if (node.key != null) {
          keyToNodeCache.set(node.key, node);
        }
      });
      const currentKeyMap = /* @__PURE__ */ new Map();
      currentNodes.forEach((node) => {
        if (node.key != null && !adoptedOldNodes.has(node)) {
          currentKeyMap.set(node.key, node);
        }
      });
      const domNodes = nodes.map((node) => {
        if (adoptedByIndex.has(node)) {
          globalRenderer.render(node, container);
          return globalRenderer.getRenderedNode(node);
        }
        if (node.key != null) {
          const cached = keyToNodeCache.get(node.key);
          if (cached && cached.type === node.type && cached.tag === node.tag) {
            globalRenderer.recordCacheHit();
            removalSet.delete(cached);
            currentKeyMap.delete(node.key);
            keyToNodeCache.set(node.key, node);
            globalRenderer.adoptNode(cached, node);
            globalRenderer.render(node, container);
            return globalRenderer.getRenderedNode(node);
          } else {
            globalRenderer.recordCacheMiss();
          }
        }
        if (node.key != null) {
          const existing = currentKeyMap.get(node.key);
          if (existing) {
            currentKeyMap.delete(node.key);
            removalSet.delete(existing);
            globalRenderer.adoptNode(existing, node);
            keyToNodeCache.set(node.key, node);
            globalRenderer.render(node, container);
            return globalRenderer.getRenderedNode(node);
          }
        }
        if (node.key != null) {
          for (const candidate of removalSet) {
            if (candidate.key === node.key) {
              removalSet.delete(candidate);
              globalRenderer.adoptNode(candidate, node);
              globalRenderer.render(node, container);
              break;
            }
          }
        }
        if (!globalRenderer.hasNode(node)) {
          for (const candidate of removalSet) {
            if (candidate.type === node.type && candidate.tag === node.tag && candidate.key == null && node.key == null) {
              removalSet.delete(candidate);
              globalRenderer.adoptNode(candidate, node);
              globalRenderer.render(node, container);
              break;
            }
          }
        }
        if (!globalRenderer.hasNode(node)) {
          globalRenderer.render(node, container);
          if (node.key != null) {
            keyToNodeCache.set(node.key, node);
          }
        }
        return globalRenderer.getRenderedNode(node);
      });
      removalSet.forEach((node) => {
        globalRenderer.removeNode(node);
        if (node.key != null) {
          keyToNodeCache.delete(node.key);
        }
      });
      const canReorder = typeof container.insertBefore === "function" && typeof container.appendChild === "function";
      if (canReorder) {
        let nextSibling = null;
        for (let i = domNodes.length - 1; i >= 0; i--) {
          const domNode = domNodes[i];
          if (!domNode) continue;
          globalRenderer.insertNode(container, domNode, nextSibling);
          nextSibling = domNode;
        }
      } else {
        domNodes.forEach((domNode) => {
          if (domNode && domNode.parentNode !== container) {
            globalRenderer.appendNode(container, domNode);
          }
        });
      }
      const updateCache = (node) => {
        if (node.key != null && node.element) {
          keyToNodeCache.set(node.key, node);
        }
        if (node.children) {
          node.children.forEach(updateCache);
        }
      };
      nodes.forEach(updateCache);
      currentNodes = nodes;
    });
    return () => {
      effect.dispose();
      currentNodes.forEach((node) => {
        globalRenderer.removeNode(node);
      });
      keyToNodeCache.clear();
      globalEventDelegator.cleanupContainer(container);
    };
  });
}
function h(tag, props, ...children) {
  const normalizedChildren = children.flat().filter((child) => child != null).map((child) => {
    if (typeof child === "string" || typeof child === "number") {
      return { type: "text", text: String(child) };
    }
    return child;
  });
  const node = {
    type: "element",
    tag,
    props: props || {},
    children: normalizedChildren,
    key: props?.key ?? void 0
  };
  if (props && "componentMetadata" in props) {
    ;
    node.componentMetadata = props.componentMetadata;
  }
  return node;
}

// benchmarks/data.ts
function generateData(count = 1e3) {
  const adjectives = [
    "pretty",
    "large",
    "big",
    "small",
    "tall",
    "short",
    "long",
    "handsome",
    "plain",
    "quaint",
    "clean",
    "elegant",
    "easy",
    "angry",
    "crazy",
    "helpful",
    "mushy",
    "odd",
    "unsightly",
    "adorable",
    "important",
    "inexpensive",
    "cheap",
    "expensive",
    "fancy"
  ];
  const colours = [
    "red",
    "yellow",
    "blue",
    "green",
    "pink",
    "brown",
    "purple",
    "brown",
    "white",
    "black",
    "orange"
  ];
  const nouns = [
    "table",
    "chair",
    "house",
    "bbq",
    "desk",
    "car",
    "pony",
    "cookie",
    "sandwich",
    "burger",
    "pizza",
    "mouse",
    "keyboard"
  ];
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: i + 1,
      label: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${colours[Math.floor(Math.random() * colours.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`
    });
  }
  return data;
}

// benchmarks/browser-runner.ts
var METRIC_KEYS = [
  "created",
  "adopted",
  "removed",
  "inserted",
  "moved",
  "cacheHits",
  "cacheMisses",
  "attributeWrites",
  "attributeRemovals",
  "textUpdates",
  "modifierApplications"
];
function cloneMetrics(snapshot) {
  const clone = {};
  METRIC_KEYS.forEach((key) => {
    clone[key] = snapshot[key];
  });
  return clone;
}
function accumulateMetrics(target, source) {
  METRIC_KEYS.forEach((key) => {
    target[key] += source[key];
  });
}
function updateMaxMetrics(target, source) {
  METRIC_KEYS.forEach((key) => {
    target[key] = Math.max(target[key], source[key]);
  });
}
function computeAverageMetrics(totals, iterations) {
  const average = {};
  METRIC_KEYS.forEach((key) => {
    average[key] = iterations === 0 ? 0 : totals[key] / iterations;
  });
  return average;
}
var RendererMetricsCollector = class {
  constructor() {
    __publicField(this, "summaries", /* @__PURE__ */ new Map());
  }
  addSnapshot(name, snapshot) {
    const summary = this.summaries.get(name);
    if (!summary) {
      this.summaries.set(name, {
        iterations: 1,
        totals: cloneMetrics(snapshot),
        average: cloneMetrics(snapshot),
        max: cloneMetrics(snapshot),
        samples: [cloneMetrics(snapshot)]
      });
      return;
    }
    summary.iterations += 1;
    accumulateMetrics(summary.totals, snapshot);
    updateMaxMetrics(summary.max, snapshot);
    summary.samples.push(cloneMetrics(snapshot));
    summary.average = computeAverageMetrics(summary.totals, summary.iterations);
  }
  reset() {
    this.summaries.clear();
  }
  toJSON() {
    const output = {};
    this.summaries.forEach((summary, name) => {
      output[name] = {
        iterations: summary.iterations,
        totals: cloneMetrics(summary.totals),
        average: cloneMetrics(summary.average),
        max: cloneMetrics(summary.max),
        samples: summary.samples.map(cloneMetrics)
      };
    });
    return output;
  }
};
function createRowNode(id, getRowData, getSelectedId, onSelect) {
  const rowProps = {
    // Reactive className - updates when selectedId changes
    className: getSelectedId ? () => id === getSelectedId() ? "selected" : "" : "",
    "data-id": id,
    key: id
  };
  if (onSelect) {
    rowProps.onClick = () => onSelect(id);
  }
  return h(
    "tr",
    rowProps,
    h("td", { className: "col-md-1" }, id.toString()),
    h("td", { className: "col-md-4" }, h("a", null, () => getRowData().label)),
    // Reactive text - updates when label changes
    h(
      "td",
      { className: "col-md-1" },
      h(
        "button",
        {
          className: "btn btn-sm btn-danger",
          type: "button"
        },
        "x"
      )
    ),
    h("td", { className: "col-md-6" })
  );
}
function createTableComponent(options) {
  let renderCount = 0;
  const rowNodeCache = /* @__PURE__ */ new Map();
  return createComponent(() => {
    renderCount++;
    console.log(`[TableComponent] Render #${renderCount}`);
    const rowIds = options.list.ids();
    console.log(`[TableComponent] Row IDs length: ${rowIds.length}`);
    const rows = rowIds.map((id) => {
      let rowNode = rowNodeCache.get(id);
      if (!rowNode) {
        const getRowData = options.list.get(id);
        rowNode = createRowNode(id, getRowData, options.getSelectedId || null, options.onSelect);
        rowNodeCache.set(id, rowNode);
      }
      return rowNode;
    });
    const currentIdSet = new Set(rowIds);
    for (const cachedId of rowNodeCache.keys()) {
      if (!currentIdSet.has(cachedId)) {
        rowNodeCache.delete(cachedId);
      }
    }
    return h(
      "table",
      { className: "table table-hover table-striped test-data", key: "table-root" },
      h("tbody", { key: "table-body" }, ...rows)
    );
  });
}
var BrowserBenchmarkRunner = class {
  constructor() {
    __publicField(this, "results", []);
    __publicField(this, "metricsCollector", new RendererMetricsCollector());
    __publicField(this, "isRunning", false);
    __publicField(this, "baselineRows", []);
    __publicField(this, "alternateLabels", []);
    __publicField(this, "originalLabels", []);
    __publicField(this, "useAlternateLabels", true);
    __publicField(this, "rowsCreated", false);
    // Fine-grained reactivity using framework's createSignalList
    __publicField(this, "rowList");
    __publicField(this, "getSelectedId");
    __publicField(this, "setSelectedId");
    __publicField(this, "disposeTable");
    __publicField(this, "statusDiv");
    __publicField(this, "resultsDiv");
    __publicField(this, "outputDiv");
    this.statusDiv = document.getElementById("status");
    this.resultsDiv = document.getElementById("results");
    this.outputDiv = document.getElementById("benchmark-output");
    const [, list] = createSignalList([], (item) => item.id);
    this.rowList = list;
    [this.getSelectedId, this.setSelectedId] = createSignal(null);
    const TableComponent = createTableComponent({
      list: this.rowList,
      getSelectedId: () => this.getSelectedId(),
      onSelect: (id) => this.setSelectedId(id)
    });
    const root = document.getElementById("tachui-root");
    if (!root) {
      throw new Error("Missing #tachui-root container");
    }
    const tableInstance = TableComponent({});
    this.disposeTable = renderComponent(tableInstance, root);
    this.setupEventListeners();
    window.benchmarkRunner = this;
  }
  destroy() {
    this.disposeTable();
    window.benchmarkRunner = void 0;
  }
  setupEventListeners() {
    document.getElementById("create-rows")?.addEventListener("click", () => {
      void this.createRowsBenchmark();
    });
    document.getElementById("replace-rows")?.addEventListener("click", () => {
      void this.replaceAllRowsBenchmark();
    });
    document.getElementById("update-rows")?.addEventListener("click", () => {
      void this.updateEveryTenthRowBenchmark();
    });
    document.getElementById("select-row")?.addEventListener("click", () => {
      void this.selectRowBenchmark();
    });
    document.getElementById("swap-rows")?.addEventListener("click", () => {
      void this.swapRowsBenchmark();
    });
    document.getElementById("remove-rows")?.addEventListener("click", () => {
      void this.removeRowsBenchmark();
    });
    document.getElementById("clear-rows")?.addEventListener("click", () => {
      void this.clearRowsBenchmark();
    });
    document.getElementById("run-all")?.addEventListener("click", () => {
      void this.runAllBenchmarks();
    });
    document.getElementById("run-component-test")?.addEventListener("click", () => {
      void this.componentCreationBenchmark();
    });
  }
  clearResults() {
    this.results = [];
    this.metricsCollector.reset();
    this.resultsDiv.style.display = "none";
    this.outputDiv.innerHTML = "";
    this.rowList.clear();
    this.setSelectedId(null);
    this.rowsCreated = false;
  }
  getResults() {
    return this.results;
  }
  getLatestResult() {
    return this.results[this.results.length - 1];
  }
  getRendererMetrics() {
    return this.metricsCollector.toJSON();
  }
  async measurePerformance(name, operation) {
    if (this.isRunning) {
      return null;
    }
    this.setStatus(`Running: ${name}...`, "info");
    this.isRunning = true;
    try {
      this.runGcIfAvailable();
      resetRendererMetrics();
      const startTime = performance.now();
      await operation();
      await Promise.resolve();
      await new Promise(requestAnimationFrame);
      const endTime = performance.now();
      const duration = endTime - startTime;
      const memory = this.readHeapSize();
      const operationsPerSecond = duration > 0 ? Math.round(1e3 / duration * 100) : 0;
      const metricsSnapshot = getRendererMetrics();
      this.metricsCollector.addSnapshot(name, metricsSnapshot);
      const result = {
        name,
        duration: Math.round(duration * 100) / 100,
        memory,
        operationsPerSecond,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.results.push(result);
      this.updateResults();
      this.setStatus(`\u2705 ${name}: ${result.duration}ms`, "success");
      return result;
    } catch (error) {
      this.setStatus(`\u274C ${name} failed: ${error.message}`, "error");
      throw error;
    } finally {
      this.isRunning = false;
    }
  }
  setStatus(message, type) {
    this.statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
  }
  updateResults() {
    if (this.results.length === 0) {
      return;
    }
    this.resultsDiv.style.display = "block";
    const latest = this.getLatestResult();
    const rows = this.results.map(
      (result) => `
        <tr>
          <td>${result.name}</td>
          <td>${result.duration}</td>
          <td>${result.memory ?? "n/a"}</td>
          <td>${result.operationsPerSecond}</td>
        </tr>`
    ).join("");
    this.outputDiv.innerHTML = `
      <h4>Latest Result: ${latest?.name}</h4>
      <p><strong>Duration:</strong> ${latest?.duration ?? "n/a"}ms</p>
      <p><strong>Memory:</strong> ${latest?.memory ?? "n/a"}MB</p>
      <p><strong>Ops/sec:</strong> ${latest?.operationsPerSecond ?? "n/a"}</p>
      
      <h4>All Results (${this.results.length} tests)</h4>
      <table style="width: 100%; font-size: 12px;">
        <thead>
          <tr>
            <th>Test</th>
            <th>Duration (ms)</th>
            <th>Memory (MB)</th>
            <th>Ops/sec</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }
  readHeapSize() {
    const perf = performance.memory;
    if (perf && typeof perf.usedJSHeapSize === "number") {
      return Math.round(perf.usedJSHeapSize / 1024 / 1024 * 100) / 100;
    }
    return null;
  }
  runGcIfAvailable() {
    try {
      if (typeof window.gc === "function") {
        window.gc();
      }
    } catch {
    }
    try {
      if (typeof globalThis.gc === "function") {
        ;
        globalThis.gc();
      }
    } catch {
    }
  }
  ensureBaselineData() {
    if (this.baselineRows.length === 0) {
      this.baselineRows = generateData(1e3);
      this.originalLabels = this.baselineRows.map((row) => row.label);
      this.alternateLabels = generateData(1e3).map((row) => row.label);
    }
  }
  applyRows(rows) {
    this.rowList.set(rows);
  }
  mutateRows(rows) {
    rows.forEach((row) => {
      this.rowList.update(row.id, row);
    });
  }
  async createRowsBenchmark() {
    await this.measurePerformance("Create 1,000 rows", async () => {
      this.ensureBaselineData();
      this.applyRows(this.baselineRows.map((row) => ({ ...row })));
      this.rowsCreated = true;
      this.useAlternateLabels = true;
    });
  }
  async replaceAllRowsBenchmark() {
    this.ensureBaselineData();
    const needsSetup = this.baselineRows.length > 0 && !this.rowsCreated;
    if (needsSetup) {
      this.applyRows(this.baselineRows.map((row) => ({ ...row })));
      this.rowsCreated = true;
      await Promise.resolve();
      await new Promise(requestAnimationFrame);
    }
    await this.measurePerformance("Replace all 1,000 rows", async () => {
      const labels = this.useAlternateLabels ? this.alternateLabels : this.originalLabels;
      this.baselineRows.forEach((row, index) => {
        this.rowList.update(row.id, { id: row.id, label: labels[index] ?? row.label });
      });
      this.useAlternateLabels = !this.useAlternateLabels;
    });
  }
  async updateEveryTenthRowBenchmark() {
    this.ensureBaselineData();
    const needsSetup = this.baselineRows.length > 0 && !this.rowsCreated;
    if (needsSetup) {
      this.applyRows(this.baselineRows.map((row) => ({ ...row })));
      this.rowsCreated = true;
      await Promise.resolve();
      await new Promise(requestAnimationFrame);
    }
    await this.measurePerformance("Partial update (every 10th row)", async () => {
      this.baselineRows.forEach((row, index) => {
        if (index % 10 === 0) {
          this.rowList.update(row.id, { id: row.id, label: `${row.label} !!!` });
        }
      });
    });
  }
  async selectRowBenchmark() {
    this.ensureBaselineData();
    const needsSetup = this.baselineRows.length > 0 && !this.rowsCreated;
    if (needsSetup) {
      this.applyRows(this.baselineRows.map((row) => ({ ...row })));
      this.rowsCreated = true;
      await Promise.resolve();
      await new Promise(requestAnimationFrame);
    }
    await this.measurePerformance("Select row", async () => {
      const middleIndex = Math.floor(this.baselineRows.length / 2);
      const targetId = this.baselineRows[middleIndex]?.id ?? null;
      this.setSelectedId(targetId);
    });
  }
  async swapRowsBenchmark() {
    this.ensureBaselineData();
    const needsSetup = this.baselineRows.length > 0 && !this.rowsCreated;
    if (needsSetup) {
      this.applyRows(this.baselineRows.map((row) => ({ ...row })));
      this.rowsCreated = true;
      await Promise.resolve();
      await new Promise(requestAnimationFrame);
    }
    await this.measurePerformance("Swap rows", async () => {
      const ids = this.rowList.ids();
      if (ids.length < 2) return;
      const nextIds = [...ids];
      const secondIndex = 1;
      const penultimateIndex = nextIds.length - 2;
      [nextIds[secondIndex], nextIds[penultimateIndex]] = [
        nextIds[penultimateIndex],
        nextIds[secondIndex]
      ];
      this.rowList.reorder(nextIds);
    });
  }
  async removeRowsBenchmark() {
    this.ensureBaselineData();
    const needsSetup = this.baselineRows.length > 0 && !this.rowsCreated;
    if (needsSetup) {
      this.applyRows(this.baselineRows.map((row) => ({ ...row })));
      this.rowsCreated = true;
      await Promise.resolve();
      await new Promise(requestAnimationFrame);
    }
    await this.measurePerformance("Remove rows", async () => {
      const ids = this.rowList.ids();
      if (ids.length === 0) return;
      const toRemove = ids.filter((_, index) => index % 10 === 0);
      toRemove.forEach((id) => this.rowList.remove(id));
    });
  }
  async clearRowsBenchmark() {
    await this.measurePerformance("Clear rows", async () => {
      this.rowList.clear();
      this.setSelectedId(null);
    });
  }
  async componentCreationBenchmark() {
    await this.measurePerformance("Component creation (1,000 components)", async () => {
      const SimpleComponent = createComponent(
        (props) => h("div", null, props.text)
      );
      for (let i = 0; i < 1e3; i++) {
        SimpleComponent({ text: `Component ${i}` });
      }
    });
  }
  async runAllBenchmarks() {
    if (this.isRunning) {
      return;
    }
    this.metricsCollector.reset();
    this.results = [];
    this.resultsDiv.style.display = "none";
    this.outputDiv.innerHTML = "";
    console.log("[Benchmark] About to run Create rows");
    await this.createRowsBenchmark();
    console.log("[Benchmark] Create rows complete, waiting 50ms");
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log("[Benchmark] About to run Replace all");
    await this.replaceAllRowsBenchmark();
    console.log("[Benchmark] Replace all complete, waiting 50ms");
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log("[Benchmark] About to run Partial update");
    await this.updateEveryTenthRowBenchmark();
    console.log("[Benchmark] Partial update complete, waiting 50ms");
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log("[Benchmark] About to run Select row");
    await this.selectRowBenchmark();
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log("[Benchmark] About to run Swap rows");
    await this.swapRowsBenchmark();
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log("[Benchmark] About to run Remove rows");
    await this.removeRowsBenchmark();
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log("[Benchmark] About to run Clear rows");
    await this.clearRowsBenchmark();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await this.componentCreationBenchmark();
    this.setStatus(`\u2705 All benchmarks completed! ${this.results.length} tests run.`, "success");
  }
  async runAll() {
    await this.runAllBenchmarks();
    return this.results;
  }
};
document.addEventListener("DOMContentLoaded", () => {
  new BrowserBenchmarkRunner();
});

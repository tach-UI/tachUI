import { createEnvironmentKey } from "@tachui/core/runtime";
import { AppStateStore } from "./appStateStore";

// Create a shared environment key for AppStateStore
export const AppStateKey = createEnvironmentKey<AppStateStore>("AppStateStore");

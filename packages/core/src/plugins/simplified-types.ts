/**
 * Simplified Plugin Types - Phase 1 Implementation
 * 
 * Streamlined type definitions for the simplified plugin system.
 * Removes complex configuration schemas, security features, and performance monitoring.
 */

import type { Component } from '../runtime/types'
import type { SimplifiedComponentRegistry } from './simplified-component-registry'

/**
 * Simplified plugin interface with essential properties only
 */
export interface TachUIPlugin {
  /** Unique plugin name */
  name: string
  
  /** Plugin version (semver recommended) */
  version: string
  
  /** Plugin description (optional) */
  description?: string
  
  /** Plugin installation function */
  install(instance: TachUIInstance): Promise<void>
  
  /** Plugin uninstallation function (optional) */
  uninstall?(): Promise<void>
}

/**
 * Simplified TachUI instance interface for plugins
 */
export interface TachUIInstance {
  /** Register a component with the framework */
  registerComponent(name: string, component: Component, options?: ComponentRegistrationOptions): void
  
  /** Register a service with the framework */
  registerService(name: string, service: any): void
  
  /** Access to component registry */
  components: SimplifiedComponentRegistry
  
  /** Access to services registry */
  services: Map<string, any>
}

/**
 * Component registration options (simplified)
 */
export interface ComponentRegistrationOptions {
  /** Component category for organization */
  category?: string
  
  /** Tags for component discovery */
  tags?: string[]
  
  /** Whether to overwrite existing component */
  overwrite?: boolean
}

/**
 * Plugin error class for handling plugin-related errors
 */
export class PluginError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'PluginError'
  }
}

/**
 * Service registration interface
 */
export interface ServiceRegistration {
  name: string
  service: any
  plugin?: string
}
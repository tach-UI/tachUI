// Test setup for @tachui/devtools
import { JSDOM } from 'jsdom'

// Mock DOM environment for tests
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable',
})

// Set up global DOM
global.window = dom.window as any
global.document = dom.window.document
global.navigator = dom.window.navigator
global.HTMLElement = dom.window.HTMLElement
global.HTMLDivElement = dom.window.HTMLDivElement
global.HTMLButtonElement = dom.window.HTMLButtonElement

// Mock import.meta.env for tests
global.import = {
  meta: {
    env: {
      DEV: true,
      PROD: false,
      NODE_ENV: 'development',
    },
  },
} as any

// Clean up after tests
afterAll(() => {
  dom.window.close()
})

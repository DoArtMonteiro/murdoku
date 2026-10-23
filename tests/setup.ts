import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has no WebGL implementation. Returning null matches browser feature
// detection without emitting one "not implemented" diagnostic per board.
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => null,
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

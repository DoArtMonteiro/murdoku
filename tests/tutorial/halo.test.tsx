import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { statementsOf } from '../../src/casebook/lens'
import { case0 } from '../../src/tutorial/case0'
import Tutorial from '../../src/tutorial/Tutorial'

// The deployed page sets style-src 'self': an inline <style> element is refused, and an empty one logs
// "Applying inline style violates ... sha256-47DEQpj8HBSa..." (the hash of ''). The halo is static CSS keyed on
// data-halo tokens instead.
afterEach(cleanup)

const css = readFileSync('src/tutorial/tutorial.css', 'utf8')

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sources(path) : /\.tsx?$/.test(name) ? [path] : []
  })
}

describe('Case 0 and the Content-Security-Policy (no inline style)', () => {
  it('puts no <style> element on the page, before or after Begin', () => {
    render(<Tutorial />)
    expect(document.querySelectorAll('style')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))
    expect(document.querySelectorAll('style')).toHaveLength(0)
    expect(document.querySelector('.cb-root')?.getAttribute('data-halo')).toBeTruthy()
  })

  it('has no <style> element or raw HTML in the casebook or tutorial source', () => {
    for (const file of [...sources('src/casebook'), ...sources('src/tutorial')]) {
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toMatch(/<style[\s>]/)
      expect(text, file).not.toContain('dangerouslySetInnerHTML')
    }
  })

  it('has a halo rule for every cell, statement and suspect Case 0 can point at', () => {
    const tokens: string[] = ['bar']
    for (let r = 0; r < case0.size; r++) for (let c = 0; c < case0.size; c++) tokens.push(`cell-${r}-${c}`)
    case0.people.forEach((person, i) => {
      tokens.push(`who-${i}`)
      for (let k = 0; k < statementsOf(case0, person).length; k++) tokens.push(`chip-${k}`)
    })
    for (const token of tokens) expect(css, token).toContain(`[data-halo~="${token}"]`)
  })
})

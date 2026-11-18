import { createContext } from 'react'
import type { Person } from '../../core/types'

/** The people of the case being played, by id: the avatar needs a seed and an accent. */
export const PortraitMap = createContext<Readonly<Record<string, Person>>>({})

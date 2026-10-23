import { createContext } from 'react'

/** Per-case portrait choices (story.portrait): person id -> contact-sheet index. */
export const PortraitMap = createContext<Readonly<Record<string, number>>>({})

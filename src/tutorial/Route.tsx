import Tutorial from './Tutorial'

/** `?tutorial` plays Case 0. The route is gated in App.tsx exactly like the casebook's: DEV or VITE_CASEBOOK=1. */
export default function TutorialRoute() {
  return <Tutorial />
}

"use client"

import * as React from "react"

// The admin opens its dialogs from state, with no Radix Trigger, so Radix has nothing to give focus
// back to when one closes. This remembers the control that had focus when the dialog opened and
// returns focus to it on close.

type FocusHandler = (event: Event) => void

const OPEN_LAYER = "[role=dialog][data-state=open],[role=alertdialog][data-state=open]"
const ANY_LAYER = "[role=dialog],[role=alertdialog]"

// Details -> Edit / Delete: the second dialog is opened from inside the first one, so it takes over
// the first one's opener (the row's "Details" button).
let chainOpener: HTMLElement | null = null

function fallbackTarget(): HTMLElement | null {
  const search = document.getElementById("search")
  if (search && search.getClientRects().length > 0) return search
  const heading = document.querySelector<HTMLElement>(".admin-shell h1")
  if (heading && !heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1")
  return heading
}

function restoreFocus(opener: HTMLElement, useFallback: boolean) {
  const pick = () => (opener.isConnected ? opener : useFallback ? fallbackTarget() : null)
  let current = pick()
  current?.focus()
  // The opener can disappear a moment later (its row was deleted, or the page changed after a delete):
  // if that left focus on nothing, move it to the fallback.
  for (const delay of [400, 1200]) {
    window.setTimeout(() => {
      if (current?.isConnected) return
      if (document.querySelector(OPEN_LAYER)) return
      const active = document.activeElement
      if (active && active !== document.body) return
      current = pick()
      current?.focus()
    }, delay)
  }
}

export function useReturnFocus({
  onOpenAutoFocus,
  onCloseAutoFocus,
  fallback = true,
}: {
  onOpenAutoFocus?: FocusHandler
  onCloseAutoFocus?: FocusHandler
  /** When the opener is gone, focus the search field or the page heading instead. */
  fallback?: boolean
}) {
  const opener = React.useRef<HTMLElement | null>(null)

  const handleOpen = React.useCallback(
    (event: Event) => {
      const active = document.activeElement as HTMLElement | null
      if (active && active !== document.body && !active.closest(ANY_LAYER)) {
        opener.current = active
        chainOpener = active
      } else {
        opener.current = chainOpener
      }
      onOpenAutoFocus?.(event)
    },
    [onOpenAutoFocus]
  )

  const handleClose = React.useCallback(
    (event: Event) => {
      onCloseAutoFocus?.(event)
      const target = opener.current
      opener.current = null
      if (event.defaultPrevented) return
      event.preventDefault()
      // another dialog took over (Details -> Edit): leave focus inside it
      if (document.querySelector(OPEN_LAYER)) return
      chainOpener = null
      if (target) restoreFocus(target, fallback)
    },
    [onCloseAutoFocus, fallback]
  )

  return { onOpenAutoFocus: handleOpen, onCloseAutoFocus: handleClose }
}

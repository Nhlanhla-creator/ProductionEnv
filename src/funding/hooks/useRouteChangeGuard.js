"use client"

import { useCallback, useState } from "react"
import { previewRouteChange, applyRouteChange } from "../services/routeChangeService"

/**
 * Wraps a route-change decision in a confirmation flow.
 *
 * Usage inside StepRoute:
 *   const guard = useRouteChangeGuard({ request, updateField, requestId })
 *   ...
 *   onClick={() => guard.requestChange(newInstrumentId, newCategory)}
 *
 * If the change is trivial (no deactivations) the guard applies it
 * silently. Otherwise it opens the confirmation dialog.
 */

export default function useRouteChangeGuard({ request, requestId, onApply }) {
  const [pending, setPending] = useState(null)
  const [applied, setApplied] = useState(null)

  const requestChange = useCallback((newInstrumentId, newCategory) => {
    if (!request) return

    // No change — nothing to do.
    if (
      request.instrumentId === newInstrumentId &&
      request.instrumentCategory === newCategory
    ) {
      return
    }

    const preview = previewRouteChange({ request, newInstrumentId, newCategory })

    // If nothing gets deactivated, apply directly.
    if (preview.diff.deactivated.length === 0) {
      onApply?.(preview.patch)
      setApplied(preview)
      return
    }

    // Otherwise show the dialog.
    setPending({ preview, newInstrumentId, newCategory })
  }, [request, onApply])

  const confirm = useCallback(async () => {
    if (!pending) return
    const result = await applyRouteChange({
      requestId,
      request,
      newInstrumentId: pending.newInstrumentId,
      newCategory: pending.newCategory,
    })
    onApply?.(result.patch)
    setApplied(result)
    setPending(null)
    return result
  }, [pending, request, requestId, onApply])

  const cancel = useCallback(() => setPending(null), [])

  return {
    pending,           // { preview, newInstrumentId, newCategory } | null
    applied,           // last applied change (for a toast/banner)
    requestChange,
    confirm,
    cancel,
    clearApplied: () => setApplied(null),
  }
}
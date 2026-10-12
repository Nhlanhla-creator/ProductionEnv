"use client"

import { useCallback, useState } from "react"
import { downloadSubmission } from "../services/apiClient"

/**
 * Download state machine for a submitted package — Brief §7, p.57–58.
 *
 * States: idle → preparing → ready → downloading → complete
 *                                      ↘ error (retryable)
 *
 * "Handle failed generation with a retryable error and no false
 *  'download ready' state." (Brief §58)
 */

export default function useSubmissionDownload() {
  const [state, setState] = useState("idle")   // idle | preparing | downloading | complete | error
  const [error, setError] = useState(null)
  const [lastFormat, setLastFormat] = useState(null)

  const triggerBrowserDownload = (blob, filename) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  const fetchArtifact = useCallback(async (submissionId, format, version, filename) => {
    setError(null)
    setLastFormat(format)
    setState("preparing")
    try {
      setState("downloading")
      const blob = await downloadSubmission(submissionId, format, version)
      if (!blob) {
        // Fixture mode
        setState("complete")
        return { ok: true, fixture: true }
      }
      triggerBrowserDownload(blob, filename)
      setState("complete")
      return { ok: true }
    } catch (err) {
      setError(err.message || "Download failed")
      setState("error")
      return { ok: false, error: err.message }
    }
  }, [])

  const downloadPdf = useCallback((submissionId, { version, filename } = {}) => {
    const name = filename || `${submissionId}${version ? `-v${version}` : ""}.pdf`
    return fetchArtifact(submissionId, "pdf", version, name)
  }, [fetchArtifact])

  const downloadZip = useCallback((submissionId, { version, filename } = {}) => {
    const name = filename || `${submissionId}${version ? `-v${version}` : ""}-evidence.zip`
    return fetchArtifact(submissionId, "zip", version, name)
  }, [fetchArtifact])

  const reset = useCallback(() => {
    setState("idle")
    setError(null)
  }, [])

  return {
    state, error, lastFormat,
    isPreparing: state === "preparing",
    isDownloading: state === "downloading",
    isComplete: state === "complete",
    isError: state === "error",
    downloadPdf, downloadZip, reset,
  }
}
"use client"

/* ════════════════════════════════════════════════════════════════════════════
   matchTableKit.jsx

   One implementation of the table chrome every match category shares:
   saved views, column drag/resize/pin, per-column header filters, sorting,
   density, responsive collapse, the toolbar and the Customize Table menu.

   Every table in the marketplace should import from here rather than keeping
   its own copy — that duplication is why the six tables drifted apart.

   A table supplies four things and gets the rest:
     COLUMN_DEFS   { key: { label, width, filterType, visible, priority, sortable, align } }
     EMPTY_FILTERS the shape of its filter state
     renderCell    (key, row) => <td>
     row actions   via <RowActionCell>

   Design tokens — do not introduce new ones:
     header #4a352f · header text #faf7f2 · toolbar #faf7f2 · border #e6d7c3
     border2 #c8b6a6 · chip #f5f0e1 · chip active #7d5a50 · accent #a67c52
     muted #a89482 · body text #4a352f
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  SlidersHorizontal,
  GripVertical,
  ChevronDown,
  RotateCcw,
  Settings,
  Trash2,
  Plus,
  LayoutGrid,
  CheckCircle,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Pin,
  PinOff,
  Bookmark,
  MoreVertical,
} from "lucide-react"

export const BUILTIN_VIEW_ID = "__default__"
export const MIN_COLUMN_WIDTH = 84

/* ─── Primitives ────────────────────────────────────────────────────────── */

export const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

export const TruncatedText = ({ text, maxLength = 30 }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || text === "-" || text === "Not specified" || text === "Various") {
    return <span style={{ color: "#a89482", fontSize: "0.75rem" }}>{text || "-"}</span>
  }

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`

  return (
    <div style={{ lineHeight: "1.3", fontSize: "0.75rem" }}>
      <span style={{ wordBreak: "break-word" }}>{displayText}</span>
      {shouldTruncate && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          style={{
            background: "none",
            border: "none",
            color: "#a67c52",
            cursor: "pointer",
            fontSize: "0.7rem",
            marginLeft: "4px",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </div>
  )
}

export const formatLabel = (value) => {
  if (!value) return ""
  if (Array.isArray(value)) return value.map(formatLabel).filter(Boolean).join(", ")

  const stringValue = value.toString().trim()
  if (!stringValue) return ""

  const specialCases = {
    ict: "ICT",
    it: "IT",
    hr: "HR",
    esg: "ESG",
    southafrica: "South Africa",
    south_africa: "South Africa",
    usa: "USA",
    uk: "UK",
    uae: "UAE",
  }
  const lower = stringValue.toLowerCase()
  if (specialCases[lower]) return specialCases[lower]

  return stringValue
    .split(",")
    .map((part) =>
      part
        .trim()
        .split(/[_\s-]+/)
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ""))
        .join(" "),
    )
    .filter(Boolean)
    .join(", ")
}

export const toISODateOnly = (value) => {
  if (!value) return ""
  const d = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

export const formatDateValue = (value) => {
  if (!value || value === "-" || value === "unspecified") return null
  const d = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(d.getTime())) return value.toString()
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

const generateViewId = () => {
  try {
    return `view_${crypto.randomUUID()}`
  } catch {
    return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
}

const safeGet = (key) => {
  if (typeof window === "undefined") return null
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null")
  } catch {
    return null
  }
}

const safeSet = (key, value) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private browsing / quota — the table still works this session.
  }
}

/* ─── Layout hook: views, order, widths, pinning, density, responsive ───── */

export const useTableLayout = (storageKey, COLUMN_DEFS, options = {}) => {
  const { firstWidth = 214, lastWidth = 200 } = options

  const DEFAULTS = useMemo(() => {
    const order = Object.keys(COLUMN_DEFS)
    return {
      order,
      visibility: Object.fromEntries(order.map((k) => [k, COLUMN_DEFS[k].visible !== false])),
      widths: Object.fromEntries(order.map((k) => [k, COLUMN_DEFS[k].width])),
      pinned: Object.fromEntries(order.map((k) => [k, null])),
      density: "comfortable",
    }
  }, [COLUMN_DEFS])

  const sanitizeOrder = useCallback(
    (order) => {
      if (!Array.isArray(order)) return [...DEFAULTS.order]
      const known = new Set(DEFAULTS.order)
      const deduped = order.filter((k) => known.has(k))
      return [...deduped, ...DEFAULTS.order.filter((k) => !deduped.includes(k))]
    },
    [DEFAULTS],
  )

  const makeDefaultView = useCallback(
    () => ({
      id: BUILTIN_VIEW_ID,
      name: "Default",
      description: "",
      builtin: true,
      columnVisibility: { ...DEFAULTS.visibility },
      columnOrder: [...DEFAULTS.order],
      columnWidths: { ...DEFAULTS.widths },
      pinned: { ...DEFAULTS.pinned },
      density: DEFAULTS.density,
    }),
    [DEFAULTS],
  )

  const [viewsState, setViewsState] = useState(() => {
    const fresh = () => ({ activeViewId: BUILTIN_VIEW_ID, views: { [BUILTIN_VIEW_ID]: makeDefaultView() } })
    const saved = safeGet(storageKey)
    if (!saved?.views) return fresh()

    const views = {}
    Object.entries(saved.views).forEach(([id, v]) => {
      views[id] = {
        id: v?.id || id,
        name: (v?.name || "Untitled view").toString(),
        description: (v?.description || "").toString(),
        builtin: !!v?.builtin,
        columnVisibility: { ...DEFAULTS.visibility, ...(v?.columnVisibility || {}) },
        columnOrder: sanitizeOrder(v?.columnOrder),
        columnWidths: { ...DEFAULTS.widths, ...(v?.columnWidths || {}) },
        pinned: { ...DEFAULTS.pinned, ...(v?.pinned || {}) },
        density: v?.density || DEFAULTS.density,
      }
    })
    views[BUILTIN_VIEW_ID] = views[BUILTIN_VIEW_ID]
      ? { ...views[BUILTIN_VIEW_ID], id: BUILTIN_VIEW_ID, name: "Default", builtin: true }
      : makeDefaultView()

    const activeViewId = saved.activeViewId && views[saved.activeViewId] ? saved.activeViewId : BUILTIN_VIEW_ID
    return { activeViewId, views }
  })

  const initial = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]
  const [columnVisibility, setColumnVisibility] = useState(initial.columnVisibility)
  const [columnOrder, setColumnOrder] = useState(initial.columnOrder)
  const [columnWidths, setColumnWidths] = useState(initial.columnWidths)
  const [pinned, setPinned] = useState(initial.pinned)
  const [density, setDensity] = useState(initial.density)

  const [draggedColumn, setDraggedColumn] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [dragHintRect, setDragHintRect] = useState(null)
  const resizingRef = useRef(null)

  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1440 : window.innerWidth)
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    setViewsState((prev) => {
      const current = prev.views[prev.activeViewId]
      if (!current) return prev
      const next = {
        ...prev,
        views: {
          ...prev.views,
          [prev.activeViewId]: { ...current, columnVisibility, columnOrder, columnWidths, pinned, density },
        },
      }
      safeSet(storageKey, next)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, columnOrder, columnWidths, pinned, density])

  const activeView = viewsState.views[viewsState.activeViewId] || viewsState.views[BUILTIN_VIEW_ID]

  const applyView = (view) => {
    setColumnVisibility(view.columnVisibility)
    setColumnOrder(view.columnOrder)
    setColumnWidths(view.columnWidths)
    setPinned(view.pinned)
    setDensity(view.density)
  }

  const switchToView = (viewId) => {
    const target = viewsState.views[viewId]
    if (!target) return
    setViewsState((prev) => {
      const next = { ...prev, activeViewId: viewId }
      safeSet(storageKey, next)
      return next
    })
    applyView(target)
  }

  const createView = (name, description) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = generateViewId()
    setViewsState((prev) => {
      const next = {
        activeViewId: id,
        views: {
          ...prev.views,
          [id]: {
            id,
            name: trimmed,
            description: (description || "").trim(),
            builtin: false,
            columnVisibility: { ...columnVisibility },
            columnOrder: [...columnOrder],
            columnWidths: { ...columnWidths },
            pinned: { ...pinned },
            density,
          },
        },
      }
      safeSet(storageKey, next)
      return next
    })
  }

  const updateViewMeta = (id, name, description) => {
    setViewsState((prev) => {
      const existing = prev.views[id]
      if (!existing) return prev
      const next = {
        ...prev,
        views: {
          ...prev.views,
          [id]: {
            ...existing,
            name: existing.builtin ? existing.name : name.trim() || existing.name,
            description: (description || "").trim(),
          },
        },
      }
      safeSet(storageKey, next)
      return next
    })
  }

  const removeView = (viewId) => {
    if (viewId === BUILTIN_VIEW_ID) return
    const wasActive = viewsState.activeViewId === viewId
    setViewsState((prev) => {
      const { [viewId]: _gone, ...rest } = prev.views
      const next = { activeViewId: wasActive ? BUILTIN_VIEW_ID : prev.activeViewId, views: rest }
      safeSet(storageKey, next)
      return next
    })
    if (wasActive) applyView(viewsState.views[BUILTIN_VIEW_ID])
  }

  const resetToDefault = () => applyView(makeDefaultView())

  const toggleColumn = (key) => setColumnVisibility((p) => ({ ...p, [key]: !p[key] }))
  const cyclePin = (key) =>
    setPinned((p) => ({ ...p, [key]: p[key] === "left" ? "right" : p[key] === "right" ? null : "left" }))

  const onDragStart = (e, key) => {
    setDraggedColumn(key)
    setDragHintRect(null)
    try {
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", key)
    } catch {}
  }
  const onDragOver = (e, key) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (key !== dragOverColumn) setDragOverColumn(key)
  }
  const onDrop = (e, key) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === key) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }
    setColumnOrder((prev) => {
      const next = [...prev]
      const from = next.indexOf(draggedColumn)
      const to = next.indexOf(key)
      if (from === -1 || to === -1) return prev
      next.splice(from, 1)
      next.splice(to, 0, draggedColumn)
      return next
    })
    setDraggedColumn(null)
    setDragOverColumn(null)
  }
  const onDragEnd = () => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const startResize = (e, key) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = columnWidths[key] ?? COLUMN_DEFS[key].width
    resizingRef.current = key

    const move = (ev) =>
      setColumnWidths((p) => ({ ...p, [key]: Math.max(MIN_COLUMN_WIDTH, startWidth + (ev.clientX - startX)) }))
    const up = () => {
      resizingRef.current = null
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
  }

  const maxPriority = viewportWidth < 640 ? 1 : viewportWidth < 1024 ? 3 : 99

  const visibleKeys = useMemo(
    () => columnOrder.filter((k) => columnVisibility[k] && COLUMN_DEFS[k].priority <= maxPriority),
    [columnOrder, columnVisibility, maxPriority, COLUMN_DEFS],
  )

  const collapsedCount = useMemo(
    () => columnOrder.filter((k) => columnVisibility[k] && COLUMN_DEFS[k].priority > maxPriority).length,
    [columnOrder, columnVisibility, maxPriority, COLUMN_DEFS],
  )

  const orderedColumns = useMemo(() => {
    const left = visibleKeys.filter((k) => pinned[k] === "left")
    const right = visibleKeys.filter((k) => pinned[k] === "right")
    return [...left, ...visibleKeys.filter((k) => !pinned[k]), ...right]
  }, [visibleKeys, pinned])

  const widthOf = useCallback((key) => columnWidths[key] ?? COLUMN_DEFS[key].width, [columnWidths, COLUMN_DEFS])

  const stickyOffsets = useMemo(() => {
    const offsets = {}
    let leftAcc = firstWidth
    orderedColumns.forEach((k) => {
      if (pinned[k] === "left") {
        offsets[k] = { side: "left", value: leftAcc }
        leftAcc += widthOf(k)
      }
    })
    let rightAcc = lastWidth
    ;[...orderedColumns].reverse().forEach((k) => {
      if (pinned[k] === "right") {
        offsets[k] = { side: "right", value: rightAcc }
        rightAcc += widthOf(k)
      }
    })
    return offsets
  }, [orderedColumns, pinned, widthOf, firstWidth, lastWidth])

  const totalWidth = firstWidth + lastWidth + orderedColumns.reduce((s, k) => s + widthOf(k), 0)
  const cellPad = density === "compact" ? "0.4rem 0.3rem" : density === "ultra" ? "0.3rem 0.25rem" : "0.6rem 0.4rem"

  return {
    COLUMN_DEFS,
    viewsState,
    activeView,
    columnVisibility,
    columnOrder,
    columnWidths,
    pinned,
    density,
    setDensity,
    switchToView,
    createView,
    updateViewMeta,
    removeView,
    resetToDefault,
    toggleColumn,
    cyclePin,
    draggedColumn,
    dragOverColumn,
    dragHintRect,
    setDragHintRect,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    startResize,
    orderedColumns,
    collapsedCount,
    stickyOffsets,
    widthOf,
    totalWidth,
    cellPad,
    firstWidth,
    lastWidth,
  }
}

/* ─── Filter hook: state + persistence + sorting ────────────────────────── */

export const useTableFilters = (storageKey, EMPTY_FILTERS) => {
  const initial = useMemo(() => {
    const saved = safeGet(storageKey)
    return {
      filters: { ...EMPTY_FILTERS, ...(saved?.filters || {}) },
      sort: saved?.sort?.key ? saved.sort : null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const [filters, setFilters] = useState(initial.filters)
  const [sort, setSort] = useState(initial.sort)
  const [openFilter, setOpenFilter] = useState(null)

  useEffect(() => {
    safeSet(storageKey, { filters, sort })
  }, [storageKey, filters, sort])

  const clearAll = () => {
    setFilters({ ...EMPTY_FILTERS })
    setSort(null)
  }

  const toggleChip = (field, value) =>
    setFilters((p) => ({
      ...p,
      [field]: p[field].includes(value) ? p[field].filter((x) => x !== value) : [...p[field], value],
    }))

  const toggleSort = (key, e) => {
    e?.stopPropagation()
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" }
      if (prev.dir === "asc") return { key, dir: "desc" }
      return null
    })
  }

  const openHeaderFilter = (type, e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setOpenFilter((prev) => (prev?.type === type ? null : { type, rect }))
  }

  return {
    filters,
    setFilters,
    sort,
    setSort,
    clearAll,
    toggleChip,
    toggleSort,
    openFilter,
    setOpenFilter,
    openHeaderFilter,
  }
}

/* Generic comparator applied after a table's own filter pass. */
export const applySort = (rows, sort, accessors) => {
  if (!sort?.key) return rows
  const accessor = accessors[sort.key]
  if (!accessor) return rows
  return [...rows].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (typeof av === "number" && typeof bv === "number") return sort.dir === "asc" ? av - bv : bv - av
    const cmp = (av || "").toString().localeCompare((bv || "").toString())
    return sort.dir === "asc" ? cmp : -cmp
  })
}

/* ─── Header controls ───────────────────────────────────────────────────── */

export const FilterTrigger = ({ type, active, onOpen }) => (
  <button
    type="button"
    onClick={(e) => onOpen(type, e)}
    className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
      active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"
    }`}
    title="Filter this column"
  >
    <SlidersHorizontal size={11} />
  </button>
)

export const SortTrigger = ({ columnKey, sort, onToggle }) => {
  const active = sort?.key === columnKey
  return (
    <button
      type="button"
      onClick={(e) => onToggle(columnKey, e)}
      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
        active ? "text-[#e6d7c3]" : "text-[#c8b6a6] hover:text-white"
      }`}
      title={active ? (sort.dir === "asc" ? "Sort descending" : "Clear sort") : "Sort ascending"}
    >
      {active ? sort.dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : <ArrowUpDown size={11} />}
    </button>
  )
}

/* ─── Customize Table menu ──────────────────────────────────────────────── */

export const CustomizeTableMenu = ({ layout, firstColumnLabel }) => {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState("")

  const close = () => {
    setOpen(false)
    setRect(null)
    setShowNewForm(false)
    setEditing(null)
  }

  const allKeys = Object.keys(layout.COLUMN_DEFS)
  const matched = allKeys.filter((k) => layout.COLUMN_DEFS[k].label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative">
      <button
        onClick={(e) => (open ? close() : (setRect(e.currentTarget.getBoundingClientRect()), setOpen(true)))}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c8b6a6] rounded-xl text-sm text-[#4a352f] hover:bg-[#f5f0e1] transition-all shadow-sm"
      >
        <SlidersHorizontal size={16} /> Customize Table{" "}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        rect &&
        (() => {
          const panelWidth = 340
          const margin = 12
          const left = Math.min(Math.max(rect.right - panelWidth, margin), window.innerWidth - panelWidth - margin)
          const spaceBelow = window.innerHeight - rect.bottom - margin - 8
          const spaceAbove = rect.top - margin - 8
          const upward = spaceBelow < 320 && spaceAbove > spaceBelow
          const maxHeight = Math.max(200, Math.min(640, upward ? spaceAbove : spaceBelow))
          const views = Object.values(layout.viewsState.views).sort((a, b) =>
            a.builtin ? -1 : b.builtin ? 1 : a.name.localeCompare(b.name),
          )

          return (
            <PopupPortal>
              <div className="fixed inset-0 z-40" onClick={close} />
              <div
                className="fixed bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-5 z-50 overflow-y-auto"
                style={{
                  left,
                  width: panelWidth,
                  top: upward ? undefined : rect.bottom + 8,
                  bottom: upward ? window.innerHeight - rect.top + 8 : undefined,
                  maxHeight,
                }}
              >
                <h4 className="text-sm font-semibold text-[#4a352f] mb-1">Views</h4>
                <p className="text-xs text-[#a89482] mb-3">Edits below auto-save into whichever view is selected.</p>

                <div className="space-y-1 mb-3">
                  {views.map((view) => {
                    const isActive = view.id === layout.viewsState.activeViewId
                    if (editing?.id === view.id) {
                      return (
                        <div key={view.id} className="p-2.5 rounded-lg border border-[#c8b6a6] bg-[#faf7f2] space-y-2">
                          {!view.builtin ? (
                            <input
                              autoFocus
                              value={editing.name}
                              onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                              placeholder="View name"
                              className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-[#4a352f]">
                              Default <span className="font-normal text-[#a89482] text-xs">(name can't be changed)</span>
                            </p>
                          )}
                          <textarea
                            value={editing.description}
                            onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Description (optional) — what is this view for?"
                            rows={2}
                            className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditing(null)} className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]">
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                layout.updateViewMeta(editing.id, editing.name, editing.description)
                                setEditing(null)
                              }}
                              className="px-2.5 py-1 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div
                        key={view.id}
                        className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg ${isActive ? "bg-[#f5f0e1]" : "hover:bg-[#faf7f2]"}`}
                      >
                        <button onClick={() => layout.switchToView(view.id)} className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isActive && <CheckCircle size={12} className="text-[#7d5a50] flex-shrink-0" />}
                            <span className={`text-sm ${isActive ? "font-semibold text-[#4a352f]" : "text-[#4a352f]"}`}>{view.name}</span>
                            {view.builtin && (
                              <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Built-in</span>
                            )}
                          </div>
                          {view.description && <p className="text-xs text-[#a89482] mt-0.5 truncate">{view.description}</p>}
                        </button>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => setEditing({ id: view.id, name: view.name, description: view.description })}
                            title="Rename / edit description"
                            className="text-[#a89482] hover:text-[#7d5a50] p-1"
                          >
                            <Settings size={13} />
                          </button>
                          {!view.builtin && (
                            <button onClick={() => layout.removeView(view.id)} title="Delete view" className="text-[#a89482] hover:text-red-500 p-1">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {showNewForm ? (
                  <div className="space-y-2 mb-1">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="New view name..."
                      className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-sm"
                    />
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Description (optional) — what is this view for?"
                      rows={2}
                      className="w-full px-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowNewForm(false)
                          setNewName("")
                          setNewDescription("")
                        }}
                        className="px-2.5 py-1 text-xs text-[#7d5a50] hover:text-[#4a352f]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          layout.createView(newName, newDescription)
                          setNewName("")
                          setNewDescription("")
                          setShowNewForm(false)
                        }}
                        disabled={!newName.trim()}
                        className="px-3 py-1.5 bg-[#7d5a50] text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                      >
                        Create view
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewForm(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#c8b6a6] rounded-lg text-xs font-semibold text-[#7d5a50] hover:bg-[#faf7f2]"
                  >
                    <Plus size={13} /> New view from current layout
                  </button>
                )}

                <div className="border-t border-[#e6d7c3] my-4" />
                <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Columns</h4>

                <div className="relative mb-3">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a89482] pointer-events-none" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search columns..."
                    className="w-full pl-7 pr-2.5 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
                  />
                </div>

                <p className="text-xs text-[#a89482] mb-3 flex items-center gap-1.5">
                  <GripVertical size={12} className="flex-shrink-0" /> Drag a header to reorder, drag its right edge to resize.
                </p>

                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg opacity-75">
                  <input type="checkbox" checked disabled className="rounded border-[#c8b6a6]" />
                  <span className="text-sm text-[#4a352f] flex-1">{firstColumnLabel}</span>
                  <span className="text-[10px] uppercase tracking-wide text-[#a89482] font-semibold">Pinned</span>
                </div>
                <div className="border-t border-[#e6d7c3] my-2" />

                {matched.length === 0 && <p className="text-xs text-[#a89482] px-2 py-1.5">No columns match that search.</p>}
                {matched.map((key) => (
                  <div key={key} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#faf7f2]">
                    <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={layout.columnVisibility[key] || false}
                        onChange={() => layout.toggleColumn(key)}
                        className="rounded border-[#c8b6a6] text-[#7d5a50]"
                      />
                      <span className="text-sm text-[#4a352f] truncate">{layout.COLUMN_DEFS[key].label}</span>
                    </label>
                    <button
                      onClick={() => layout.cyclePin(key)}
                      title={
                        layout.pinned[key] === "left"
                          ? "Pinned left — click to pin right"
                          : layout.pinned[key] === "right"
                            ? "Pinned right — click to unpin"
                            : "Pin left"
                      }
                      className={`p-1 rounded flex-shrink-0 ${layout.pinned[key] ? "text-[#7d5a50]" : "text-[#c8b6a6] hover:text-[#7d5a50]"}`}
                    >
                      {layout.pinned[key] ? <Pin size={13} /> : <PinOff size={13} />}
                    </button>
                    <span className="text-[10px] text-[#a89482] w-7 text-right flex-shrink-0">
                      {layout.pinned[key] === "left" ? "L" : layout.pinned[key] === "right" ? "R" : ""}
                    </span>
                  </div>
                ))}

                <div className="border-t border-[#e6d7c3] my-4" />
                <h4 className="text-sm font-semibold text-[#4a352f] mb-3">Density</h4>
                <div className="flex gap-1.5">
                  {[
                    { key: "comfortable", label: "Comfortable" },
                    { key: "compact", label: "Compact" },
                    { key: "ultra", label: "Ultra" },
                  ].map((d) => (
                    <button
                      key={d.key}
                      onClick={() => layout.setDensity(d.key)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        layout.density === d.key ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#e6d7c3] my-4" />
                <button
                  onClick={layout.resetToDefault}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-[#faf7f2] border border-[#e6d7c3]"
                >
                  <RotateCcw size={12} /> Reset "{layout.activeView.name}" to factory defaults
                </button>
              </div>
            </PopupPortal>
          )
        })()}
    </div>
  )
}

/* ─── Toolbar ───────────────────────────────────────────────────────────── */

export const TableToolbar = ({ title, layout, activeFilterCount, onClearFilters, firstColumnLabel, extra }) => (
  <div className="bg-[#faf7f2] rounded-t-2xl p-4 border border-[#e6d7c3] border-b-0 shadow-sm">
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        {title && <h2 className="text-lg font-bold text-[#4a352f] m-0">{title}</h2>}
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6]">
          <LayoutGrid size={12} className="text-[#7d5a50] flex-shrink-0" />
          Viewing: {layout.activeView.name}
          {layout.activeView.description && <span className="font-normal text-[#a89482]"> — {layout.activeView.description}</span>}
        </span>
        {activeFilterCount > 0 && (
          <>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff3e0] text-[#e65100] border border-[#e65100]/30">
              <SlidersHorizontal size={12} /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
            </span>
            <button
              onClick={onClearFilters}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#a67c52] hover:text-[#4a352f] hover:bg-white border border-[#e6d7c3] transition-colors"
            >
              Clear all filters
            </button>
          </>
        )}
        {layout.collapsedCount > 0 && (
          <span className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#a89482] border border-[#e6d7c3]">
            {layout.collapsedCount} column{layout.collapsedCount > 1 ? "s" : ""} hidden on this screen size
          </span>
        )}
        {extra}
      </div>
      <CustomizeTableMenu layout={layout} firstColumnLabel={firstColumnLabel} />
    </div>
  </div>
)

/* ─── Table head ────────────────────────────────────────────────────────── */

export const TABLE_HEAD_STYLES = `
  .mt-th { color: #faf7f2 !important; vertical-align: top !important; position: relative; }
  .mt-th-draggable { cursor: grab; }
  .mt-th-draggable:active { cursor: grabbing; }
  .mt-th-label { flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; overflow-wrap: break-word; line-height: 1.2; }
  .mt-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; }
  .mt-resize:hover { background: rgba(255,255,255,0.25); }
`

export const TableHead = ({ layout, filterApi, firstColumn, lastColumnLabel = "Action", getFilterActive }) => (
  <thead>
    <tr className="bg-[#4a352f]">
      <th
        className="mt-th py-3 px-3 text-left font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 left-0 z-30"
        style={{ backgroundColor: "#4a352f", width: layout.firstWidth }}
      >
        <div className="flex items-start gap-1 min-w-0">
          <span className="mt-th-label">{firstColumn.label}</span>
          {firstColumn.sortKey && <SortTrigger columnKey={firstColumn.sortKey} sort={filterApi.sort} onToggle={filterApi.toggleSort} />}
          {firstColumn.filterType && (
            <FilterTrigger type={firstColumn.filterType} active={getFilterActive(firstColumn.filterType)} onOpen={filterApi.openHeaderFilter} />
          )}
        </div>
      </th>

      {layout.orderedColumns.map((key) => {
        const col = layout.COLUMN_DEFS[key]
        const offset = layout.stickyOffsets[key]
        const isDragging = layout.draggedColumn === key
        const isDragOver = layout.dragOverColumn === key && layout.draggedColumn !== key
        return (
          <th
            key={key}
            draggable
            onDragStart={(e) => layout.onDragStart(e, key)}
            onDragOver={(e) => layout.onDragOver(e, key)}
            onDrop={(e) => layout.onDrop(e, key)}
            onDragEnd={layout.onDragEnd}
            onMouseEnter={(e) => layout.setDragHintRect(e.currentTarget.getBoundingClientRect())}
            onMouseLeave={() => layout.setDragHintRect(null)}
            className={`mt-th mt-th-draggable py-3 px-3 font-semibold uppercase tracking-wider text-xs border-r border-[#e6d7c3] sticky top-0 select-none transition-opacity ${
              col.align === "center" ? "text-center" : "text-left"
            } ${isDragging ? "opacity-40" : ""}`}
            style={{
              width: layout.widthOf(key),
              backgroundColor: isDragOver ? "#5a423b" : "#4a352f",
              zIndex: offset ? 25 : 20,
              ...(offset ? { [offset.side]: `${offset.value}px` } : {}),
            }}
          >
            <div className={`flex items-start gap-1 min-w-0 ${col.align === "center" ? "justify-center" : ""}`}>
              <GripVertical size={11} className="opacity-40 flex-shrink-0 mt-0.5" />
              <span className="mt-th-label">{col.label}</span>
              {layout.pinned[key] && <Pin size={10} className="opacity-60 flex-shrink-0 mt-0.5" />}
              {col.sortable && <SortTrigger columnKey={key} sort={filterApi.sort} onToggle={filterApi.toggleSort} />}
              {col.filterType && (
                <FilterTrigger type={col.filterType} active={getFilterActive(col.filterType)} onOpen={filterApi.openHeaderFilter} />
              )}
            </div>
            <div className="mt-resize" onMouseDown={(e) => layout.startResize(e, key)} onClick={(e) => e.stopPropagation()} />
          </th>
        )
      })}

      <th
        className="mt-th py-3 px-3 text-center font-semibold uppercase tracking-wider text-xs sticky top-0 right-0 z-30 border-l border-[#e6d7c3]"
        style={{ backgroundColor: "#4a352f", width: layout.lastWidth }}
      >
        {lastColumnLabel}
      </th>
    </tr>
  </thead>
)

export const DragHint = ({ layout }) =>
  layout.dragHintRect && !layout.draggedColumn ? (
    <PopupPortal>
      <div
        className="fixed z-[1200] bg-[#4a352f] text-[#faf7f2] text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none normal-case font-normal flex items-center gap-1.5"
        style={{
          top: layout.dragHintRect.bottom + 8,
          left: Math.min(Math.max(layout.dragHintRect.left, 12), window.innerWidth - 210),
          width: "200px",
        }}
      >
        <GripVertical size={12} className="flex-shrink-0" /> Drag to reorder · edge to resize
      </div>
    </PopupPortal>
  ) : null

/* ─── Filter popover + bodies ───────────────────────────────────────────── */

export const FilterPopover = ({ openFilter, onClose, children }) => {
  if (!openFilter) return null
  return (
    <PopupPortal>
      <div className="fixed inset-0 z-[1090]" onClick={onClose} />
      <div
        className="fixed z-[1091] bg-white rounded-2xl shadow-2xl border border-[#e6d7c3] p-4"
        style={{
          top: openFilter.rect.bottom + 8,
          left: Math.min(Math.max(openFilter.rect.left - 20, 12), window.innerWidth - 312),
          width: "300px",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </PopupPortal>
  )
}

const FilterHeader = ({ label, showClear, onClear }) => (
  <div className="flex items-center justify-between mb-2">
    <label className="text-xs font-semibold text-[#4a352f]">{label}</label>
    {showClear && (
      <button onClick={onClear} className="text-xs text-[#a67c52] hover:text-[#4a352f] font-medium">
        Clear
      </button>
    )}
  </div>
)

export const TextFilterBody = ({ label, value, onChange, placeholder }) => (
  <>
    <FilterHeader label={label} showClear={!!value} onClear={() => onChange("")} />
    <input
      autoFocus
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-[#c8b6a6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7d5a50]/20"
    />
  </>
)

export const ChipFilterBody = ({ label, options, selected, onToggle, onClear, emptyText = "No data available" }) => (
  <>
    <FilterHeader label={label} showClear={selected.length > 0} onClear={onClear} />
    <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
      {options.length === 0 && <span className="text-xs text-[#a89482]">{emptyText}</span>}
      {options.map((value) => (
        <button
          key={value}
          onClick={() => onToggle(value)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            selected.includes(value) ? "bg-[#7d5a50] text-white" : "bg-[#f5f0e1] text-[#4a352f] hover:bg-[#e6d7c3]"
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  </>
)

export const RangeFilterBody = ({ label, range, min = 0, max = 100, step = 1, onChange }) => (
  <>
    <FilterHeader
      label={`${label}: ${range[0]} - ${range[1]}`}
      showClear={range[0] > min || range[1] < max}
      onClear={() => onChange([min, max])}
    />
    <div className="flex items-center gap-3 mb-3">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={range[0]}
        onChange={(e) => onChange([Math.min(Number(e.target.value) || min, range[1]), range[1]])}
        className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center"
      />
      <span className="text-[#7d5a50]">to</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={range[1]}
        onChange={(e) => onChange([range[0], Math.max(Number(e.target.value) || min, range[0])])}
        className="w-16 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-sm text-center"
      />
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={range[0]}
      onChange={(e) => onChange([Number(e.target.value), range[1]])}
      className="w-full accent-[#7d5a50]"
    />
  </>
)

export const DateRangeFilterBody = ({ label, from, to, onChange, note }) => (
  <>
    <FilterHeader label={label} showClear={!!from || !!to} onClear={() => onChange("", "")} />
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
      />
      <span className="text-[#7d5a50] text-xs">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="flex-1 px-2 py-1.5 border border-[#c8b6a6] rounded-lg text-xs"
      />
    </div>
    {note && <p className="text-[10px] text-[#a89482] mt-2">{note}</p>}
  </>
)

/* ─── Row action cell ───────────────────────────────────────────────────────
   Spec section 3: one prominent primary action, one optional secondary,
   a Save icon, and a three-dot menu for everything else. Never more than
   two visible quick actions.
   ──────────────────────────────────────────────────────────────────────── */

export const RowActionCell = ({
  layout,
  rowId,
  hovered,
  primary,
  secondary,
  busy,
  saved,
  onSave,
  menuItems = [],
  onMenuSelect,
  openMenu,
  setOpenMenu,
}) => {
  const btn =
    "flex-1 min-w-0 px-2 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all"

  return (
    <td
      className="sticky right-0 z-10 border-l border-[#e6d7c3] align-top"
      style={{
        padding: layout.cellPad,
        borderBottom: "1px solid #e6d7c3",
        width: layout.lastWidth,
        backgroundColor: hovered ? "#fdf8f4" : "#ffffff",
      }}
    >
      <div className="flex items-center gap-1.5">
        {secondary && (
          <button
            onClick={secondary.onClick}
            className={`${btn} text-[#7d5a50] border border-[#c8b6a6] hover:bg-[#f5f0e1]`}
          >
            {secondary.label}
          </button>
        )}
        <button
          onClick={primary.onClick}
          disabled={busy}
          className={`${btn} text-white bg-[#7d5a50] hover:brightness-105 disabled:opacity-50`}
        >
          {busy ? "Working..." : primary.label}
        </button>

        {onSave && (
          <button
            onClick={onSave}
            title={saved ? "Remove from saved" : "Save match"}
            aria-label={saved ? "Remove from saved" : "Save match"}
            className={`p-1 flex-shrink-0 ${saved ? "text-[#a67c52]" : "text-[#c8b6a6] hover:text-[#7d5a50]"}`}
          >
            <Bookmark size={14} fill={saved ? "#a67c52" : "none"} />
          </button>
        )}

        {menuItems.length > 0 && (
          <button
            onClick={(e) =>
              setOpenMenu(openMenu?.id === rowId ? null : { id: rowId, rect: e.currentTarget.getBoundingClientRect() })
            }
            className="p-1 flex-shrink-0 text-[#a89482] hover:text-[#7d5a50]"
            aria-label="More actions"
          >
            <MoreVertical size={15} />
          </button>
        )}
      </div>
    </td>
  )
}

export const RowActionMenu = ({ openMenu, setOpenMenu, items, onSelect, destructive = [] }) => {
  if (!openMenu) return null
  return (
    <PopupPortal>
      <div className="fixed inset-0 z-[1090]" onClick={() => setOpenMenu(null)} />
      <div
        className="fixed z-[1100] bg-white rounded-xl shadow-2xl border border-[#e6d7c3] py-1.5"
        style={{
          top: openMenu.rect.bottom + 6,
          left: Math.min(Math.max(openMenu.rect.left - 150, 12), window.innerWidth - 200),
          width: "190px",
        }}
      >
        {items.map((label) => (
          <button
            key={label}
            onClick={() => {
              const id = openMenu.id
              setOpenMenu(null)
              onSelect(label, id)
            }}
            className={`w-full text-left px-3.5 py-2 text-xs hover:bg-[#faf7f2] ${
              destructive.includes(label) ? "text-[#D32F2F]" : "text-[#4a352f]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </PopupPortal>
  )
}

/* ─── Table shell ───────────────────────────────────────────────────────── */

export const TableShell = ({ layout, children }) => (
  <div className="bg-white rounded-2xl border border-[#e6d7c3] shadow-lg overflow-hidden">
    <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
      <style>{TABLE_HEAD_STYLES}</style>
      <table
        className="border-collapse text-sm"
        style={{ tableLayout: "fixed", width: layout.totalWidth, minWidth: "100%", backgroundColor: "#faf7f2" }}
      >
        {children}
      </table>
    </div>
  </div>
)

export const EmptyRow = ({ colSpan, title, subtitle, action }) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-16" style={{ borderBottom: "1px solid #e6d7c3" }}>
      <p className="text-sm font-semibold text-[#4a352f] m-0">{title}</p>
      {subtitle && <p className="text-xs text-[#a89482] mt-1">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </td>
  </tr>
)

/* Cell style helper — applies density padding and sticky offset in one place. */
export const cellStyle = (layout, key, hovered) => {
  const offset = layout.stickyOffsets[key]
  return {
    padding: layout.cellPad,
    borderBottom: "1px solid #e6d7c3",
    borderRight: "1px solid #e6d7c3",
    fontSize: "0.8rem",
    verticalAlign: "top",
    color: "#4a352f",
    lineHeight: "1.3",
    overflow: "hidden",
    ...(offset
      ? {
          position: "sticky",
          [offset.side]: `${offset.value}px`,
          zIndex: 9,
          backgroundColor: hovered ? "#fdf8f4" : "#ffffff",
          boxShadow: offset.side === "left" ? "2px 0 0 #e6d7c3" : "-2px 0 0 #e6d7c3",
        }
      : {}),
  }
}
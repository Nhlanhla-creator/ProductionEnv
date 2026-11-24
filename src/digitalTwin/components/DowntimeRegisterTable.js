import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, Columns3, Download, Eye,
  GripVertical, History, Pencil, SlidersHorizontal, Timer, BookOpen } from "lucide-react"
import { downloadCsv } from "../models/downloadCsv"

const DEFAULTS = [
  ["assetNumber", "Asset ID", 160], ["assetName", "Equipment", 210], ["groupName", "Equipment group", 180],
  ["eventDate", "Date", 140], ["reason", "Downtime reason", 240], ["eventStart", "Start time", 200],
  ["eventEnd", "End time", 200], ["periodDurationHours", "Hours", 115], ["siteName", "Operating site", 180],
  ["shiftName", "Shift", 150], ["crew", "Crew", 150], ["planned", "Downtime type", 150], ["eventStatus", "Status", 135],
]
const OPTIONAL = [
  ["level1", "Level 1 — Downtime type"], ["level2", "Level 2 — Delay category"], ["level3", "Level 3 — Classification"],
  ["level4", "Level 4 — Subcategory"], ["level5", "Level 5 — Specific reason"], ["notes", "Notes", 300],
  ["masterName", "Master-code list", 240], ["masterVersion", "Code version"], ["contractId", "Contract"],
  ["activityId", "Activity"], ["serviceId", "Support Service"],
]
const columns = Object.fromEntries([...DEFAULTS, ...OPTIONAL].map(([key, label, width = 164]) => [key, { label, width }]))
const defaultKeys = DEFAULTS.map(([key]) => key)
const knownKeys = Object.keys(columns)
const display = (value) => value == null || value === "" ? "—" : String(value)
const compare = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare

function getLayout(key) {
  const defaults = { order: knownKeys, visible: defaultKeys, widths: {} }
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || "null")
    if (!saved || !Array.isArray(saved.order) || !Array.isArray(saved.visible)) return defaults
    return {
      order: [...new Set([...saved.order.filter((id) => Object.hasOwn(columns, id)), ...knownKeys])],
      visible: [...new Set(["assetNumber", ...saved.visible.filter((id) => Object.hasOwn(columns, id))])],
      widths: Object.fromEntries(Object.entries(saved.widths || {}).filter(([id, width]) =>
        Object.hasOwn(columns, id) && Number.isFinite(width) && width >= 90 && width <= 740)),
    }
  } catch {
    return defaults
  }
}

function valueFor(row, key) {
  if (key === "assetNumber") return row.assetNumber || row.assetId
  if (key === "reason") return row.classificationPath?.slice(-1)[0]?.label || row.categoryLevel5 || row.categoryLevel2 || "Unclassified"
  if (key === "eventDate") return row.eventStart ? new Date(row.eventStart).toLocaleDateString() : ""
  if (key === "planned") return row.planned ? "Planned" : "Unplanned"
  if (key === "eventStatus") return row.eventEnd ? "Completed" : "Ongoing"
  if (key === "eventStart" || key === "eventEnd") return row[key] ? new Date(row[key]).toLocaleString() : "Ongoing"
  if (/^level[1-5]$/.test(key)) return row.classificationPath?.[Number(key.slice(-1)) - 1]?.label || row[`categoryLevel${key.slice(-1)}`]
  return row[key]
}

function moveColumn(order, from, to) {
  const index = order.indexOf(to)
  if (from === to || index < 0 || !order.includes(from)) return order
  const next = order.filter((id) => id !== from)
  next.splice(index, 0, from)
  return next
}

const IconButton = ({ label, icon: Icon, ...props }) => <button type="button" className="dt-register-icon"
  aria-label={label} title={label} {...props}><Icon size={15} aria-hidden="true" /></button>

export default function DowntimeRegisterTable({ tenantId, rows, loading, onOpenAsset, onCorrect, onCloseEvent, onAudit, onMasterCodes, onVisibleRowsChange }) {
  const storageKey = `digitalTwin.downtimeRegisterColumns:v1:${tenantId}`
  const [layout, setLayout] = useState(() => getLayout(storageKey))
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState(null)
  const [filter, setFilter] = useState(null)
  const [manage, setManage] = useState(false)
  const dragged = useRef(null)
  const filterRef = useRef(null)
  const keys = layout.order.filter((key) => layout.visible.includes(key))
  const filtered = useMemo(() => {
    const selected = rows.filter((row) => {
      const matches = [row.assetName, row.assetNumber, row.assetId, valueFor(row, "reason"), row.notes].join(" ").toLowerCase()
        .includes(search.toLowerCase().trim())
      return matches && Object.entries(filters).every(([key, value]) => display(valueFor(row, key)) === value)
    })
    if (sort) selected.sort((a, b) => {
      const left = (sort.key === "eventDate" ? a.eventStart : sort.key === "eventStart" || sort.key === "eventEnd" ? a[sort.key] : valueFor(a, sort.key)), right = (sort.key === "eventDate" ? b.eventStart : sort.key === "eventStart" || sort.key === "eventEnd" ? b[sort.key] : valueFor(b, sort.key))
      if (display(left) === "—" || display(right) === "—") {
        return Number(display(left) === "—") - Number(display(right) === "—")
      }
      const direction = sort.direction === "asc" ? 1 : -1
      return direction * (typeof left === "number" && typeof right === "number" ? left - right : compare(String(left), String(right)))
    })
    return selected
  }, [rows, search, filters, sort])

  useEffect(() => { onVisibleRowsChange?.(filtered) }, [filtered, onVisibleRowsChange])

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(layout)) } catch { /* Browser storage is optional. */ }
  }, [layout, storageKey])
  useEffect(() => {
    if (!filter) return
    const close = (event) => {
      if (!filterRef.current?.contains(event.target) && !filter.anchor.contains(event.target)) setFilter(null)
    }
    const escape = (event) => { if (event.key === "Escape") { setFilter(null); filter.anchor.focus() } }
    const reposition = (event) => { if (!(event.target instanceof Node) || !filterRef.current?.contains(event.target)) setFilter(null) }
    document.addEventListener("pointerdown", close)
    document.addEventListener("keydown", escape)
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    return () => {
      document.removeEventListener("pointerdown", close)
      document.removeEventListener("keydown", escape)
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
    }
  }, [filter])

  const reorder = (from, to) => setLayout((current) => ({ ...current, order: moveColumn(current.order, from, to) }))
  const visibleToggle = (key) => {
    setLayout((current) => ({ ...current, visible: current.visible.includes(key)
      ? current.visible.filter((column) => column !== key) : [...current.visible, key] }))
    setFilters((current) => Object.fromEntries(Object.entries(current).filter(([column]) => column !== key)))
    if (sort?.key === key) setSort(null)
    if (filter?.key === key) setFilter(null)
  }
  const sorted = (key) => setSort((current) => ({ key, direction: current?.key === key && current.direction === "asc" ? "desc" : "asc" }))
  const widthFor = (key) => layout.widths[key] || columns[key].width
  const resize = (key, width) => setLayout((current) => ({ ...current, widths: { ...current.widths, [key]: Math.max(90, Math.min(740, width)) } }))
  const beginResize = (event, key) => {
    if (event.button !== 0) return
    event.preventDefault()
    const startX = event.clientX
    const startWidth = widthFor(key)
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)
    handle.onpointermove = (move) => resize(key, startWidth + move.clientX - startX)
    handle.onlostpointercapture = () => { handle.onpointermove = null; handle.onlostpointercapture = null }
  }
  const openFilter = (event, key) => {
    const anchor = event.currentTarget
    const box = anchor.getBoundingClientRect()
    setFilter((current) => current?.key === key ? null : {
      key, anchor, left: Math.max(8, Math.min(box.left, window.innerWidth - 241)),
      top: box.bottom + 258 < window.innerHeight ? box.bottom + 4 : undefined,
      bottom: box.bottom + 258 >= window.innerHeight ? window.innerHeight - box.top + 4 : undefined,
    })
  }
  const chooseFilter = (value) => {
    setFilters((current) => {
      const next = { ...current }
      if (value == null) delete next[filter.key]
      else next[filter.key] = value
      return next
    })
    filter.anchor.focus()
    setFilter(null)
  }
  const exportRows = () => downloadCsv("downtime-register.csv", [keys.map((key) => columns[key].label),
    ...filtered.map((row) => keys.map((key) => valueFor(row, key)))])


  return <>
    <div className="dt-actions dt-register-filter-actions">
      <input type="search" className="dt-input dt-register-search" aria-label="Search downtime"
        placeholder="Search Asset ID, equipment or reason…" value={search} onChange={(event) => setSearch(event.target.value)} />
      <button type="button" className="dt-button dt-button-small" disabled={!search && !Object.keys(filters).length && !sort}
        onClick={() => { setSearch(""); setFilters({}); setSort(null); }}>Clear filters</button>
      <button type="button" className="dt-button dt-button-small" aria-expanded={manage} onClick={() => setManage(!manage)}>
        <Columns3 size={15} /> Columns
      </button>
      <button type="button" className="dt-button dt-button-small" disabled={!filtered.length} onClick={exportRows}>
        <Download size={15} /> Export CSV
      </button>
    </div>
    {manage && <section className="dt-register-columns" aria-label="Choose and reorder columns">
      <div className="dt-panel-head"><strong>Columns</strong>
        <button type="button" className="dt-button dt-button-small" onClick={() => {
          setLayout({ order: knownKeys, visible: defaultKeys, widths: {} }); setFilters({}); setSort(null); setFilter(null)
        }}>Reset columns</button>
      </div>
      <div className="dt-register-column-options">{layout.order.map((key) => {
        const index = keys.indexOf(key)
        return <div key={key} className="dt-actions">
          <label><input type="checkbox" checked={index >= 0} disabled={key === "assetNumber"} onChange={() => visibleToggle(key)} /> {columns[key].label}</label>
          {index >= 0 && <div className="dt-actions">
            <IconButton label={`Move ${columns[key].label} left`} icon={ArrowLeft} disabled={index === 0} onClick={() => reorder(key, keys[index - 1])} />
            <IconButton label={`Move ${columns[key].label} right`} icon={ArrowRight} disabled={index === keys.length - 1} onClick={() => reorder(key, keys[index + 1])} />
          </div>}
        </div>
      })}</div>
    </section>}
    <div className="dt-table-wrap">
      <table className="dt-table dt-register-table dt-register-custom" style={{ width: keys.reduce((total, key) => total + widthFor(key), 152) }}>
        <colgroup>{keys.map((key) => <col key={key} style={{ width: widthFor(key) }} />)}<col style={{ width: 152 }} /></colgroup>
        <thead><tr>{keys.map((key) => {
          const { label } = columns[key]
          const asc = sort?.key === key ? sort.direction === "asc" : null
          return <th key={key} scope="col" aria-sort={asc == null ? undefined : asc ? "ascending" : "descending"}
            onDragOver={(event) => { if (dragged.current) event.preventDefault() }}
            onDrop={(event) => { event.preventDefault(); if (dragged.current) reorder(dragged.current, key); dragged.current = null }}>
            <div className="dt-register-th"><span>{label}</span>
              <div className="dt-actions">
                <span draggable className="dt-register-drag" title={`Drag ${label} to reorder`}
                  onDragStart={(event) => { dragged.current = key; event.dataTransfer.setData("text/plain", key); event.dataTransfer.effectAllowed = "move" }}
                  onDragEnd={() => { dragged.current = null }}><GripVertical size={14} aria-hidden="true" /></span>
                <IconButton label={`Sort by ${label}`} icon={asc == null ? ArrowUpDown : asc ? ArrowUp : ArrowDown} onClick={() => sorted(key)} />
                <IconButton label={`Filter by ${label}`} icon={SlidersHorizontal} aria-expanded={filter?.key === key}
                  aria-pressed={Object.hasOwn(filters, key)} onClick={(event) => openFilter(event, key)} />
              </div>
            </div>
            <button type="button" className="dt-register-resize" title="Drag or use the arrow keys to resize"
              aria-label={`Resize ${label}`} onPointerDown={(event) => beginResize(event, key)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return
                event.preventDefault()
                resize(key, widthFor(key) + (event.key === "ArrowLeft" ? -12 : 12))
              }} />
          </th>
        })}<th scope="col"><div className="dt-register-th">Actions</div></th></tr></thead>
        <tbody>{filtered.map((row) => <tr key={row.eventId || row.id}>
          {keys.map((key) => <td key={key} title={display(valueFor(row, key))}>
            {key === "assetNumber" ? <button type="button" className="dt-button dt-button-text" onClick={() => onOpenAsset?.(row.assetId)}>{display(valueFor(row, key))}</button>
              : key === "periodDurationHours" ? Number(row.periodDurationHours || 0).toFixed(2)
              : key === "eventStatus" ? <span className={`dt-badge ${row.eventEnd ? "dt-badge-green" : "dt-badge-amber"}`}>{valueFor(row, key)}</span>
              : display(valueFor(row, key))}
          </td>)}
          <td><div className="dt-actions dt-register-row-actions">
            <IconButton icon={Eye} label="Open Asset Register record" onClick={() => onOpenAsset?.(row.assetId)} />
            {row.masterListId && <IconButton icon={BookOpen} label="Open Master Downtime Codes" onClick={() => onMasterCodes?.(row)} />}
            {!row.eventEnd && onCloseEvent && <IconButton icon={Timer} label="Mark back online" onClick={() => onCloseEvent(row)} />}
            {row.masterListId && onCorrect && <IconButton icon={Pencil} label="Correct downtime record" onClick={() => onCorrect(row)} />}
            <IconButton icon={History} label="View audit history" onClick={() => onAudit?.(row)} />
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    {filter && createPortal(<div ref={filterRef} className="dt-register-filter-popover"
      role="group" aria-label={`Filter ${columns[filter.key].label}`} style={{ left: filter.left, top: filter.top, bottom: filter.bottom }}>
      <button type="button" autoFocus onClick={() => chooseFilter(null)}>All {columns[filter.key].label.toLowerCase()}</button>
      {[...new Set(rows.map((row) => display(valueFor(row, filter.key))))].sort(compare).map((value) =>
        <button type="button" key={value} aria-pressed={filters[filter.key] === value}
          onClick={() => chooseFilter(value)}>{value === "—" ? "Unspecified" : value}</button>)}
    </div>, document.body)}
    {loading ? <div className="dt-empty">Loading downtime…</div> : !filtered.length && <div className="dt-empty">
      {rows.length ? "No downtime matches these filters." : "No downtime recorded. Use Downtime Inputs to capture an event."}
    </div>}
    <p className="dt-muted">{filtered.length} of {rows.length} downtime records</p>
  </>
}

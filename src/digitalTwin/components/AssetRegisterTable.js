import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, Columns3, Download, Eye,
  GripVertical, History, Pencil, SlidersHorizontal, Timer } from "lucide-react"
import { canCaptureAsset } from "../models/downtimeCodes"
import { unitLabel } from "../models/units"
import { getTerm } from "../services/taxonomyService"
import { downloadCsv } from "../models/downloadCsv"

const DEFAULTS = [
  ["name", "Equipment / Asset ID", 235], ["group", "Equipment group", 170], ["make", "Make / OEM", 138],
  ["model", "Model", 135], ["hourMeter", "Machine hours", 133], ["operatingHours", "Operating hours", 140],
  ["location", "Location", 160], ["capacity", "Capacity / unit", 150], ["ownershipType", "Ownership status", 153],
  ["modelGroup", "Model group", 145], ["status", "Status", 132],
]
const OPTIONAL = [
  ["internalNumber", "Asset ID"], ["serialNumber", "Serial number"], ["registration", "Registration"],
  ["barcodeOrQr", "Barcode / QR"], ["equipmentTypeId", "Equipment type"], ["year", "Year"],
  ["criticality", "Criticality"], ["configuration", "Configuration"], ["owner", "Owner"], ["lessor", "Lessor"],
  ["financeOrSpv", "Finance / SPV"], ["acquisitionDate", "Acquisition date"], ["bookOrReplacementValue", "Book / replacement value"],
  ["nameplateCapacity", "Nameplate capacity"], ["canonicalUnit", "Unit"], ["currentDeratedCapacity", "Derated capacity"],
  ["deratingReason", "Derating reason"], ["condition", "Condition"], ["commissionedDate", "Commissioned"],
  ["expectedEndOfLife", "End of life"], ["disposalDate", "Disposal date"], ["odometer", "Odometer"],
  ["cycleMeter", "Cycle meter"], ["fuelMeter", "Fuel meter"], ["lastMeterReadingDate", "Last meter reading"],
  ["maintenanceStrategy", "Maintenance strategy"], ["serviceIntervalHours", "Service interval (hours)"],
  ["responsibleParty", "Responsible party"], ["lastServiceDate", "Last service"],
  ["nextServiceDueDate", "Next service due"], ["warrantyExpiryDate", "Warranty expiry"],
  ["licenceNumber", "Licence number"], ["inspectionExpiryDate", "Inspection expiry"],
  ["certificateExpiryDate", "Certificate expiry"], ["evidenceStatus", "Evidence status"],
  ["sourceSystem", "Source system"], ["confidence", "Confidence"], ["steward", "Steward"],
]
const columns = Object.fromEntries([...DEFAULTS, ...OPTIONAL].map(([key, label, width = 164]) => [key, { label, width }]))
const defaultKeys = DEFAULTS.map(([key]) => key)
const knownKeys = Object.keys(columns)
const prettify = (value) => value?.replace(/_/g, " ")
const assetNumber = (asset) => asset.internalNumber || asset.assetId || asset.id
const display = (value) => value == null || value === "" ? "—" : String(value)
const compare = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare

function getLayout(key) {
  const defaults = { order: knownKeys, visible: defaultKeys, widths: {} }
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || "null")
    if (!saved || !Array.isArray(saved.order) || !Array.isArray(saved.visible)) return defaults
    return {
      order: [...new Set([...saved.order.filter((id) => Object.hasOwn(columns, id)), ...knownKeys])],
      visible: [...new Set(["name", ...saved.visible.filter((id) => Object.hasOwn(columns, id))])],
      widths: Object.fromEntries(Object.entries(saved.widths || {}).filter(([id, width]) =>
        Object.hasOwn(columns, id) && Number.isFinite(width) && width >= 90 && width <= 740)),
    }
  } catch {
    return defaults
  }
}

function valueFor(row, key) {
  const { asset, group, location } = row
  switch (key) {
    case "group": return group
    case "location": return location
    case "capacity": return [asset.currentDeratedCapacity ?? asset.nameplateCapacity, asset.canonicalUnit && unitLabel(asset.canonicalUnit)]
      .filter((value) => value != null && value !== "").join(" ")
    case "name": return asset.name || assetNumber(asset)
    case "internalNumber": return assetNumber(asset)
    case "equipmentTypeId": return getTerm(asset.equipmentTypeId)?.name || asset.equipmentTypeId
    case "canonicalUnit": return asset.canonicalUnit && unitLabel(asset.canonicalUnit)
    case "ownershipType": case "status": case "maintenanceStrategy": case "condition": return prettify(asset[key])
    default: return asset[key]
  }
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

export default function AssetRegisterTable({ tenantId, rows, initialAssetId, loading, onView, onCapture, onEdit, onRetire }) {
  const storageKey = `digitalTwin.assetRegisterColumns:${tenantId}`
  const [layout, setLayout] = useState(() => getLayout(storageKey))
  const [search, setSearch] = useState(initialAssetId || "")
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState(null)
  const [filter, setFilter] = useState(null)
  const [manage, setManage] = useState(false)
  const dragged = useRef(null)
  const filterRef = useRef(null)
  const keys = layout.order.filter((key) => layout.visible.includes(key))
  const filtered = useMemo(() => {
    const selected = rows.filter((row) => {
      const a = row.asset
      const matches = [a.name, assetNumber(a), a.id, a.serialNumber, a.registration].join(" ").toLowerCase()
        .includes(search.toLowerCase().trim())
      return matches && Object.entries(filters).every(([key, value]) => display(valueFor(row, key)) === value)
    })
    if (sort) selected.sort((a, b) => {
      const left = valueFor(a, sort.key), right = valueFor(b, sort.key)
      if (display(left) === "—" || display(right) === "—") {
        return Number(display(left) === "—") - Number(display(right) === "—")
      }
      const direction = sort.direction === "asc" ? 1 : -1
      return direction * (typeof left === "number" && typeof right === "number" ? left - right : compare(String(left), String(right)))
    })
    return selected
  }, [rows, search, filters, sort])

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
  const exportRows = () => {
    const includeId = !keys.includes("internalNumber")
    const exportKeys = includeId ? keys.flatMap((key) => key === "name" ? ["name", "internalNumber"] : [key]) : keys
    downloadCsv("asset-register.csv", [exportKeys.map((key) => key === "name" ? "Equipment" : columns[key].label),
      ...filtered.map((row) => exportKeys.map((key) => valueFor(row, key)))])
  }

  return <>
    <div className="dt-actions dt-register-filter-actions">
      <input type="search" className="dt-input dt-register-search" aria-label="Search equipment"
        placeholder="Search name, asset ID or serial…" value={search} onChange={(event) => setSearch(event.target.value)} />
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
          <label><input type="checkbox" checked={index >= 0} disabled={key === "name"} onChange={() => visibleToggle(key)} /> {columns[key].label}</label>
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
        <tbody>{filtered.map((row) => {
          const { asset } = row
          const canCapture = canCaptureAsset(asset)
          return <tr key={asset.id}>
            {keys.map((key) => {
              const value = valueFor(row, key)
              return <td key={key} title={display(value)}>{key === "name" ? <>
                <strong>{display(value)}</strong><small>{assetNumber(asset)}</small>
              </> : key === "status" ? <span className={`dt-badge ${canCapture ? "dt-badge-green" : ""}`}>{display(value)}</span> : display(value)}</td>
            })}
            <td><div className="dt-actions dt-register-row-actions">
              <IconButton icon={Eye} label="View equipment" onClick={() => onView(asset)} />
              <IconButton icon={Pencil} label="Edit equipment" onClick={() => onEdit(asset)} />
              <IconButton icon={canCapture ? Timer : History} label={canCapture ? "Record downtime" : "View downtime history"} onClick={() => onCapture(asset.assetId || asset.id)} />
              <IconButton icon={Archive} label="Retire equipment" disabled={["retired", "disposed"].includes(asset.status)} onClick={() => onRetire(asset)} />
            </div></td>
          </tr>
        })}</tbody>
      </table>
    </div>
    {filter && createPortal(<div ref={filterRef} className="dt-register-filter-popover"
      role="group" aria-label={`Filter ${columns[filter.key].label}`} style={{ left: filter.left, top: filter.top, bottom: filter.bottom }}>
      <button type="button" autoFocus onClick={() => chooseFilter(null)}>All {columns[filter.key].label.toLowerCase()}</button>
      {[...new Set(rows.map((row) => display(valueFor(row, filter.key))))].sort(compare).map((value) =>
        <button type="button" key={value} aria-pressed={filters[filter.key] === value}
          onClick={() => chooseFilter(value)}>{value === "—" ? "Unspecified" : value}</button>)}
    </div>, document.body)}
    {loading ? <div className="dt-empty">Loading the register…</div> : !filtered.length && <div className="dt-empty">
      {rows.length ? "No equipment matches these filters." : "Save equipment in your diagram, add an asset or import a register."}
    </div>}
    <p className="dt-muted">{filtered.length} of {rows.length} equipment records</p>
  </>
}

/** One stable resource per equipment unit. Quantity changes never reuse an Asset ID. */
export function equipmentQuantity(node) {
  const value = Number(node.attributes?.quantity ?? 1)
  if (!Number.isInteger(value) || value < 1 || value > 50) throw new Error(`${node.name}: enter a quantity from 1 to 50.`)
  return value
}

export function inventoryForDiagram(diagram, assets, makeId) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]))
  const claimed = new Set()
  const entries = []
  const numbers = new Set(assets.map((asset) => String(asset.internalNumber || '').toUpperCase()))
  const nodes = diagram.nodes.map((node) => {
    if (node.nodeType !== 'asset') return node
    const attributes = { ...node.attributes }
    const previous = attributes.instances || (attributes.registerId ? [{ id: attributes.registerId }] : [])
    const instances = []
    const quantity = equipmentQuantity(node)
    for (let index = 0; index < quantity; index++) {
      const old = previous[index]
      const id = old?.id || makeId()
      if (claimed.has(id)) throw new Error(`${node.name}: equipment is linked more than once.`)
      claimed.add(id)
      const existing = byId.get(id)
      let internalNumber = existing?.internalNumber || old?.internalNumber || (index === 0 ? attributes.internalNumber : '')
      if (!internalNumber) {
        let suffix = index + 1
        do { internalNumber = `E-${node.id.slice(-12)}-${String(suffix++).padStart(3, '0')}`.toUpperCase() } while (numbers.has(internalNumber))
      }
      numbers.add(internalNumber.toUpperCase())
      const instance = { ...old, id, internalNumber }
      instances.push(instance)
      entries.push({ nodeId: node.id, node, index, instance, existing })
    }
    // Aggregate hierarchy nodes have their own identity, separate from resource IDs.
    delete attributes.registerId
    delete attributes.internalNumber
    return { ...node, attributes: { ...attributes, quantity, instances } }
  })
  return { nodes, entries, resourceIds: claimed }
}

export function visibleHierarchyNodes(nodes, relations) {
  const hidden = new Set()
  const queue = nodes.filter((node) => node.attributes?.collapsed).map((node) => node.id)
  const seen = new Set()
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i]
    if (seen.has(id)) continue
    seen.add(id)
    relations.filter((edge) => edge.isPrimary && edge.fromId === id).forEach((edge) => {
      hidden.add(edge.toId)
      queue.push(edge.toId)
    })
  }
  return nodes.filter((node) => !hidden.has(node.id))
}

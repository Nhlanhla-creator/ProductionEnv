/** Append-only organisation categories preserve fixed identities and historical versions. */
export function withActOfGod(nodes) {
  const result = nodes.map((node) => ({ ...node }))
  const parent = result.find((node) => node.level === 2 && node.parentId === 'big-5' && node.label === 'Standby')
  if (!parent || result.some((node) => node.id === 'org-act-of-god')) return result
  const common = { active: true, standardLabel: null, canonicalId: null }
  result.push({ ...common, id: 'org-act-of-god', parentId: parent.id, level: 3, label: 'Act of God', origin: 'custom_unmapped', terminal: false, sortOrder: result.length })
  result.push({ ...common, id: 'org-natural-events', parentId: 'org-act-of-god', level: 4, label: 'Natural events / extreme weather', origin: 'organisation', terminal: false, sortOrder: result.length })
  for (const label of ['Hurricane / cyclone', 'Flood', 'Earthquake', 'Tornado', 'Wildfire', 'Tsunami', 'Severe storm / lightning']) result.push({ ...common,
    id: `org-natural-${label.toLowerCase().replace(/[^a-z]+/g,'-')}`, parentId: 'org-natural-events', level: 5, label, origin: 'organisation', terminal: true, sortOrder: result.length })
  return result
}
export function appendDowntimeCategory(nodes, { parentId, label, id }) {
  const parent = nodes.find((node) => node.id === parentId)
  const clean = String(label || '').trim()
  if (!parent?.active || ![2,3].includes(parent.level)) throw new Error('Select a Level 2 or Level 3 parent first.')
  if (!clean || clean.length > 120) throw new Error('Enter a category name of 1–120 characters.')
  if (nodes.some((node) => node.parentId === parentId && node.label.toLowerCase() === clean.toLowerCase())) throw new Error('This category already exists under the selected parent.')
  return [...nodes.map((node) => node.id === parentId ? { ...node, terminal: false } : node), {
    id, parentId, level: parent.level + 1, label: clean, standardLabel: null, canonicalId: null,
    origin: parent.level === 2 ? 'custom_unmapped' : 'organisation', active: true, terminal: true, sortOrder: nodes.length,
  }]
}

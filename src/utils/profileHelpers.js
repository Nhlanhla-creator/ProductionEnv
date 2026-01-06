export function getDisplayName(data, currentUser, nameField, fallback = "User") {
  const nameFromPath = (data && nameField) ? nameField.split('.').reduce((obj, key) => obj?.[key], data) : null

  // Standard candidate fallbacks (ordered)
  const candidates = [
    data?.formData?.contactDetails?.primaryContactName,
    data?.formData?.personalOverview?.fullName,
    data?.formData?.contactDetails?.name,
    nameFromPath,
    data?.registeredName,
    currentUser?.displayName,
    currentUser?.email?.split("@")[0]
  ]

  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim()) return c
  }
  return fallback
}

export function getLogoFromData(data, logoField) {
  if (!data || !logoField) return null
  return logoField.split('.').reduce((obj, key) => obj?.[key], data) || null
}

export function normalizeRoles(data) {
  const rolesSet = new Set()
  let currentRole = ''

  if (!data) return { availableRoles: [], selectedRole: '' }

  // If roleArray exists and is array
  if (Array.isArray(data.roleArray)) {
    data.roleArray.forEach((r) => {
      if (r && r.trim()) rolesSet.add(mapRoleName(r))
    })
  }

  // If role is string: comma-separated
  if (data.role && typeof data.role === 'string') {
    data.role
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r)
      .forEach((r) => rolesSet.add(mapRoleName(r)))
  }

  // If current role exists
  if (data.currentRole && data.currentRole.trim()) {
    currentRole = mapRoleName(data.currentRole)
  }

  // As a fallback, when roleArray or role missing but currentRole exists
  if (!rolesSet.size && currentRole) {
    rolesSet.add(currentRole)
  }

  const orderedRoles = Array.from(rolesSet)
  if (!currentRole && orderedRoles.length) currentRole = orderedRoles[0]

  return { availableRoles: orderedRoles, selectedRole: currentRole }
}

function mapRoleName(role) {
  if (!role || typeof role !== 'string') return role
  const normalized = role.trim()
  if (/accelerator/i.test(normalized) || /catalyst/i.test(normalized)) return 'Catalysts'
  if (/advisor/i.test(normalized)) return 'Advisors'
  if (/investor/i.test(normalized)) return 'Investor'
  if (/intern/i.test(normalized)) return 'Interns'
  if (/sme/i.test(normalized) || /small and medium/i.test(normalized) || /sme\/business/i.test(normalized)) return 'SMSEs'
  // Return capitalized as default
  return normalized[0].toUpperCase() + normalized.slice(1)
}

export function normalizeRoleName(role) {
  return mapRoleName(role)
}

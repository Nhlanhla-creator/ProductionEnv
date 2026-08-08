export function getDisplayName(data, currentUser, nameField, fallback = "User") {
  const getField = (path) => {
    if (!data || !path) return null;
    const parts = path.split('.');
    
    // 1. Try with formData prefix
    let val = parts.reduce((obj, key) => obj?.[key], data.formData);
    if (val && typeof val === 'string' && val.trim()) return val;
    
    // 2. Try at root level
    val = parts.reduce((obj, key) => obj?.[key], data);
    if (val && typeof val === 'string' && val.trim()) return val;
    
    return null;
  };

  const nameFromPath = getField(nameField);

  // Determine if caller is explicitly requesting a company/entity name
  const isRequestingEntityName = nameField && (
    nameField.includes("entityOverview") || 
    nameField.includes("registeredName") || 
    nameField.includes("organizationName")
  );

  let candidates = [];
  
  if (isRequestingEntityName) {
    // Entity Mode: tradingName -> registeredName -> contact person
    candidates = [
      getField('entityOverview.tradingName'),
      getField('entityOverview.registeredName'),
      nameFromPath,
      getField('contactDetails.contactName'),
      getField('contactDetails.primaryContactName'),
      getField('contactDetails.name'),
      getField('personalOverview.fullName'),
      data?.registeredName,
      currentUser?.displayName,
      currentUser?.email?.split("@")[0]
    ];
  } else {
    // Human Mode (Welcome header): contact person -> tradingName -> registeredName
    candidates = [
      getField('contactDetails.contactName'),
      getField('contactDetails.primaryContactName'),
      getField('contactDetails.name'),
      getField('personalOverview.fullName'),
      nameFromPath,
      getField('entityOverview.tradingName'),
      getField('entityOverview.registeredName'),
      data?.registeredName,
      currentUser?.displayName,
      currentUser?.email?.split("@")[0]
    ];
  }

  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim()) return c;
  }
  return fallback;
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

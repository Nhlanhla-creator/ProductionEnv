import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore"
import { auth, db } from "../../firebaseConfig"
import { shiftWindow } from "../models/shiftCapture"

const teamCollection = (tenantId, name) => collection(db, "digitalTwinTenants", tenantId, name)
const captureKey = (date, shiftId) => `${date}_${shiftId}`

export async function listPeople(tenantId) {
  const snapshot = await getDocs(teamCollection(tenantId, "people"))
  return snapshot.docs.map((entry) => {
    const { name, role, category } = entry.data()
    return { id: entry.id, name, role, category }
  }).sort((a, b) => a.name.localeCompare(b.name))
}

export function personPayload(person, creating) {
  const name = person.name.trim()
  if (!name) throw new Error("Enter the person's name.")
  if (!auth.currentUser) throw new Error("Sign in to manage people.")
  const timestamp = serverTimestamp()
  const uid = auth.currentUser.uid
  return {
    name, role: person.role.trim(), category: person.category,
    updatedAt: timestamp, updatedBy: uid,
    ...(creating ? { createdAt: timestamp, createdBy: uid } : {}),
  }
}

export async function savePerson(tenantId, person) {
  const people = teamCollection(tenantId, "people")
  if (person.id) return updateDoc(doc(people, person.id), personPayload(person, false))
  return setDoc(doc(people), personPayload(person, true))
}

export async function loadAttendance(tenantId, date, shiftId) {
  const snapshot = await getDocs(query(teamCollection(tenantId, "shiftAttendance"), where("captureKey", "==", captureKey(date, shiftId))))
  return Object.fromEntries(snapshot.docs.map((entry) => {
    const { personId, status } = entry.data()
    return [personId, status]
  }))
}

export async function markAttendance(tenantId, { date, shift, personId, status }) {
  const user = auth.currentUser
  if (!user) throw new Error("Sign in to record attendance.")
  if (!shift.active) throw new Error("Select an active shift.")
  shiftWindow(date, shift)
  const key = captureKey(date, shift.id)
  await setDoc(doc(teamCollection(tenantId, "shiftAttendance"), `${key}_${personId}`), {
    date, shiftId: shift.id, captureKey: key, personId, status,
    updatedBy: user.uid, updatedAt: serverTimestamp(),
  })
}

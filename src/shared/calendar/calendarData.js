import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getNestedValue } from "./calendarUtils";

export async function resolveProfile(uid, config, authUser = null) {
  if (!uid) return { name: config.label || "User", email: "" };
  const collections = config.profileCollections || ["MyuniversalProfiles", "universalProfiles", "users"];
  const namePaths = config.profileNamePaths || ["name", "fullName", "displayName", "email"];
  let name = "";
  let email = authUser?.email || "";
  for (const collectionName of collections) {
    try {
      const snap = await getDoc(doc(db, collectionName, uid));
      if (!snap.exists()) continue;
      const data = snap.data();
      if (!name) name = namePaths.map((p) => getNestedValue(data, p)).find(Boolean) || "";
      if (!email) email = ["formData.contactDetails.email", "contactDetails.email", "email", "userEmail"]
        .map((p) => getNestedValue(data, p)).find(Boolean) || "";
      if (name && email) break;
    } catch (error) {
      // Some accounts cannot read every profile collection. Keep the visible fallback.
      console.warn(`Could not read ${collectionName} profile`, error);
    }
  }
  return { name: name || authUser?.displayName || authUser?.email || config.label || "User", email };
}

export async function loadRecipients(config, uid) {
  const sources = config.recipientSources || [];
  const results = await Promise.allSettled(sources.map(async (source) => {
    const snapshot = await getDocs(query(collection(db, source.collection), where(source.ownerField, "==", uid)));
    return snapshot.docs.map((snap) => {
      const data = snap.data();
      return {
        id: getNestedValue(data, source.counterpartField),
        name: source.nameFields.map((field) => getNestedValue(data, field)).find(Boolean) || "",
        type: source.type,
        applicationId: snap.id,
        sourceCollection: source.collection,
        email: ["applicantEmail", "smeEmail", "email", "userEmail"].map((p) => getNestedValue(data, p)).find(Boolean) || "",
      };
    });
  }));
  const recipients = new Map();
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.warn(`Calendar recipients unavailable from ${sources[i].collection}:`, result.reason);
      return;
    }
    result.value.forEach((person) => {
      if (!person.id || person.id === uid) return;
      const previous = recipients.get(person.id);
      recipients.set(person.id, {
        ...person,
        name: person.name || previous?.name || person.type,
        email: person.email || previous?.email || "",
      });
    });
  });
  return Array.from(recipients.values()).sort((a, b) => a.name.localeCompare(b.name));
}

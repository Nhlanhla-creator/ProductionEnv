import { collection,doc,getDocs,setDoc,runTransaction } from 'firebase/firestore';
import { db,auth } from '../../firebaseConfig';
import { buildMeasurement,listMeasurements } from './measurementService';
import { contextForDowntime } from './resourceService';
import { COMPONENT_CATALOGUE } from '../models/kpiSchema';
import { DEFAULT_SHIFTS,SHIFT_COMPONENTS,shiftWindow,validateShiftRow } from '../models/shiftCapture';
const col=tenantId=>collection(db,'digitalTwinTenants',tenantId,'shifts');
export async function listShifts(tenantId) {
  const snap=await getDocs(col(tenantId));
  const merged=new Map(DEFAULT_SHIFTS.map(s=>[s.id,{...s}]));
  snap.docs.forEach(d=>merged.set(d.id,{...d.data(),id:d.id}));
  return [...merged.values()];
}
export async function saveShift(tenantId,shift) {
  if(!auth.currentUser)throw new Error('Sign in before saving.');
  if(!/^[a-zA-Z0-9_-]{1,60}$/.test(shift.id)||!shift.name?.trim())throw new Error('Enter a name and a shift ID using letters, numbers, hyphens or underscores.');
  shiftWindow('2026-01-15',shift);
  const value={id:shift.id,name:shift.name.trim(),startTime:shift.startTime,endTime:shift.endTime,timezone:shift.timezone,active:shift.active!==false,updatedAt:new Date().toISOString(),updatedBy:{uid:auth.currentUser.uid,email:auth.currentUser.email||null}};
  await setDoc(doc(col(tenantId),shift.id),value);
  return value;
}
export async function saveShiftRow(tenantId,{row,date,shift}) {
  const window=shiftWindow(date,shift),errors=validateShiftRow(row,window.hours);
  if(errors.length)throw new Error(errors.join(' '));
  const context=await contextForDowntime(tenantId,row.assetId,date);
  const existing=await listMeasurements(tenantId,{assetId:row.assetId,shiftId:shift.id,startFrom:window.startTimestamp,endTo:window.startTimestamp});
  const components=SHIFT_COMPONENTS.filter(k=>row[k]!==''&&row[k]!=null);
  if(existing.some(m=>components.includes(m.component)&&!['void','voided','corrected','rejected','returned'].includes(m.state)&&m.sourceSystem!=='shift_capture'))throw new Error('Measurements already exist for this machine and shift from another capture source. Use their correction workflow.');
  const inputs=components.map(component=>({
    component,numericValue:Number(row[component]),inputUnit:COMPONENT_CATALOGUE[component].unit,
    ...window,assetId:row.assetId,siteId:context.siteId||null,groupId:context.groupId||null,contractId:context.contractId||null,activityId:context.activityId||null,serviceId:context.serviceId||null,
    shiftId:shift.id,timezone:shift.timezone,tags:{crew:row.operatorOrCrew||'',notes:row.notes||''},
    sourceType:'manual',sourceSystem:'shift_capture',externalSourceId:`${date}:${shift.id}:${row.assetId}:${component}`,confidence:'manual_actual',state:'draft',
  }));
  const refs=inputs.map(input=>doc(db,'digitalTwinTenants',tenantId,'measurements',`shift_${encodeURIComponent(input.externalSourceId)}`));
  return runTransaction(db,async tx=>{
    const snapshots=await Promise.all(refs.map(ref=>tx.get(ref)));
    const saved=[];
    for(let i=0;i<inputs.length;i++) {
      const input=inputs[i],snapshot=snapshots[i];
      if(snapshot.exists()) {
        const previous=snapshot.data();
        const same=['component','assetId','shiftId','siteId','groupId','contractId','activityId','serviceId','startTimestamp','endTimestamp'].every(k=>previous[k]===input[k])
          &&previous.inputValue===input.numericValue&&previous.tags?.crew===input.tags.crew&&previous.tags?.notes===input.tags.notes;
        if(!same||['void','voided','corrected','rejected','returned'].includes(previous.state))throw new Error('This shift measurement is already saved. Use the measurement correction workflow to change it.');
        saved.push(previous);
      } else {
        const value=buildMeasurement(tenantId,input,refs[i].id);
        if(value.validationErrors.length)throw new Error(value.validationErrors.join(' '));
        tx.set(refs[i],value);saved.push(value);
      }
    }
    return saved;
  });
}

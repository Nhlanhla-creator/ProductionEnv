/** Shared capture contract for the single-asset form and multi-asset grid. */
export const SHIFT_COMPONENTS = ['scheduled_time','available_time','operating_time','planned_downtime','standby_time','accepted_output','fuel_consumed'];
export const DEFAULT_SHIFTS = [
  { id:'day', name:'Day', startTime:'06:00', endTime:'18:00', timezone:'Africa/Johannesburg', active:true },
  { id:'night', name:'Night', startTime:'18:00', endTime:'06:00', timezone:'Africa/Johannesburg', active:true },
];
export const localDate = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
function wallParts(instant, timezone) {
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)).map(p=>[p.type,p.value]));
  return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
}
export function wallTime(date,time,timezone) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Choose a valid shift date and time.');
  const target=Date.parse(`${date}T${time}:00Z`);
  if(!Number.isFinite(target)||new Date(target).toISOString().slice(0,10)!==date)throw new Error('Choose a valid shift date.');
  const offsets=new Set([-36,0,36].map(h=>{const instant=target+h*3600000;return wallParts(instant,timezone)-instant;}));
  const candidates=[...offsets].map(offset=>target-offset).filter(t=>wallParts(t,timezone)===target);
  if(candidates.length!==1)throw new Error('This local time is missing or ambiguous at a daylight-saving change. Adjust the shift time.');
  return candidates[0];
}
export function shiftWindow(date,shift) {
  if(!shift?.id||!shift.startTime||!shift.endTime)throw new Error('Configure and select a shift first.');
  const next=new Date(`${date}T12:00:00Z`);next.setUTCDate(next.getUTCDate()+1);
  const endDate=shift.endTime<=shift.startTime?next.toISOString().slice(0,10):date;
  const start=wallTime(date,shift.startTime,shift.timezone),end=wallTime(endDate,shift.endTime,shift.timezone);
  return {startTimestamp:new Date(start).toISOString(),endTimestamp:new Date(end).toISOString(),hours:(end-start)/3600000};
}
export function validateShiftRow(row,hours=24) {
  const errors=[];
  if(!row.assetId)errors.push('Select a machine.');
  const present=k=>row[k]!==''&&row[k]!=null;
  const number=k=>Number(row[k]);
  if(!SHIFT_COMPONENTS.some(present))errors.push('Enter at least one measurement.');
  for(const key of SHIFT_COMPONENTS)if(present(key)&&(!Number.isFinite(number(key))||number(key)<0))errors.push(`${key.replaceAll('_',' ')} must be a non-negative number.`);
  for(const key of SHIFT_COMPONENTS.slice(0,5))if(present(key)&&number(key)>hours+0.01)errors.push(`${key.replaceAll('_',' ')} exceeds this shift's ${hours} hours.`);
  for(const [a,b] of [['available_time','scheduled_time'],['operating_time','available_time']])if(present(a)&&present(b)&&number(a)>number(b))errors.push(`${a.replaceAll('_',' ')} exceeds ${b.replaceAll('_',' ')}.`);
  // Unplanned downtime can be the difference, so planned + available may be less than scheduled.
  if(['planned_downtime','available_time','scheduled_time'].every(present)&&number('planned_downtime')+number('available_time')>number('scheduled_time')+0.01)errors.push('Planned downtime plus available time exceeds scheduled time.');
  if(['operating_time','standby_time','available_time'].every(present)&&number('operating_time')+number('standby_time')>number('available_time')+0.01)errors.push('Operating time plus standby exceeds available time.');
  return errors;
}

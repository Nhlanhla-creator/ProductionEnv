"use client"
// Existing imports keep working; single-machine and grid capture use one implementation.
import InputSheetGrid from './InputSheetGrid';
export default function MeasurementCapture(props){return <InputSheetGrid {...props} initialRowCount={1}/>;}

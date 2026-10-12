"use client"

import { CheckCircle2, AlertCircle, HelpCircle, Clock, Sparkles } from "lucide-react"
import { T } from "../matching/Badges"
import TaskRow from "./TaskRow"

const TONE = {
  ok:      { icon: CheckCircle2, color: T.green, bg: T.greenBg, border: `${T.green}22` },
  confirm: { icon: HelpCircle,   color: T.blue,  bg: T.blueBg,  border: `${T.blue}22` },
  warn:    { icon: AlertCircle,  color: T.amber, bg: T.amberBg, border: `${T.amber}22` },
  info:    { icon: Clock,        color: T.blue,  bg: T.blueBg,  border: `${T.blue}22` },
  muted:   { icon: Sparkles,     color: T.gray,  bg: T.grayBg,  border: `${T.gray}22` },
}

export default function TaskGroup({
  title, tone = "warn", description, tasks, draft,
  onConfirm, onAnswer, onAttachEvidence, onRequestWaiver, onEditProfileField,
  pathForRule,
}) {
  const meta = TONE[tone] || TONE.warn
  const { icon: Icon } = meta

  if (!tasks || tasks.length === 0) return null

  return (
    <section style={{ marginBottom: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
      }}>
        <Icon size={14} color={meta.color} />
        <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: T.accent }}>
          {title}
        </h3>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 999,
          background: meta.bg, color: meta.color,
        }}>{tasks.length}</span>
      </div>
      {description && (
        <p style={{ margin: "0 0 10px 22px", fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.map((task) => (
          <TaskRow
            key={task.ruleId}
            task={task}
            draft={draft}
            onConfirm={onConfirm}
            onAnswer={onAnswer}
            onAttachEvidence={onAttachEvidence}
            onRequestWaiver={onRequestWaiver}
            onEditProfileField={onEditProfileField}
            fieldPath={pathForRule?.(task)}
            required={task.required !== false}
            waivable={!!task.waivable}
          />
        ))}
      </div>
    </section>
  )
}
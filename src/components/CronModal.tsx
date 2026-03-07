import { useState } from "react";
import { Modal } from "./Modal";
import { buildCronExpression, COMMON_TIMEZONES } from "../utils/cronUtils";
import type { CronScheduleType, CronIntervalUnit, TriggerCronData } from "../types";

const DAY_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

type CronModalProps = {
  up: (k: string, v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  initialData?: Partial<TriggerCronData>;
  mode?: "create" | "edit";
};

export function CronModal({ up, onSubmit, onClose, initialData, mode = "create" }: CronModalProps) {
  const d = initialData ?? {};
  const [name, setName] = useState(d.name ?? "");
  const [description, setDescription] = useState(d.description ?? "");
  const [scheduleType, setScheduleType] = useState<CronScheduleType>(d.scheduleType ?? "interval");
  const [intervalValue, setIntervalValue] = useState(d.intervalValue ?? 5);
  const [intervalUnit, setIntervalUnit] = useState<CronIntervalUnit>(d.intervalUnit ?? "minutes");
  const [atHour, setAtHour] = useState(d.atHour ?? 9);
  const [atMinute, setAtMinute] = useState(d.atMinute ?? 0);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(d.daysOfWeek ?? [1]);
  const [dayOfMonth, setDayOfMonth] = useState(d.dayOfMonth ?? 1);
  const [timezone, setTimezone] = useState(d.timezone ?? "UTC");

  // Sync a field change: update local state AND push to parent form
  function syncName(v: string) {
    setName(v);
    up("name", v.trim());
  }

  function syncDescription(v: string) {
    setDescription(v);
    up("description", v.trim());
  }

  function syncScheduleType(v: CronScheduleType) {
    setScheduleType(v);
    up("scheduleType", v);
    syncCronExpr({ scheduleType: v });
  }

  function syncIntervalValue(v: number) {
    setIntervalValue(v);
    up("intervalValue", v);
    syncCronExpr({ intervalValue: v });
  }

  function syncIntervalUnit(v: CronIntervalUnit) {
    setIntervalUnit(v);
    up("intervalUnit", v);
    syncCronExpr({ intervalUnit: v });
  }

  function syncAtHour(v: number) {
    setAtHour(v);
    up("atHour", v);
    syncCronExpr({ atHour: v });
  }

  function syncAtMinute(v: number) {
    setAtMinute(v);
    up("atMinute", v);
    syncCronExpr({ atMinute: v });
  }

  function syncDaysOfWeek(newDays: number[]) {
    setDaysOfWeek(newDays);
    up("daysOfWeek", newDays);
    syncCronExpr({ daysOfWeek: newDays });
  }

  function syncDayOfMonth(v: number) {
    setDayOfMonth(v);
    up("dayOfMonth", v);
    syncCronExpr({ dayOfMonth: v });
  }

  function syncTimezone(v: string) {
    setTimezone(v);
    up("timezone", v);
    syncCronExpr({ timezone: v });
  }

  // Recompute and push cronExpression after any field changes
  function syncCronExpr(overrides: Record<string, any> = {}) {
    const expr = buildCronExpression({
      scheduleType,
      intervalValue,
      intervalUnit,
      atHour,
      atMinute,
      daysOfWeek,
      dayOfMonth,
      timezone,
      ...overrides,
    });
    up("cronExpression", expr);
  }

  // Current preview (uses latest local state)
  const preview = buildCronExpression({
    scheduleType,
    intervalValue,
    intervalUnit,
    atHour,
    atMinute,
    daysOfWeek,
    dayOfMonth,
    timezone,
  });

  function toggleDay(day: number) {
    const newDays = daysOfWeek.includes(day)
      ? daysOfWeek.filter((d) => d !== day)
      : [...daysOfWeek, day];
    syncDaysOfWeek(newDays);
  }

  function handleSubmit() {
    if (!name.trim()) return;
    // Ensure cronExpression is pushed with latest state before submit
    up("cronExpression", preview);
    onSubmit();
  }

  const effectiveIntervalValue =
    intervalUnit === "seconds" ? Math.max(30, intervalValue) : intervalValue;

  return (
    <Modal title={mode === "edit" ? "Edit Cron Trigger" : "Create Cron Trigger"} onClose={onClose}>
      <div className="form">

        {/* Name */}
        <div className="form__field">
          <label className="label">Name <span className="req">*</span></label>
          <input
            className="input"
            placeholder="e.g. Daily Price Check"
            value={name}
            onChange={(e) => syncName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="form__field">
          <label className="label">Description</label>
          <textarea
            className="textarea"
            rows={2}
            value={description}
            onChange={(e) => syncDescription(e.target.value)}
          />
        </div>

        {/* Schedule Type */}
        <div className="form__field">
          <label className="label">Schedule type</label>
          <div className="btn-group">
            {(["interval", "daily", "weekly", "monthly"] as CronScheduleType[]).map((t) => (
              <button
                key={t}
                className={`btn btn--sm ${scheduleType === t ? "btn--active" : "btn--ghost"}`}
                onClick={() => syncScheduleType(t)}
                type="button"
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── INTERVAL ── */}
        {scheduleType === "interval" && (
          <div className="form__grid">
            <div className="form__field">
              <label className="label">Every</label>
              <input
                className="input"
                type="number"
                min={intervalUnit === "seconds" ? 30 : 1}
                value={intervalValue}
                onChange={(e) => syncIntervalValue(Number(e.target.value))}
              />
            </div>
            <div className="form__field">
              <label className="label">Unit</label>
              <select
                className="select"
                value={intervalUnit}
                onChange={(e) => syncIntervalUnit(e.target.value as CronIntervalUnit)}
              >
                <option value="seconds">seconds</option>
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
              </select>
            </div>
            {intervalUnit === "seconds" && intervalValue < 30 && (
              <div className="form__hint form__hint--warn">
                ⚠️ CRE minimum is 30 seconds — will be adjusted to {effectiveIntervalValue}s.
              </div>
            )}
          </div>
        )}

        {/* ── DAILY ── */}
        {scheduleType === "daily" && (
          <div className="form__grid">
            <div className="form__field">
              <label className="label">Hour (0–23)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={23}
                value={atHour}
                onChange={(e) => syncAtHour(Number(e.target.value))}
              />
            </div>
            <div className="form__field">
              <label className="label">Minute (0–59)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={59}
                value={atMinute}
                onChange={(e) => syncAtMinute(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* ── WEEKLY ── */}
        {scheduleType === "weekly" && (
          <>
            <div className="form__field">
              <label className="label">Days of week</label>
              <div className="day-picker">
                {DAY_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    className={`btn btn--day ${daysOfWeek.includes(value) ? "btn--active" : "btn--ghost"}`}
                    onClick={() => toggleDay(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form__grid">
              <div className="form__field">
                <label className="label">Hour (0–23)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={23}
                  value={atHour}
                  onChange={(e) => syncAtHour(Number(e.target.value))}
                />
              </div>
              <div className="form__field">
                <label className="label">Minute (0–59)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={59}
                  value={atMinute}
                  onChange={(e) => syncAtMinute(Number(e.target.value))}
                />
              </div>
            </div>
          </>
        )}

        {/* ── MONTHLY ── */}
        {scheduleType === "monthly" && (
          <div className="form__grid">
            <div className="form__field">
              <label className="label">Day of month (1–31)</label>
              <input
                className="input"
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => syncDayOfMonth(Number(e.target.value))}
              />
            </div>
            <div className="form__field">
              <label className="label">Hour (0–23)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={23}
                value={atHour}
                onChange={(e) => syncAtHour(Number(e.target.value))}
              />
            </div>
            <div className="form__field">
              <label className="label">Minute (0–59)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={59}
                value={atMinute}
                onChange={(e) => syncAtMinute(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* Timezone (for non-interval) */}
        {scheduleType !== "interval" && (
          <div className="form__field">
            <label className="label">Timezone</label>
            <select
              className="select"
              value={timezone}
              onChange={(e) => syncTimezone(e.target.value)}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        )}

        {/* Cron Expression Preview */}
        <div className="form__field">
          <label className="label">Cron expression (preview)</label>
          <div className="cron-preview">{preview}</div>
        </div>

        <div className="form__actions">
          <button className="btn" onClick={handleSubmit} disabled={!name.trim()}>
            {mode === "edit" ? "Save" : "Create"}
          </button>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

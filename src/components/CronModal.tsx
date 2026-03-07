import { useState } from "react";
import { Modal } from "./Modal";
import { buildCronExpression, COMMON_TIMEZONES } from "../utils/cronUtils";
import type { CronScheduleType, CronIntervalUnit } from "../types";

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
};

export function CronModal({ up, onSubmit, onClose }: CronModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleType, setScheduleType] = useState<CronScheduleType>("interval");
  const [intervalValue, setIntervalValue] = useState(5);
  const [intervalUnit, setIntervalUnit] = useState<CronIntervalUnit>("minutes");
  const [atHour, setAtHour] = useState(9);
  const [atMinute, setAtMinute] = useState(0);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]); // Monday default
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [timezone, setTimezone] = useState("UTC");

  const minSeconds = intervalUnit === "seconds" ? Math.max(30, intervalValue) : intervalValue;

  const preview = buildCronExpression({
    scheduleType,
    intervalValue: intervalUnit === "seconds" ? minSeconds : intervalValue,
    intervalUnit,
    atHour,
    atMinute,
    daysOfWeek,
    dayOfMonth,
    timezone,
  });

  function sync() {
    up("name", name.trim());
    up("description", description.trim());
    up("scheduleType", scheduleType);
    up("intervalValue", intervalUnit === "seconds" ? minSeconds : intervalValue);
    up("intervalUnit", intervalUnit);
    up("atHour", atHour);
    up("atMinute", atMinute);
    up("daysOfWeek", daysOfWeek);
    up("dayOfMonth", dayOfMonth);
    up("timezone", timezone);
    up("cronExpression", preview);
  }

  function handleSubmit() {
    if (!name.trim()) return;
    sync();
    onSubmit();
  }

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleScheduleTypeChange(t: CronScheduleType) {
    setScheduleType(t);
  }

  return (
    <Modal title="Create Cron Trigger" onClose={onClose}>
      <div className="form">

        {/* Name */}
        <div className="form__field">
          <label className="label">Name <span className="req">*</span></label>
          <input
            className="input"
            placeholder="e.g. Daily Price Check"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="form__field">
          <label className="label">Description</label>
          <textarea
            className="textarea"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
                onClick={() => handleScheduleTypeChange(t)}
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
                onChange={(e) => setIntervalValue(Number(e.target.value))}
              />
            </div>
            <div className="form__field">
              <label className="label">Unit</label>
              <select
                className="select"
                value={intervalUnit}
                onChange={(e) => setIntervalUnit(e.target.value as CronIntervalUnit)}
              >
                <option value="seconds">seconds</option>
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
              </select>
            </div>
            {intervalUnit === "seconds" && intervalValue < 30 && (
              <div className="form__hint form__hint--warn">
                ⚠️ CRE minimum is 30 seconds — will be adjusted automatically.
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
                onChange={(e) => setAtHour(Number(e.target.value))}
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
                onChange={(e) => setAtMinute(Number(e.target.value))}
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
                  onChange={(e) => setAtHour(Number(e.target.value))}
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
                  onChange={(e) => setAtMinute(Number(e.target.value))}
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
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
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
                onChange={(e) => setAtHour(Number(e.target.value))}
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
                onChange={(e) => setAtMinute(Number(e.target.value))}
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
              onChange={(e) => setTimezone(e.target.value)}
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
            Create
          </button>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

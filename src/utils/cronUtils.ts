import type { TriggerCronData, CronScheduleType, CronIntervalUnit } from "../types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function buildCronExpression(data: {
  scheduleType?: CronScheduleType;
  intervalValue?: number;
  intervalUnit?: CronIntervalUnit;
  atHour?: number;
  atMinute?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  timezone?: string;
}): string {
  const {
    scheduleType = "interval",
    intervalValue = 5,
    intervalUnit = "minutes",
    atHour = 9,
    atMinute = 0,
    daysOfWeek = [],
    dayOfMonth = 1,
    timezone = "",
  } = data;

  let expr = "";

  switch (scheduleType) {
    case "interval": {
      if (intervalUnit === "seconds") {
        const secs = Math.max(30, intervalValue);
        expr = `*/${secs} * * * * *`;
      } else if (intervalUnit === "minutes") {
        expr = `*/${intervalValue} * * * *`;
      } else {
        // hours
        expr = `0 */${intervalValue} * * *`;
      }
      break;
    }
    case "daily":
      expr = `${atMinute} ${atHour} * * *`;
      break;
    case "weekly": {
      const days =
        daysOfWeek.length > 0
          ? [...daysOfWeek].sort((a, b) => a - b).join(",")
          : "*";
      expr = `${atMinute} ${atHour} * * ${days}`;
      break;
    }
    case "monthly":
      expr = `${atMinute} ${atHour} ${dayOfMonth} * *`;
      break;
    default:
      expr = `*/5 * * * *`;
  }

  return timezone && timezone !== "UTC" ? `TZ=${timezone} ${expr}` : expr;
}

export function cronSummary(data: Partial<TriggerCronData>): string {
  const {
    scheduleType = "interval",
    intervalValue = 5,
    intervalUnit = "minutes",
    atHour = 9,
    atMinute = 0,
    daysOfWeek = [],
    dayOfMonth = 1,
    timezone = "",
  } = data;

  const tz = timezone && timezone !== "UTC" ? ` (${timezone})` : "";
  const time = `${pad(atHour)}:${pad(atMinute)}`;

  switch (scheduleType) {
    case "interval":
      return `Every ${intervalValue} ${intervalUnit}`;
    case "daily":
      return `Daily at ${time}${tz}`;
    case "weekly": {
      const dayStr =
        daysOfWeek.length > 0
          ? [...daysOfWeek]
              .sort((a, b) => a - b)
              .map((d) => DAY_NAMES[d])
              .join(", ")
          : "every day";
      return `Every ${dayStr} at ${time}${tz}`;
    }
    case "monthly":
      return `Monthly on day ${dayOfMonth} at ${time}${tz}`;
    default:
      return "Custom schedule";
  }
}

export const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Lisbon",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
];

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseCsv = (value, fallback) => {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return fallback;
  }

  const items = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
};

const normalizeApiBaseUrl = (value, fallback) => {
  const resolved = String(value ?? fallback).trim() || fallback;
  return resolved.replace(/\/+$/, "");
};

const formatUploadSizeLabel = (sizeMB) => {
  if (sizeMB % 1024 === 0) {
    return `${sizeMB / 1024}GB`;
  }

  return `${sizeMB}MB`;
};

const ALLOWED_QUALITIES = ["Low", "Medium", "High"];
const ALLOWED_RESOLUTIONS = ["Auto", "1080p", "720p", "480p"];
const ALLOWED_TARGET_UNITS = ["MB", "GB"];

const fallbackFormats = ["mp4", "mov", "avi", "mkv", "webm"];
const acceptedFormats = parseCsv(
  import.meta.env.VITE_ACCEPTED_VIDEO_FORMATS,
  fallbackFormats,
);

const defaultQuality = String(import.meta.env.VITE_DEFAULT_QUALITY || "High");
const defaultResolution = String(
  import.meta.env.VITE_DEFAULT_RESOLUTION || "Auto",
);
const defaultTargetUnit = String(
  import.meta.env.VITE_DEFAULT_TARGET_UNIT || "MB",
).toUpperCase();

const maxUploadSizeMB = parsePositiveInt(
  import.meta.env.VITE_MAX_UPLOAD_SIZE_MB,
  1024,
);

const appConfig = {
  appName: String(import.meta.env.VITE_APP_NAME || "Compresso"),
  splashDurationMs: parsePositiveInt(
    import.meta.env.VITE_SPLASH_DURATION_MS,
    2000,
  ),
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL, "/api/v1"),
  acceptedFormats,
  acceptedFormatsLabel: acceptedFormats
    .map((item) => item.toUpperCase())
    .join(", "),
  maxUploadSizeMB,
  maxUploadSizeBytes: maxUploadSizeMB * 1024 * 1024,
  maxUploadSizeLabel: formatUploadSizeLabel(maxUploadSizeMB),
  acceptFileInputValue: acceptedFormats.map((ext) => `.${ext}`).join(","),
  compressionPollIntervalMs: parsePositiveInt(
    import.meta.env.VITE_COMPRESSION_POLL_INTERVAL_MS,
    4000,
  ),
  progressDebounceMs: parsePositiveInt(
    import.meta.env.VITE_PROGRESS_DEBOUNCE_MS,
    220,
  ),
  settingsModalDelayMs: parsePositiveInt(
    import.meta.env.VITE_SETTINGS_MODAL_DELAY_MS,
    220,
  ),
  qualityOptions: ALLOWED_QUALITIES,
  resolutionOptions: ALLOWED_RESOLUTIONS,
  targetUnitOptions: ALLOWED_TARGET_UNITS,
  defaultQuality: ALLOWED_QUALITIES.includes(defaultQuality)
    ? defaultQuality
    : "High",
  defaultResolution: ALLOWED_RESOLUTIONS.includes(defaultResolution)
    ? defaultResolution
    : "Auto",
  defaultTargetUnit: ALLOWED_TARGET_UNITS.includes(defaultTargetUnit)
    ? defaultTargetUnit
    : "MB",
};

export default appConfig;

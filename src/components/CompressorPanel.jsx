import { useEffect, useMemo, useRef, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Disk,
  File,
  Rocket,
  Settings,
  UploadFile,
} from "@duo-icons/react";
import appConfig from "../config/app.config";

export default function CompressorPanel() {
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState("prepare"); // prepare | uploading | compressing | done
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [targetSize, setTargetSize] = useState("");
  const [targetUnit, setTargetUnit] = useState(appConfig.defaultTargetUnit);
  const [quality, setQuality] = useState(appConfig.defaultQuality);
  const [resolution, setResolution] = useState(appConfig.defaultResolution);
  const [uploadSession, setUploadSession] = useState(null);
  const [resultMeta, setResultMeta] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [targetSizeError, setTargetSizeError] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const progressDebounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      if (progressDebounceRef.current) {
        clearTimeout(progressDebounceRef.current);
      }
    };
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!extension || !appConfig.acceptedFormats.includes(extension)) {
      setFeedback(`Unsupported format. Use ${appConfig.acceptedFormatsLabel}.`);
      return;
    }

    if (selectedFile.size > appConfig.maxUploadSizeBytes) {
      setFeedback(
        `This file is larger than ${appConfig.maxUploadSizeLabel}. Choose a smaller file.`,
      );
      return;
    }

    setFeedback("");
    setFile(selectedFile);
    setUploadSession(null);
    setResultMeta(null);
    setPhase("prepare");
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const estimatedOutput = useMemo(() => {
    if (!targetSize) {
      return "Not set";
    }

    return `${targetSize} ${targetUnit}`;
  }, [targetSize, targetUnit]);

  const uploadFile = () => {
    if (!file) {
      setFeedback("Upload a video first, then click Next.");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);

    setFeedback("");
    setPhase("uploading");
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${appConfig.apiBaseUrl}/videos/upload`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const percent = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100),
      );
      setUploadProgress(percent);
    };

    xhr.onerror = () => {
      setFeedback("Upload failed. Please check your connection and try again.");
      setPhase("prepare");
    };

    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || "{}");

        if (xhr.status >= 200 && xhr.status < 300 && payload?.data?.uploadId) {
          setUploadSession(payload.data);
          setUploadProgress(100);
          setPhase("prepare");
          setTimeout(
            () => setShowSettingsModal(true),
            appConfig.settingsModalDelayMs,
          );
          return;
        }

        const message = payload?.message || "Upload failed. Please try again.";
        setFeedback(message);
      } catch {
        setFeedback("Upload failed. Unexpected server response.");
      }

      setPhase("prepare");
    };

    xhr.send(formData);
  };

  const clearPoll = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (progressDebounceRef.current) {
      clearTimeout(progressDebounceRef.current);
      progressDebounceRef.current = null;
    }
  };

  const setCompressionProgressDebounced = (nextProgress) => {
    const clamped = Math.min(100, Math.max(0, nextProgress));

    if (progressDebounceRef.current) {
      clearTimeout(progressDebounceRef.current);
    }

    progressDebounceRef.current = setTimeout(() => {
      setCompressionProgress(clamped);
      progressDebounceRef.current = null;
    }, appConfig.progressDebounceMs);
  };

  const startCompressionJob = async () => {
    const response = await fetch(`${appConfig.apiBaseUrl}/videos/compress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uploadId: uploadSession.uploadId,
        targetSize,
        targetUnit,
        quality,
        resolution,
      }),
    });

    if (!response.ok) {
      let message = "Compression failed. Please try again.";
      try {
        const payload = await response.json();
        if (payload?.message) {
          message = payload.message;
        }
      } catch {
        // Keep fallback error text.
      }

      throw new Error(message);
    }

    const payload = await response.json();
    const jobId = payload?.data?.jobId;

    if (!jobId) {
      throw new Error("Failed to start compression job.");
    }

    return jobId;
  };

  const pollCompressionStatus = (jobId) => {
    return new Promise((resolve, reject) => {
      const run = async () => {
        try {
          const response = await fetch(
            `${appConfig.apiBaseUrl}/videos/compress/${jobId}`,
          );
          if (!response.ok) {
            throw new Error("Could not read compression progress.");
          }

          const payload = await response.json();
          const data = payload?.data;
          if (!data) {
            throw new Error("Invalid compression status response.");
          }

          const nextProgress = Number(data.progress) || 0;
          setCompressionProgressDebounced(nextProgress);

          if (data.status === "completed") {
            clearPoll();
            resolve(data);
            return;
          }

          if (data.status === "failed") {
            clearPoll();
            reject(new Error(data.error || "Compression failed."));
          }
        } catch (error) {
          clearPoll();
          reject(error);
        }
      };

      run();
      pollIntervalRef.current = setInterval(
        run,
        appConfig.compressionPollIntervalMs,
      );
    });
  };

  const downloadCompressedFile = async (jobId) => {
    const response = await fetch(
      `${appConfig.apiBaseUrl}/videos/compress/${jobId}/download`,
    );

    if (!response.ok) {
      let message = "Download failed. Please try again.";
      try {
        const payload = await response.json();
        if (payload?.message) {
          message = payload.message;
        }
      } catch {
        // Keep fallback error text.
      }

      throw new Error(message);
    }

    const compressedBlob = await response.blob();
    const downloadUrl = URL.createObjectURL(compressedBlob);
    const anchor = document.createElement("a");
    const downloadName = parseFileName(response);

    anchor.href = downloadUrl;
    anchor.download = downloadName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);

    const originalSize =
      Number(response.headers.get("x-original-size")) || file.size;

    setResultMeta({
      originalSize,
      compressedSize: compressedBlob.size,
    });
  };

  const parseFileName = (response) => {
    const disposition = response.headers.get("content-disposition") || "";
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
    return asciiMatch?.[1] || "compressed-video.mp4";
  };

  const saveAndDownload = async () => {
    if (!targetSize || Number(targetSize) <= 0) {
      setTargetSizeError("Enter a valid target file size.");
      return;
    }

    if (!file || !uploadSession?.uploadId) {
      setFeedback("Please upload the file first.");
      return;
    }

    setTargetSizeError("");
    setShowSettingsModal(false);
    setPhase("compressing");
    setCompressionProgress(0);
    setFeedback("");

    try {
      const jobId = await startCompressionJob();
      await pollCompressionStatus(jobId);
      await downloadCompressedFile(jobId);

      setPhase("done");
    } catch (error) {
      clearPoll();
      setFeedback(error.message || "Compression failed. Please try again.");
      setPhase("prepare");
    }
  };

  const resetFlow = () => {
    clearPoll();
    setFile(null);
    setPhase("prepare");
    setUploadProgress(0);
    setCompressionProgress(0);
    setUploadSession(null);
    setResultMeta(null);
    setShowSettingsModal(false);
    setTargetSize("");
    setTargetUnit(appConfig.defaultTargetUnit);
    setQuality(appConfig.defaultQuality);
    setResolution(appConfig.defaultResolution);
    setFeedback("");
    setTargetSizeError("");
  };

  const stats = [
    `Supports ${appConfig.acceptedFormatsLabel}`,
    `Up to ${appConfig.maxUploadSizeLabel} per upload`,
    "No signup required",
  ];

  return (
    <section id="compressor" className="relative z-10 -mt-8 mb-24 w-full px-4">
      <div className="mx-auto w-full max-w-4xl">
        <Motion.div
          className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50"
          layout
        >
          <AnimatePresence mode="wait">
            {phase === "prepare" && (
              <Motion.div
                key="prepare"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 md:p-8"
              >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                      Step 1 of 3
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-slate-900">
                      Upload and Choose Basics
                    </h3>
                  </div>
                  {file && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      File ready
                    </span>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div
                    className="cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center transition-colors hover:bg-blue-50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <UploadFile className="text-3xl" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">
                      Drag and drop your video
                    </h4>
                    <p className="mt-2 text-sm text-slate-500">
                      {appConfig.acceptedFormatsLabel} up to{" "}
                      {appConfig.maxUploadSizeLabel}
                    </p>

                    <input
                      type="file"
                      className="hidden"
                      accept={`${appConfig.acceptFileInputValue},video/*`}
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
                      <Settings />
                      Quick settings before next
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Quality
                        </label>
                        <select
                          value={quality}
                          onChange={(e) => setQuality(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        >
                          {appConfig.qualityOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Resolution
                        </label>
                        <select
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        >
                          {appConfig.resolutionOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {file ? (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <File className="text-lg" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatSize(file.size)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        Upload a file to continue.
                      </p>
                    )}

                    <button
                      onClick={uploadFile}
                      disabled={!file}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Next
                      <Rocket className="text-sm" />
                    </button>

                    {uploadSession?.uploadId && (
                      <p className="mt-3 text-sm font-medium text-emerald-600">
                        Uploaded successfully. Continue with compression
                        settings.
                      </p>
                    )}

                    {feedback && (
                      <p className="mt-3 text-sm font-medium text-rose-600">
                        {feedback}
                      </p>
                    )}
                  </div>
                </div>
              </Motion.div>
            )}

            {phase === "uploading" && (
              <Motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-10 text-center md:p-14"
              >
                <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-slate-50 p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                    Step 2 of 3
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    Uploading... please wait
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Upload progress is measured from real bytes sent to server.
                  </p>

                  <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <Motion.div
                      className="h-full rounded-full bg-blue-600"
                      initial={{ width: "0%" }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: "easeOut", duration: 0.2 }}
                    />
                  </div>
                  <p className="mt-3 text-lg font-bold text-slate-800">
                    {uploadProgress}%
                  </p>

                  {uploadProgress >= 100 && (
                    <p className="mt-2 text-sm font-medium text-emerald-600">
                      Upload complete. Opening settings...
                    </p>
                  )}
                </div>
              </Motion.div>
            )}

            {phase === "compressing" && (
              <Motion.div
                key="compressing"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-10 text-center md:p-14"
              >
                <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-slate-50 p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                    Processing
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    Compressing your video
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Real-time FFmpeg progress while generating your smaller
                    file.
                  </p>

                  <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <Motion.div
                      className="h-full rounded-full bg-blue-600"
                      initial={{ width: "0%" }}
                      animate={{ width: `${compressionProgress}%` }}
                      transition={{ ease: "easeOut", duration: 0.25 }}
                    />
                  </div>
                  <p className="mt-3 text-lg font-bold text-slate-800">
                    {compressionProgress}%
                  </p>
                </div>
              </Motion.div>
            )}

            {phase === "done" && (
              <Motion.div
                key="done"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-10 text-center md:p-14"
              >
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle className="text-5xl" />
                </div>
                <h3 className="text-3xl font-bold text-slate-800">
                  Compressed File Downloaded
                </h3>
                <p className="mx-auto mt-3 max-w-lg text-slate-600">
                  Compression completed and your smaller file was downloaded.
                  You can compress another one anytime.
                </p>

                <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Final settings used
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <p className="text-slate-600">Target size</p>
                    <p className="text-right font-semibold text-slate-900">
                      {estimatedOutput}
                    </p>
                    <p className="text-slate-600">Quality</p>
                    <p className="text-right font-semibold text-slate-900">
                      {quality}
                    </p>
                    <p className="text-slate-600">Resolution</p>
                    <p className="text-right font-semibold text-slate-900">
                      {resolution}
                    </p>
                    <p className="text-slate-600">Original size</p>
                    <p className="text-right font-semibold text-slate-900">
                      {formatSize(resultMeta?.originalSize || file?.size || 0)}
                    </p>
                    <p className="text-slate-600">Compressed size</p>
                    <p className="text-right font-semibold text-emerald-700">
                      {formatSize(resultMeta?.compressedSize || 0)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <button
                    onClick={resetFlow}
                    className="w-full rounded-xl bg-slate-900 px-8 py-4 font-bold text-white transition-all hover:bg-slate-800 sm:w-auto"
                  >
                    Compress Another
                  </button>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </Motion.div>

        <AnimatePresence>
          {showSettingsModal && (
            <Motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10 }}
                className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                  Step 3 of 3
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  Compression Settings
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Choose your target file size, then save to download your
                  compressed file.
                </p>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {file?.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Original size: {file ? formatSize(file.size) : "-"}{" "}
                    {uploadSession?.uploadId ? "- Uploaded" : ""}
                  </p>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Target File Size
                  </label>
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <input
                      type="number"
                      min="1"
                      placeholder="Example: 50"
                      value={targetSize}
                      onChange={(e) => {
                        setTargetSize(e.target.value);
                        if (targetSizeError) {
                          setTargetSizeError("");
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <select
                      value={targetUnit}
                      onChange={(e) => setTargetUnit(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      {appConfig.targetUnitOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  {targetSizeError && (
                    <p className="mt-2 text-sm font-medium text-rose-600">
                      {targetSizeError}
                    </p>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="text-slate-600">Quality</p>
                  <p className="text-right font-semibold text-slate-900">
                    {quality}
                  </p>
                  <p className="text-slate-600">Resolution</p>
                  <p className="text-right font-semibold text-slate-900">
                    {resolution}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      setPhase("prepare");
                    }}
                    className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={saveAndDownload}
                    disabled={
                      !uploadSession?.uploadId || phase === "compressing"
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    <Disk />
                    Save and Download
                  </button>
                </div>
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((stat, idx) => (
            <Motion.div
              key={stat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 * idx, duration: 0.45 }}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
            >
              {stat}
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

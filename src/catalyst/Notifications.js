"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, Trash2, Check, AlertTriangle, Info } from "lucide-react";

const STORAGE_KEY_NOTIFICATIONS = "catalystNotifications";
const STORAGE_KEY_UNREAD = "unreadCount";
const STORAGE_KEY_IGNORED = "ignoredNotifications";
const STORAGE_KEY_LAST_SNAPSHOT = "lastApplicationsSnapshot"; // ← key change: store minimal snapshot

const CatalystNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [ignoredNotifications, setIgnoredNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IGNORED);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const notificationsRef = useRef(null);
  // Stores { [id]: pipelineStage } — minimal snapshot, not full objects
  const lastSnapshotRef = useRef(null);
  const isSeededRef = useRef(false);

  // ── Rehydrate on mount ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem(
        STORAGE_KEY_NOTIFICATIONS,
      );
      const savedUnread = localStorage.getItem(STORAGE_KEY_UNREAD);
      const savedSnapshot = localStorage.getItem(STORAGE_KEY_LAST_SNAPSHOT);

      if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
      if (savedUnread) setUnreadCount(parseInt(savedUnread) || 0);
      if (savedSnapshot) {
        lastSnapshotRef.current = JSON.parse(savedSnapshot);
        isSeededRef.current = true;
      }
    } catch (e) {
      console.warn("CatalystNotifications: failed to rehydrate", e);
    }
  }, []);

  // ── Persist notifications + unread count ──────────────────────────────────
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY_NOTIFICATIONS,
      JSON.stringify(notifications),
    );
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_UNREAD, String(unreadCount));
  }, [unreadCount]);

  // ── Persist ignored set ───────────────────────────────────────────────────
  useEffect(() => {
    if (ignoredNotifications.size > 0) {
      localStorage.setItem(
        STORAGE_KEY_IGNORED,
        JSON.stringify([...ignoredNotifications]),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY_IGNORED);
    }
  }, [ignoredNotifications]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getNotificationStyle = (type) => {
    switch (type) {
      case "new_application":
        return {
          borderLeftColor: "#4caf50",
          title: "New Application",
          icon: <Info size={16} color="#4caf50" />,
        };
      case "status_change":
        return {
          borderLeftColor: "#2196f3",
          title: "Status Update",
          icon: <AlertTriangle size={16} color="#2196f3" />,
        };
      default:
        return {
          borderLeftColor: "#9e9e9e",
          title: "Notification",
          icon: <Bell size={16} color="#9e9e9e" />,
        };
    }
  };

  const getStageColor = (stage) => {
    switch (stage?.toLowerCase()) {
      case "support approved":
      case "active support":
        return { backgroundColor: "#2e7d32", color: "#fff" };
      case "support declined":
      case "closed":
        return { backgroundColor: "#d32f2f", color: "#fff" };
      case "under review":
        return { backgroundColor: "#795548", color: "#fff" };
      case "evaluation":
        return { backgroundColor: "#388e3c", color: "#fff" };
      case "due diligence":
        return { backgroundColor: "#4e342e", color: "#fff" };
      default:
        return { backgroundColor: "#5d4037", color: "#fff" };
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const date = ts instanceof Date ? ts : new Date(ts);
    const hours = (Date.now() - date.getTime()) / 3600000;
    if (hours < 1) return `${Math.floor(hours * 60)}m ago`;
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // ── Core diff logic ───────────────────────────────────────────────────────
  // NOTE: `ignoredNotifications` is intentionally NOT in the dependency array.
  // We read it via a ref to avoid recreating this function (which would reset
  // the window binding and could cause spurious re-checks).
  const ignoredRef = useRef(ignoredNotifications);
  useEffect(() => {
    ignoredRef.current = ignoredNotifications;
  }, [ignoredNotifications]);

  const checkForChanges = useCallback((currentApplications) => {
    if (!Array.isArray(currentApplications) || currentApplications.length === 0)
      return;

    // Build a minimal snapshot: { [id]: pipelineStage }
    const currentSnapshot = {};
    currentApplications.forEach((app) => {
      const id = app.id || app.smeId || app.docId;
      const stage = app.pipelineStage || app.currentStatus || app.status || "";
      if (id) currentSnapshot[id] = stage;
    });

    // First call ever — just seed the snapshot, generate no notifications
    if (!isSeededRef.current || lastSnapshotRef.current === null) {
      isSeededRef.current = true;
      lastSnapshotRef.current = currentSnapshot;
      localStorage.setItem(
        STORAGE_KEY_LAST_SNAPSHOT,
        JSON.stringify(currentSnapshot),
      );
      return;
    }

    const lastSnapshot = lastSnapshotRef.current;

    // Check if snapshot actually changed before doing any work
    const snapshotChanged =
      Object.keys(currentSnapshot).length !==
        Object.keys(lastSnapshot).length ||
      Object.entries(currentSnapshot).some(
        ([id, stage]) => lastSnapshot[id] !== stage,
      );

    if (!snapshotChanged) return; // ← exits early on every re-render with same data

    const newNotifications = [];
    const ignored = ignoredRef.current;
    const now = Date.now();

    // New applications (id not in last snapshot)
    currentApplications.forEach((app) => {
      const id = app.id || app.smeId || app.docId;
      if (!id || lastSnapshot[id] !== undefined) return;

      const notifId = `new-${id}-${now}`;
      if (ignored.has(notifId)) return;

      newNotifications.push({
        id: notifId,
        type: "new_application",
        message: `New support application received from ${app.smeName || app.name || "an SMSE"}`,
        smeName: app.smeName || app.name,
        stage: app.pipelineStage || app.currentStatus || "Application Received",
        timestamp: new Date(),
        read: false,
        applicationId: id,
      });
    });

    // Stage changes (id exists in both snapshots but stage differs)
    currentApplications.forEach((app) => {
      const id = app.id || app.smeId || app.docId;
      const currentStage =
        app.pipelineStage || app.currentStatus || app.status || "";
      if (!id || lastSnapshot[id] === undefined) return; // new app — handled above
      if (lastSnapshot[id] === currentStage) return; // no change

      const notifId = `status-${id}-${now}`;
      if (ignored.has(notifId)) return;

      newNotifications.push({
        id: notifId,
        type: "status_change",
        message: `Application status changed from "${lastSnapshot[id]}" to "${currentStage}"`,
        smeName: app.smeName || app.name,
        stage: currentStage,
        oldStage: lastSnapshot[id],
        timestamp: new Date(),
        read: false,
        applicationId: id,
      });
    });

    // Persist new snapshot regardless of whether we generated notifications
    lastSnapshotRef.current = currentSnapshot;
    localStorage.setItem(
      STORAGE_KEY_LAST_SNAPSHOT,
      JSON.stringify(currentSnapshot),
    );

    if (newNotifications.length === 0) return;

    setNotifications((prev) =>
      [
        ...newNotifications,
        ...prev.filter((n) => !ignoredRef.current.has(n.id)),
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50),
    );
    setUnreadCount((prev) => prev + newNotifications.length);
  }, []); // ← stable: no deps that change on re-render

  // ── Expose to window (stable reference now) ───────────────────────────────
  useEffect(() => {
    window.catalystNotifications = { checkForChanges };
    return () => {
      delete window.catalystNotifications;
    };
  }, [checkForChanges]);

  // ── Click outside ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
        setShowClearAllConfirm(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setIgnoredNotifications((prev) => {
      const s = new Set(prev);
      notifications.forEach((n) => s.add(n.id));
      return s;
    });
    setNotifications([]);
    setUnreadCount(0);
    setShowClearAllConfirm(false);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => {
      const wasUnread = notifications.find((n) => n.id === id)?.read === false;
      return wasUnread ? Math.max(0, prev - 1) : prev;
    });
  };

  const deleteNotification = (id) => {
    const wasUnread = notifications.find((n) => n.id === id)?.read === false;
    setIgnoredNotifications((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative inline-block mr-4" ref={notificationsRef}>
      <button
        className={`relative p-2 rounded-full transition-all duration-300 text-[#333] border-none cursor-pointer hover:bg-black/5 hover:scale-110 ${showNotifications ? "bg-black/10" : "bg-transparent"}`}
        onClick={() => setShowNotifications((v) => !v)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-3 -right-1.5 bg-[#ff4444] text-white rounded-full w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-full w-[420px] max-h-[500px] bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] z-[1000] mt-2.5 overflow-hidden origin-top-right animate-[fadeIn_0.2s_ease-out]">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h3 className="m-0 text-base font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-1 text-xs text-[#555] px-2 py-1 rounded bg-transparent border-none cursor-pointer transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={16} /> Mark all as read
                </button>
                <button
                  onClick={() => setShowClearAllConfirm(true)}
                  className="flex items-center gap-1 text-xs text-[#555] px-2 py-1 rounded bg-transparent border-none cursor-pointer transition-all hover:bg-gray-100"
                >
                  <Trash2 size={16} /> Clear all
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100" />

          <div className="max-h-[400px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="flex justify-center p-5 text-[#888] text-sm italic">
                <p className="m-0">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                const stageStyle = getStageColor(notification.stage);
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start p-4 border-b border-gray-50 transition-all cursor-pointer relative gap-3 border-l-[3px] hover:bg-gray-50 ${notification.read ? "bg-white" : "bg-[#f8f9fa]"}`}
                    style={{ borderLeftColor: style.borderLeftColor }}
                    onClick={() =>
                      !notification.read && markAsRead(notification.id)
                    }
                  >
                    <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm text-[#333]">
                          {style.title}
                        </span>
                        <span className="text-xs text-[#888]">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="m-0 mb-2 text-sm leading-snug break-words text-[#555]">
                        {notification.message}
                      </p>
                      {notification.smeName && (
                        <p className="mt-1 mb-2 text-[13px] text-[#666]">
                          <strong>SMSE:</strong> {notification.smeName}
                        </p>
                      )}
                      {notification.stage && (
                        <div className="flex items-center my-2 text-[13px] gap-1.5">
                          <span className="text-[#666]">Current Stage:</span>
                          <span
                            className="px-2 py-0.5 rounded-xl text-xs font-medium"
                            style={{
                              backgroundColor: stageStyle.backgroundColor,
                              color: stageStyle.color,
                            }}
                          >
                            {notification.stage}
                          </span>
                        </div>
                      )}
                      {!notification.read && (
                        <div className="flex gap-2 text-xs text-[#888] items-center mt-2">
                          <span className="inline-block w-2 h-2 bg-[#2196f3] rounded-full" />
                          <span className="text-[#2196f3] font-medium">
                            Unread
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      className="bg-transparent border-none cursor-pointer text-[#888] p-1 self-start transition-colors flex-shrink-0 rounded hover:bg-gray-100 hover:text-[#ff4444]"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      aria-label="Delete notification"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[2000] backdrop-blur-sm p-5">
          <div className="bg-white rounded-[20px] p-10 w-full max-w-[400px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-[#e0e0e0] flex flex-col items-center text-center overflow-visible animate-[slideUp_0.3s_ease-out]">
            <div className="mb-5 flex justify-center">
              <AlertTriangle size={48} className="text-[#ff9800]" />
            </div>
            <h3 className="m-0 mb-4 text-[#333] text-2xl font-semibold leading-snug">
              Clear All Notifications?
            </h3>
            <p className="m-0 mb-8 text-[#666] leading-relaxed text-base max-w-[300px]">
              Are you sure you want to clear all notifications?
            </p>
            <div className="flex gap-4 justify-center w-full max-w-[300px]">
              <button
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 min-w-[120px] py-3.5 px-8 rounded-[10px] cursor-pointer text-[15px] font-semibold transition-all bg-[#f8f9fa] text-[#333] border-2 border-[#e0e0e0] hover:bg-[#e9ecef] hover:border-[#d0d0d0] hover:-translate-y-0.5"
              >
                Cancel
              </button>
              <button
                onClick={clearAllNotifications}
                className="flex-1 min-w-[120px] py-3.5 px-8 rounded-[10px] cursor-pointer text-[15px] font-semibold transition-all bg-[#dc3545] text-white border-2 border-[#dc3545] hover:bg-[#c82333] hover:border-[#c82333] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(220,53,69,0.3)]"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(30px) scale(0.95) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
    </div>
  );
};

export default CatalystNotifications;

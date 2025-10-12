"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Clock,
  Calendar,
  RepeatIcon,
  ArrowUpDown,
} from "lucide-react";
import api from "@/utils/api";
import { ResizablePanelLayout } from "@/components/layout/ResizablePanelLayout";

import TimeSlotOperations from "@/components/time-slot/TimeSlotOperations";
import ItemList from "@/components/common/ItemList";
import SortDialog from "@/components/helpers/SortDialog";

import styles from "@/app/styles/features/time-slots/TimeSlots.module.css";
import layoutStyles from "@/app/styles/components/layout/Layout.module.css";
import itemStyles from "@/app/styles/components/layout/ItemLayout.module.css";
import statusStyles from "@/app/styles/components/status/Status.module.css";
import errorStyles from "@/app/styles/components/status/Error.module.css";

export default function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState("start_time");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadTimeSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/time-slots");
      setTimeSlots(res.data);
    } catch (err) {
      console.error("Error loading time slots:", err);
      setError("Failed to load time slots. Are you logged in?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      loadTimeSlots();
    } else {
      setIsAuthenticated(false);
    }
  }, [loadTimeSlots]);

  const formatDuration = (minutes) => {
    if (!minutes) return "";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const formatMinutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  const formatRecurrence = (recurrence) => {
    if (!recurrence) return "No recurrence";

    switch (recurrence.frequency) {
      case "Daily":
        return "Every day";
      case "Custom":
        const days = recurrence.specific_days?.join(", ") || "";
        const interval = recurrence.interval;
        return `Every ${interval} day(s) on ${days}`;
      default:
        return "No recurrence";
    }
  };

  const sortTimeSlots = (slotsToSort) => {
    return [...slotsToSort].sort((a, b) => {
      let comparison = 0;

      switch (sortType) {
        case "start_time":
          comparison = Number(a.start_time) - Number(b.start_time);
          break;
        case "duration":
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case "type":
          comparison = a.slot_type.localeCompare(b.slot_type);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const renderTimeSlotContent = (slot) => {
    const endMinutes = (slot.start_minutes + (slot.end_minutes - slot.start_minutes)) % 1440;

    return (
      <div className={itemStyles.itemInfo}>
        <p className={itemStyles.itemTitle}>
          {formatMinutesToTime(slot.start_minutes)} -{" "}
          {formatMinutesToTime(slot.end_minutes)}
        </p>
      </div>
    );
  };

  const renderTimeSlotBadges = (slot) => (
    <span
      className={`${statusStyles.itemState} ${styles[`type${slot.slot_type}`]}`}
    >
      {slot.slot_type === "Break" ? "Break" : "Working Hours"}
    </span>
  );

  const renderLeftPanel = () => (
    <>
      <div className={styles.buttonsContainer}>
        <button
          className="control-button"
          style={{
            flex: "1",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
          }}
          onClick={() => setShowForm(true)}
          disabled={loading}
        >
          {loading ? "Loading..." : "Add Time Slot"}
        </button>

        <button
          className="control-button"
          onClick={() => setShowSortDialog(true)}
        >
          <ArrowUpDown size={16} />
          Sort
        </button>
      </div>

      {error && (
        <div className={errorStyles.container}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingMessage}>Loading time slots...</div>
      ) : (
        <ItemList
          items={sortTimeSlots(timeSlots)}
          selectedId={selectedTimeSlot?.id}
          onSelect={setSelectedTimeSlot}
          renderBadges={renderTimeSlotBadges}
          renderContent={renderTimeSlotContent}
          containerClassName={itemStyles.timeSlotContainer}
          itemClassName={itemStyles.itemRow}
        />
      )}
    </>
  );

  const renderRightPanel = () =>
    selectedTimeSlot && (
      <>
        <div className={itemStyles.selectedItemHeader}>
          <h2 className={itemStyles.selectedItemTitle}>Time Slot Details</h2>
          <span
            className={`${statusStyles.itemState} ${
              styles[`type${selectedTimeSlot.slot_type}`]
            }`}
          >
            {selectedTimeSlot.slot_type === "Break" ? "Break" : "Working Hours"}
          </span>
        </div>

        <div className={itemStyles.itemMetadata}>
          <div className={itemStyles.metadataItem}>
            <Calendar size={16} />
            <span>
              Start time: {formatMinutesToTime(selectedTimeSlot.start_minutes)}
            </span>
          </div>
          <div className={itemStyles.metadataItem}>
            <Clock size={16} />
            <span>Duration: {formatDuration(selectedTimeSlot.end_minutes - selectedTimeSlot.start_minutes)}</span>
          </div>
          <div className={itemStyles.metadataItem}>
            <RepeatIcon size={16} />
            <span>
              Recurrence: {formatRecurrence(selectedTimeSlot.recurrence)}
            </span>
          </div>
        </div>

        <TimeSlotOperations
          timeSlot={selectedTimeSlot}
          showEditForm={showEditForm}
          setShowEditForm={setShowEditForm}
          onUpdate={async () => {
            await loadTimeSlots();
            const updatedSlots = await api.get("/time-slots");
            const updatedSlot = updatedSlots.data.find(
              (t) => t.id === selectedTimeSlot.id
            );
            setSelectedTimeSlot(updatedSlot || null);
          }}
          onDelete={async (slotId) => {
            setSelectedTimeSlot(null);
            await loadTimeSlots();
          }}
        />
      </>
    );

  if (!isAuthenticated) {
    return (
      <div className={layoutStyles.pageContainer}>
        <p>Please login to manage time slots.</p>
      </div>
    );
  }

  return (
    <>
      <ResizablePanelLayout
        leftPanel={renderLeftPanel()}
        rightPanel={renderRightPanel()}
        minLeftWidth={250}
        maxLeftWidth={800}
        minRightWidth={400}
      />

      {showForm && (
        <TimeSlotOperations
          showAddForm={showForm}
          onCloseForm={() => setShowForm(false)}
          onUpdate={async () => {
            await loadTimeSlots();
            setShowForm(false);
          }}
        />
      )}

      <SortDialog
        isOpen={showSortDialog}
        onClose={() => setShowSortDialog(false)}
        sortType={sortType}
        setSortType={setSortType}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        options={[
          { value: "start_time", label: "Start Time" },
          { value: "duration", label: "Duration" },
          { value: "type", label: "Type" },
        ]}
      />
    </>
  );
}

import React, { useState } from "react";
import { Edit, Trash } from "lucide-react";
import api from "@/utils/api";

import TimeSlotForm from "./TimeSlotForm";

import errorStyles from "@/app/styles/components/status/Error.module.css";

const TimeSlotOperations = ({
  timeSlot,
  onUpdate,
  onDelete,
  showAddForm,
  showEditForm,
  setShowEditForm,
  onCloseForm,
  selectedTime = null,
  popupMode = false,
  onClosePopup,
  hideScheduleTask = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddTimeSlot = async (slotData) => {
    setLoading(true);
    setError(null);

    const startMinutes = parseInt(slotData.start_minutes, 10);
    const endMinutes = parseInt(slotData.end_minutes, 10);

    if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
      setError("Invalid time slot. End time must be after start time.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/time-slots", {
        start_minutes: startMinutes,
        end_minutes: endMinutes,
        slot_type: slotData.slot_type,
        recurrence: {
          frequency: slotData.recurrence.frequency,
          interval: parseInt(slotData.recurrence.interval),
          specific_days: slotData.recurrence.specific_days || [],
        },
      });
      onUpdate && onUpdate();
      onCloseForm && onCloseForm();
    } catch (error) {
      console.error("Error adding time slot:", error);
      setError(error.message || "Failed to add time slot");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTimeSlot = async (slotData) => {
    setLoading(true);
    setError(null);

    const startMinutes = parseInt(slotData.start_minutes, 10);
    const endMinutes = parseInt(slotData.end_minutes, 10);

    if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
      setError("Invalid time slot. End time must be after start time.");
      setLoading(false);
      return;
    }

    try {
      await api.put(`/time-slots/${timeSlot.id}`, {
        start_minutes: startMinutes,
        end_minutes: endMinutes,
        slot_type: slotData.slot_type,
        recurrence: {
          frequency: slotData.recurrence.frequency,
          interval: parseInt(slotData.recurrence.interval),
          specific_days: slotData.recurrence.specific_days || [],
        },
      });
      onUpdate && onUpdate();
      setShowEditForm(false);
      if (popupMode && onClosePopup) {
        onClosePopup();
      }
    } catch (error) {
      console.error("Error updating time slot:", error);
      setError(error.message || "Failed to update time slot");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setShowEditForm(true);
  };

  const handleDeleteTimeSlot = async () => {
    if (!window.confirm("Are you sure you want to delete this time slot?"))
      return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/time-slots/${timeSlot.id}`);
      if (onDelete) {
        onDelete(timeSlot.id);
      }
      if (popupMode && onClosePopup) {
        onClosePopup();
      }
    } catch (error) {
      console.error("Error deleting time slot:", error);
      setError(error.message || "Failed to delete time slot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className={errorStyles.container}>{error}</div>}

      {showAddForm ? (
        <TimeSlotForm
          isOpen={true}
          onClose={onCloseForm}
          onSubmit={handleAddTimeSlot}
          selectedTime={selectedTime}
        />
      ) : (
        <>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button
              onClick={handleEditClick}
              disabled={loading}
              className="icon-action-button"
              title="Edit time slot"
            >
              <Edit size={16} />
              {popupMode && <span style={{ marginLeft: "4px" }}>Edit</span>}
            </button>

            <button
              onClick={handleDeleteTimeSlot}
              disabled={loading}
              className="icon-action-button delete"
              title="Delete time slot"
            >
              <Trash size={16} />
              {popupMode && <span style={{ marginLeft: "4px" }}>Delete</span>}
            </button>
          </div>

          {!hideScheduleTask && showEditForm && (
            <TimeSlotForm
              isOpen={true}
              onClose={() => {
                setShowEditForm(false);
                if (popupMode && onCloseForm) {
                  onCloseForm();
                }
              }}
              onSubmit={handleUpdateTimeSlot}
              initialData={timeSlot}
            />
          )}
        </>
      )}
    </div>
  );
};

export default TimeSlotOperations;

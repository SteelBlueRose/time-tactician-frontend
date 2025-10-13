"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { startOfWeek, addWeeks, subWeeks } from "date-fns";
import { Plus, Calendar, AlertCircle } from "lucide-react";

import { useLoading } from "@/components/layout/LoadingContext";
import { useSmartScheduler } from "@/app/hooks/useSmartScheduler";
import api from "@/utils/api";

import DatePicker from "@/components/helpers/DatePicker";
import TimeGrid from "@/components/planner/TimeGrid";
import TimeScaleControls from "@/components/planner/TimeScaleControls";
import TimeRangeSelector from "@/components/planner/TimeRangeSelector";
import TimeSlotOperations from "@/components/time-slot/TimeSlotOperations";
import TaskScheduleForm from "@/components/planner/TaskScheduleForm";
import SmartSchedulePreview from "@/components/planner/SmartSchedulePreview";

import styles from "@/app/styles/features/planner/Planner.module.css";
import controlStyles from "@/app/styles/features/planner/TimeControls.module.css";
import dialogStyles from "@/app/styles/components/dialog/Dialog.module.css";
import errorStyles from "@/app/styles/components/status/Error.module.css";

export default function PlannerPage() {
  const { showLoading, hideLoading } = useLoading();
  const { runScheduler } = useSmartScheduler();
  const [timeSlots, setTimeSlots] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [scale, setScale] = useState(60);
  const [timeRange, setTimeRange] = useState("working");
  const [customRange, setCustomRange] = useState({
    start: "09:00",
    end: "17:00",
  });
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [isPastTimeSlot, setIsPastTimeSlot] = useState(false);
  const [clickedCellTime, setClickedCellTime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [popupPosition, setPopupPosition] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    showBreaks: true,
    showWorkingHours: true,
  });
  const [showSmartSchedulePreview, setShowSmartSchedulePreview] =
    useState(false);
  const [optimizedSchedule, setOptimizedSchedule] = useState(null);
  const [includeScheduledTasks, setIncludeScheduledTasks] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadTimeSlots = async () => {
    showLoading("Loading time slots...");
    try {
      const res = await api.get("/time-slots");
      const slots = Array.isArray(res.data) ? res.data : [];
      const slotsWithDuration = slots.map((slot) => ({
        ...slot,
        duration: slot.end_minutes - slot.start_minutes,
      }));
      setTimeSlots(slotsWithDuration);
    } catch (error) {
      console.error("Error loading time slots:", error);
      setError("Failed to load time slots");
    } finally {
      hideLoading();
    }
  };

  const loadTasks = async () => {
    showLoading("Loading tasks...");
    try {
      const res = await api.get("/tasks?status=incomplete");
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error loading tasks:", error);
      setError("Failed to load tasks");
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      loadTimeSlots();
      loadTasks();
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    }

    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPopup]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && !event.target.closest(".filter-dropdown")) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const handlePreviousWeek = () => {
    const newWeek = subWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
  };

  const handleRangeChange = (newRange) => {
    setTimeRange(newRange);
    if (newRange !== "custom") {
      setCustomRange({
        start: "09:00",
        end: "17:00",
      });
    }
  };

  const handleSlotSelect = (slot, event, isPastTime, dayDate) => {
    setSelectedSlot(slot);
    setSelectedTime(null);
    setIsPastTimeSlot(isPastTime);

    let slotTime;
    if (dayDate) {
      slotTime = new Date(dayDate);
      slotTime.setHours(Math.floor(slot.start_minutes / 60));
      slotTime.setMinutes(slot.start_minutes % 60);
      setClickedCellTime(slotTime);
    }

    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      setPopupPosition({
        x: rect.right,
        y: rect.top,
      });
      setShowPopup(true);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setSelectedSlot(null);
    setShowScheduleForm(true);
  };

  const handleSlotDeselect = () => {
    setSelectedSlot(null);
    setSelectedTime(null);
    setShowPopup(false);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    setSelectedTime(null);
    setCurrentWeek(weekStart);
    setShowDatePicker(false);
  };

  const showPastTimeNotification = () => {
    setNotification({
      message: "Cannot schedule tasks in the past",
      type: "error",
    });

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSmartSchedule = async () => {
    if (!timeSlots.length || !tasks.length) {
      setNotification({
        message: "Need tasks and time slots to create a schedule",
        type: "error",
      });

      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const workingHoursSlots = timeSlots.filter(
      (slot) => slot.slot_type === "WorkingHours"
    );

    if (workingHoursSlots.length === 0) {
      setNotification({
        message:
          "Need at least one working hours time slot to create a schedule",
        type: "error",
      });

      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const currentTime = Date.now();
    const roundToMinutes = 5;
    const timeBufferMinutes = 0;

    const roundedCurrentTime =
      Math.ceil(currentTime / (roundToMinutes * 60 * 1000)) *
      (roundToMinutes * 60 * 1000);
    const bufferTime = roundedCurrentTime + timeBufferMinutes * 60 * 1000;

    const preliminaryTasks = tasks.filter(
      (task) =>
        task.state !== "Completed" &&
        (!task.subtask_ids || task.subtask_ids.length === 0)
    );

    const totalTaskDuration = preliminaryTasks.reduce((sum, task) => {
      if (
        !includeScheduledTasks &&
        task.time_slots &&
        task.time_slots.length > 0
      ) {
        return sum;
      }
      return sum + (task.estimated_time || 0);
    }, 0);

    const totalTaskDurationMs = totalTaskDuration * 60 * 1000;

    let totalAvailableTimeMs = 0;
    let daysChecked = 0;
    let searchEndTime = bufferTime;

    const startDate = new Date(bufferTime);
    startDate.setHours(0, 0, 0, 0);

    while (totalAvailableTimeMs < totalTaskDurationMs && daysChecked < 14) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + daysChecked);
      const dayStart = dayDate.getTime();
      const dayEnd = new Date(dayDate).setHours(23, 59, 59, 999);
      const daySearchStart = daysChecked === 0 ? bufferTime : dayStart;

      let dayAvailableTimeMs = 0;

      workingHoursSlots.forEach((slot) => {
        const slotRecurrence = slot.recurrence || { frequency: 'Daily', specific_days: [] };
        const dayOfWeek = dayDate.toLocaleDateString("en-US", {
          weekday: "long",
        });

        if (
          slotRecurrence.frequency === "Daily" ||
          (slotRecurrence.specific_days &&
            slotRecurrence.specific_days.includes(dayOfWeek))
        ) {
          const slotStart = new Date(dayDate);
          slotStart.setHours(Math.floor(slot.start_minutes / 60));
          slotStart.setMinutes(slot.start_minutes % 60);
          slotStart.setSeconds(0);
          slotStart.setMilliseconds(0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + slot.duration);

          const slotStartTime = slotStart.getTime();
          const slotEndTime = slotEnd.getTime();

          if (slotEndTime > daySearchStart && slotStartTime < dayEnd) {
            const adjustedStart = Math.max(slotStartTime, daySearchStart);
            const adjustedEnd = Math.min(slotEndTime, dayEnd);
            dayAvailableTimeMs += adjustedEnd - adjustedStart;
          }
        }
      });

      totalAvailableTimeMs += dayAvailableTimeMs;
      searchEndTime = dayEnd;
      daysChecked++;
    }

    let tasksToSchedule = tasks.filter(
      (task) =>
        task.state !== "Completed" &&
        (!task.subtask_ids || task.subtask_ids.length === 0)
    );

    if (!includeScheduledTasks) {
      tasksToSchedule = tasksToSchedule.filter(
        (task) => !task.time_slots || task.time_slots.length === 0
      );
    }

    if (tasksToSchedule.length === 0) {
      const message = includeScheduledTasks
        ? "No tasks available for scheduling"
        : "No unscheduled tasks available. Enable 'Include scheduled tasks' to reschedule all tasks.";

      setNotification({
        message: message,
        type: "error",
      });

      setTimeout(() => setNotification(null), 3000);
      return;
    }

    showLoading("Optimizing your schedule...");

    try {
      const result = runScheduler(tasksToSchedule, timeSlots, {
        includeScheduledTasks: includeScheduledTasks,
        coefficients: {
          alpha: 0.3,
          beta: 0.3,
          gamma: 0.1,
          delta: 0.1,
          epsilon: 0.1,
        },
      });

      if (!result) {
        console.error(
          "Smart scheduling failed: Scheduler returned null result"
        );

        setNotification({
          message: "Couldn't create a schedule. Check your time slots.",
          type: "error",
        });

        setTimeout(() => setNotification(null), 3000);
        hideLoading();
        return;
      }

      setOptimizedSchedule(result);
      setShowSmartSchedulePreview(true);
    } catch (error) {
      console.error("Error in smart scheduling:", error);

      setNotification({
        message:
          "Error creating schedule: " + (error.message || "Unknown error"),
        type: "error",
      });

      setTimeout(() => setNotification(null), 3000);
    } finally {
      hideLoading();
    }
  };

  const applyOptimizedSchedule = async () => {
    if (!optimizedSchedule || !optimizedSchedule.tasks) return;

    showLoading("Applying schedule changes...");

    try {
      const scheduleUpdates = optimizedSchedule.tasks
        .map((task) => {
          if (!task.segments || task.segments.length === 0) return null;
          const newTimeSlots = task.segments.map((segment) => ({
            start_time: new Date(segment.start).toISOString(),
            end_time: new Date(segment.end).toISOString(),
          }));

          return {
            id: task.id,
            time_slots: newTimeSlots,
          };
        })
        .filter(Boolean);

      if (scheduleUpdates.length > 0) {
        await api.put("/tasks/schedule", { tasks: scheduleUpdates });
        setNotification({
          message: `Schedule applied successfully.`,
          type: "success",
        });
        loadTasks(); // Refresh tasks to show new schedule
      } else {
        setNotification({
          message: "No schedule changes to apply.",
          type: "info",
        });
      }

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error applying schedule:", error);

      setNotification({
        message:
          "Error applying schedule: " + (error.message || "Unknown error"),
        type: "error",
      });

      setTimeout(() => setNotification(null), 3000);
    } finally {
      setShowSmartSchedulePreview(false);
      hideLoading();
    }
  };

  const hasTimeSlotScheduleChanged = (originalTask, newTimeSlots) => {
    // If the original task has no time slots, but now it does, it has changed
    if (!originalTask.time_slots || originalTask.time_slots.length === 0) {
      return true;
    }

    // If the number of time slots has changed, the schedule has changed
    if (originalTask.time_slots.length !== newTimeSlots.length) {
      return true;
    }

    const originalTimeSlots = originalTask.time_slots;

    originalTimeSlots.sort(
      (a, b) => Number(a.start_time) - Number(b.start_time)
    );
    const sortedNewSlots = [...newTimeSlots].sort(
      (a, b) => Number(a.start_time) - Number(b.start_time)
    );

    for (let i = 0; i < originalTimeSlots.length; i++) {
      const original = originalTimeSlots[i];
      const newSlot = sortedNewSlots[i];

      // If any slot differs, the schedule has changed
      if (
        Number(original.start_time) !== newSlot.start_time ||
        Number(original.end_time) !== newSlot.end_time
      ) {
        return true;
      }
    }

    // Slots are the same
    return false;
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.plannerContainer}>
        <p>Please login to access the planner.</p>
      </div>
    );
  }

  return (
    <div className={styles.plannerContainer}>
      <div className={`${controlStyles.controlPanel}`}>
        <button
          className="time-nav-button"
          onClick={() => setShowDatePicker(true)}
          title="Go to date"
        >
          <Calendar size={16} />
        </button>

        <TimeScaleControls
          scale={scale}
          onScaleChange={setScale}
          className={controlStyles.scaleSelect}
        />

        <TimeRangeSelector
          range={timeRange}
          onRangeChange={handleRangeChange}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
          className={controlStyles.rangeSelect}
        />

        <div style={{ position: "relative" }}>
          <button
            className="control-button"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: "0 12px",
              height: "32px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Filter
          </button>

          {showFilters && (
            <div
              className="filter-dropdown"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 50,
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5px",
                padding: "8px",
                width: "200px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "8px 0" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    padding: "4px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.showBreaks}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        showBreaks: !prev.showBreaks,
                      }))
                    }
                  />
                  Show Breaks
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    padding: "4px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.showWorkingHours}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        showWorkingHours: !prev.showWorkingHours,
                      }))
                    }
                  />
                  Show Working Hours
                </label>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className="button-primary"
            onClick={() => handleSmartSchedule()}
          >
            Smart Schedule
          </button>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "14px",
            }}
          >
            <input
              type="checkbox"
              checked={includeScheduledTasks}
              onChange={(e) => setIncludeScheduledTasks(e.target.checked)}
            />
            Include scheduled tasks
          </label>
        </div>
        <button
          className="button-primary button-auto-left"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} />
          Add Time Slot
        </button>

        {showDatePicker && (
          <div className={dialogStyles.overlay}>
            <div className={dialogStyles.container}>
              <h2 className={dialogStyles.title}>Select Date</h2>
              <DatePicker
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
              />
              <div className={dialogStyles.actions}>
                <button
                  className={dialogStyles.buttonSecondary}
                  onClick={() => setShowDatePicker(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className={errorStyles.container}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <TimeGrid
        timeSlots={timeSlots}
        tasks={tasks}
        scale={scale}
        timeRange={timeRange}
        customRange={customRange}
        showTasks={true}
        onSlotSelect={(slot, event, isPastTime, dayDate) =>
          handleSlotSelect(slot, event, isPastTime, dayDate)
        }
        onTimeSelect={handleTimeSelect}
        selectedSlotId={selectedSlot?.id}
        currentWeek={currentWeek}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        filterBreaks={filters.showBreaks}
        filterWorkingHours={filters.showWorkingHours}
        showPastTimeNotification={showPastTimeNotification}
      />

      {showPopup && selectedSlot && (
        <div
          ref={popupRef}
          style={{
            position: "fixed",
            left: `${popupPosition?.x}px`,
            top: `${popupPosition?.y}px`,
            zIndex: 1000,
            backgroundColor: "white",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            borderRadius: "4px",
            padding: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          {selectedSlot.slot_type === "WorkingHours" && !isPastTimeSlot && (
            <button
              onClick={() => {
                let taskTime;
                if (clickedCellTime) {
                  taskTime = new Date(clickedCellTime);
                } else {
                  taskTime = new Date();
                  taskTime.setHours(
                    Math.floor(selectedSlot.start_minutes / 60)
                  );
                  taskTime.setMinutes(selectedSlot.start_minutes % 60);
                }

                setSelectedTime(taskTime);
                setShowScheduleForm(true);
                setShowPopup(false);
              }}
              className="icon-action-button"
              title="Schedule task in this time slot"
              style={{
                marginBottom: "8px",
                width: "100%",
                justifyContent: "flex-start",
              }}
            >
              <Calendar size={16} />
              <span style={{ marginLeft: "4px" }}>Schedule Task</span>
            </button>
          )}

          <TimeSlotOperations
            timeSlot={selectedSlot}
            showEditForm={showEditForm}
            setShowEditForm={setShowEditForm}
            onUpdate={() => {
              setShowEditForm(true);
              setShowPopup(true);
            }}
            onDelete={() => {
              setShowPopup(false);
              loadTimeSlots();
            }}
            popupMode={true}
            onClosePopup={handleSlotDeselect}
            hiddeScheduleTask={isPastTimeSlot}
          />

          <button
            onClick={handleSlotDeselect}
            className="icon-action-button"
            title="Cancel selection"
            style={{
              marginTop: "8px",
              width: "100%",
              justifyContent: "center",
              backgroundColor: "#f3f4f6",
            }}
          >
            <span>Cancel</span>
          </button>
        </div>
      )}

      {showAddForm && (
        <TimeSlotOperations
          onUpdate={loadTimeSlots}
          selectedTime={selectedTime}
          showAddForm={true}
          onCloseForm={() => setShowAddForm(false)}
        />
      )}

      {showScheduleForm && selectedTime && (
        <TaskScheduleForm
          isOpen={showScheduleForm}
          onClose={() => setShowScheduleForm(false)}
          tasks={tasks}
          timeSlots={timeSlots}
          selectedTime={selectedTime}
          onSubmit={() => {
            loadTasks();
            setSelectedTime(null);
          }}
        />
      )}

      <SmartSchedulePreview
        isOpen={showSmartSchedulePreview}
        onClose={() => setShowSmartSchedulePreview(false)}
        onConfirm={applyOptimizedSchedule}
        originalTasks={tasks}
        optimizedSchedule={optimizedSchedule}
      />

      {notification && (
        <div
          className={`${styles.notification} ${
            styles[`${notification.type}Notification`]
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}

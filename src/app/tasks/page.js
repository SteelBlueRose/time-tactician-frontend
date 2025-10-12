"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Clock,
  Calendar,
  ArrowUpDown,
  ChevronRight,
  Play,
  CheckSquare,
} from "lucide-react";
import api from "@/utils/api";
import { ResizablePanelLayout } from "@/components/layout/ResizablePanelLayout";
import TaskOperations from "@/components/task/TaskOperations";
import ItemList from "@/components/common/ItemList";
import SortDialog from "@/components/helpers/SortDialog";

import styles from "@/app/styles/features/tasks/Tasks.module.css";
import layoutStyles from "@/app/styles/components/layout/Layout.module.css";
import statusStyles from "@/app/styles/components/status/Status.module.css";
import errorStyles from "@/app/styles/components/status/Error.module.css";
import itemStyles from "@/app/styles/components/layout/ItemLayout.module.css";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState("deadline");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const [incompleteRes, completedRes] = await Promise.all([
        api.get("/tasks?status=incomplete"),
        showCompleted ? api.get("/tasks?status=completed") : Promise.resolve({ data: [] }),
      ]);
      setTasks(incompleteRes.data);
      setCompletedTasks(completedRes.data);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError("Failed to load tasks. Are you logged in?");
    } finally {
      setLoadingList(false);
    }
  }, [showCompleted]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      loadTasks();
    } else {
      setIsAuthenticated(false);
    }
  }, [loadTasks]);

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
  };

  const handleStartTask = async (task) => {
    if (!window.confirm("Are you sure you want to start this task?")) return;
    try {
      await api.post(`/tasks/${task.id}/start`);
      await loadTasks();
    } catch (err) {
      console.error("Error starting task:", err);
      setError("Failed to start task");
    }
  };

  const handleCompleteTask = async (task) => {
    if (!window.confirm("Are you sure you want to mark this task as completed?")) return;
    try {
      await api.post(`/tasks/${task.id}/complete`);
      
      // Deselect the task if it's the one being completed.
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask(null);
      }
      
      // Reload all tasks from the server to ensure UI consistency.
      await loadTasks();

    } catch (err) {
      console.error("Error completing task:", err);
      setError("Failed to complete task");
      // In case of an error, reload to revert to a consistent state.
      await loadTasks();
    }
  };

  const sortTasks = (tasksToSort) => {
    return [...tasksToSort].sort((a, b) => {
      let comparison = 0;
      switch (sortType) {
        case "deadline":
          comparison = new Date(a.deadline) - new Date(b.deadline);
          break;
        case "estimated_time":
          comparison = a.estimated_time - b.estimated_time;
          break;
        case "reward_points":
          comparison = a.reward_points - b.reward_points;
          break;
        case "priority":
          const priorityOrder = { Low: 0, Medium: 1, High: 2, Critical: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const renderTaskPrefix = (task, hasSubtasks, isExpanded, toggleExpanded) => (
    <>
      {hasSubtasks && (
        <button
          className={`${itemStyles.toggleSubItems} ${isExpanded ? itemStyles.expanded : ""}`}
          onClick={(e) => toggleExpanded(task.id, e)}
        >
          <ChevronRight size={16} />
        </button>
      )}
      {task.state !== "Completed" &&
        (task.state === "Created" ? (
          <button
            className="icon-action-button success"
            onClick={(e) => { e.stopPropagation(); handleStartTask(task); }}
            title="Start task"
          >
            <Play size={16} />
          </button>
        ) : (
          <button
            className="check-button"
            onClick={(e) => { e.stopPropagation(); handleCompleteTask(task); }}
            title="Mark as completed"
          />
        ))}
    </>
  );

  const renderTaskContent = (task) => (
    <div className={itemStyles.itemInfo}>
      <p className={itemStyles.itemTitle}>{task.title}</p>
    </div>
  );

  const renderTaskBadges = (task) => (
    <>
      <span className={`${statusStyles.itemState} ${statusStyles[`state${task.state}`]}`}>
        {task.state}
      </span>
      <span className={`${statusStyles.badge} ${statusStyles[`priority${task.priority}`]}`}>
        {task.priority}
      </span>
    </>
  );

  const getSubtasks = (task) =>
    task.subtask_ids
      ?.map((id) => [...tasks, ...completedTasks].find((t) => t.id === id))
      .filter(Boolean);

  const renderLeftPanel = () => {
    const completedIds = new Set(completedTasks.map(t => t.id));
    const filteredTasks = tasks.filter(t => !completedIds.has(t.id));

    const allTasks = filteredTasks.concat(showCompleted ? completedTasks : []);
    const allSubItemIds = new Set();
    allTasks.forEach((task) => {
      if (task.subtask_ids) {
        task.subtask_ids.forEach((id) => allSubItemIds.add(id));
      }
    });

    const rootItems = allTasks.filter((task) => !allSubItemIds.has(task.id));

    return (
      <>
        <div className={itemStyles.controlsRow}>
          <button
            className={`control-button ${showCompleted ? "active" : ""}`}
            onClick={() => setShowCompleted(!showCompleted)}
            disabled={loadingList}
            title={showCompleted ? "Hide Completed" : "Show Completed"}
          >
            <CheckSquare size={16} />
          </button>
          <button
            className="control-button"
            onClick={() => setShowSortDialog(true)}
            title="Sort Tasks"
          >
            <ArrowUpDown size={16} />
          </button>
        </div>
        <button className="action-button" onClick={() => setShowForm(true)}>
          Add Task
        </button>
        {error && (
          <div className={errorStyles.container}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <ItemList
          items={sortTasks(rootItems)}
          selectedId={selectedTask?.id}
        onSelect={handleTaskSelect}
        renderBadges={renderTaskBadges}
        renderPrefix={renderTaskPrefix}
        renderContent={renderTaskContent}
        getSubItems={getSubtasks}
        containerClassName={itemStyles.taskContainer}
        itemClassName={itemStyles.itemRow}
        nestedItemClassName={itemStyles.subItemRow}
        subItemsContainerClassName={itemStyles.subItemsContainer}
      />
      <SortDialog
        isOpen={showSortDialog}
        onClose={() => setShowSortDialog(false)}
        sortType={sortType}
        setSortType={setSortType}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        options={[
          { value: "deadline", label: "Deadline" },
          { value: "estimated_time", label: "Time Estimated" },
          { value: "reward_points", label: "Reward Points" },
          { value: "priority", label: "Priority" },
        ]}
      />
    </>
  );
};;;

  const renderRightPanel = () =>
    selectedTask && (
      <>
        <div className={itemStyles.selectedItemHeader}>
          <h2 className={itemStyles.selectedItemTitle}>{selectedTask.title}</h2>
          <span className={`${statusStyles.itemState} ${statusStyles[`state${selectedTask.state}`]}`}>
            {selectedTask.state}
          </span>
        </div>
        <p className={itemStyles.selectedItemDescription}>{selectedTask.description}</p>
        <div className={styles.taskInfo}>
          <div className={styles.rewardPoints}>
            <span className={styles.pointsLabel}>
              Reward: {selectedTask.reward_points} Points
            </span>
          </div>
          <div className={itemStyles.itemMetadata}>
            <div className={itemStyles.metadataItem}>
              <Calendar size={16} />
              <span>Deadline: {formatDate(selectedTask.deadline)}</span>
            </div>
            <div className={itemStyles.metadataItem}>
              <Clock size={16} />
              <span>Time: {formatDuration(selectedTask.estimated_time)}</span>
            </div>
          </div>
        </div>
        <TaskOperations
          task={selectedTask}
          onUpdate={async () => {
            await loadTasks();
            // Need to re-select the task to get updated data
            const updatedTask = tasks.find(t => t.id === selectedTask.id);
            setSelectedTask(updatedTask || null);
          }}
          onDelete={async () => {
            setSelectedTask(null);
            await loadTasks();
          }}
          onStart={handleStartTask}
          onComplete={handleCompleteTask}
        />
      </>
    );

  if (!isAuthenticated) {
    return (
      <div className={layoutStyles.pageContainer}>
        <p>Please login to manage tasks.</p>
      </div>
    );
  }

  return (
    <>
      <ResizablePanelLayout
        leftPanel={renderLeftPanel()}
        rightPanel={renderRightPanel()}
        minLeftWidth={300}
        maxLeftWidth={1000}
        minRightWidth={400}
      />
      {showForm && (
        <TaskOperations
          showAddForm={showForm}
          onCloseForm={() => setShowForm(false)}
          onUpdate={async () => {
            await loadTasks();
            setShowForm(false);
          }}
        />
      )}
    </>
  );
}

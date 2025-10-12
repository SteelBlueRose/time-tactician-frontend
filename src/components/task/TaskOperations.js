import React, { useState } from "react";
import { Edit, Trash, Play, Check, Plus } from "lucide-react";
import api from "@/utils/api";
import TaskForm from "./TaskForm";
import errorStyles from "@/app/styles/components/status/Error.module.css";

const TaskOperations = ({
  task,
  onUpdate,
  onDelete,
  onStart,
  onComplete,
  showAddForm,
  onCloseForm,
  isSubtask = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  const handleAddTask = async (
    title,
    description,
    priority,
    deadline,
    estimated_time,
    recurrence = null,
    parent_task_id = null
  ) => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/tasks", {
        title,
        description,
        priority,
        deadline,
        estimated_time,
        parent_task_id,
        recurrence,
      });
      onUpdate && onUpdate();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtask = async (
    title,
    description,
    priority,
    deadline,
    estimated_time
  ) => {
    await handleAddTask(
      title,
      description,
      priority,
      deadline,
      estimated_time,
      null,
      task.id
    );
    setShowSubtaskForm(false);
  };

  const handleUpdateTask = async (
    title,
    description,
    priority,
    deadline,
    estimated_time
  ) => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/tasks/${task.id}`, {
        title,
        description,
        priority,
        deadline,
        estimated_time,
        state: task.state, // Keep the current state
      });
      onUpdate && onUpdate();
      setShowEditForm(false);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/tasks/${task.id}`);
      onDelete && onDelete(task.id);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "16px" }}>
      {error && <div className={errorStyles.container}>{error}</div>}

      {showAddForm ? (
        <TaskForm
          isOpen={true}
          onClose={onCloseForm}
          onSubmit={handleAddTask}
        />
      ) : (
        <>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            {!isSubtask && task.state !== "Completed" && (
              <button
                onClick={() => setShowSubtaskForm(true)}
                disabled={loading}
                className="icon-action-button"
                title="Add subtask"
              >
                <Plus size={16} />
              </button>
            )}
            <button
              onClick={() => setShowEditForm(true)}
              disabled={loading || task.state === "Completed"}
              className="icon-action-button"
              title="Edit task"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={handleDeleteTask}
              disabled={loading}
              className="icon-action-button delete"
              title="Delete task"
            >
              <Trash size={16} />
            </button>
            {task.state === "Created" && (
              <button
                onClick={() => onStart(task)}
                disabled={loading}
                className="icon-action-button success"
                title="Start task"
              >
                <Play size={16} />
              </button>
            )}
            {task.state === "InProgress" && (
              <button
                onClick={() => onComplete(task)}
                disabled={loading}
                className="icon-action-button success"
                title="Complete task"
              >
                <Check size={16} />
              </button>
            )}
          </div>
          {showEditForm && (
            <TaskForm
              isOpen={showEditForm}
              onClose={() => setShowEditForm(false)}
              onSubmit={handleUpdateTask}
              initialData={task}
            />
          )}
          {showSubtaskForm && (
            <TaskForm
              isOpen={showSubtaskForm}
              onClose={() => setShowSubtaskForm(false)}
              onSubmit={handleAddSubtask}
              isSubtask={true}
              parentTask={task}
            />
          )}
        </>
      )}
    </div>
  );
};

export default TaskOperations;

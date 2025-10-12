import React, { useState } from "react";
import { Edit, Trash, Gift } from "lucide-react";
import api from "@/utils/api";
import RewardForm from "./RewardForm";
import errorStyles from "@/app/styles/components/status/Error.module.css";

const RewardOperations = ({
  reward,
  hasEnoughPoints,
  onUpdate,
  onDelete,
  onRedeem,
  showAddForm,
  onCloseForm,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleAddReward = async (title, description, cost) => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/rewards", { title, description, cost });
      onUpdate && onUpdate();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to add reward");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReward = async (title, description, cost) => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/rewards/${reward.id}`, {
        title,
        description,
        cost,
        state: reward.state,
      });
      onUpdate && onUpdate();
      setShowEditForm(false);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update reward");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReward = async () => {
    if (!window.confirm("Are you sure you want to delete this reward?")) return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/rewards/${reward.id}`);
      onDelete && onDelete(reward.id);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete reward");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!window.confirm(`Are you sure you want to redeem this reward for ${reward.cost} points?`)) return;
    setLoading(true);
    setError(null);
    try {
      await api.post(`/rewards/${reward.id}/redeem`);
      onRedeem && onRedeem(reward.id);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to redeem reward");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "16px" }}>
      {error && <div className={errorStyles.container}>{error}</div>}

      {showAddForm ? (
        <RewardForm
          isOpen={true}
          onClose={onCloseForm}
          onSubmit={handleAddReward}
        />
      ) : (
        <>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={() => setShowEditForm(true)}
              disabled={loading || reward.state === "Completed"}
              className="icon-action-button"
              title="Edit reward"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={handleDeleteReward}
              disabled={loading}
              className="icon-action-button delete"
              title="Delete reward"
            >
              <Trash size={16} />
            </button>
            <button
              onClick={handleRedeemReward}
              disabled={loading || reward.state !== "Active" || !hasEnoughPoints}
              className="icon-action-button success"
              title="Redeem reward"
            >
              <Gift size={16} />
            </button>
          </div>
          {showEditForm && (
            <RewardForm
              isOpen={showEditForm}
              onClose={() => setShowEditForm(false)}
              onSubmit={handleUpdateReward}
              initialData={reward}
            />
          )}
        </>
      )}
    </div>
  );
};

export default RewardOperations;

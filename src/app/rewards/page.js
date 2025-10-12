"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Award, AlertCircle, ArrowUpDown } from "lucide-react";
import api from "@/utils/api";
import { ResizablePanelLayout } from "@/components/layout/ResizablePanelLayout";
import RewardOperations from "@/components/reward/RewardOperations";
import ItemList from "@/components/common/ItemList";
import SortDialog from "@/components/helpers/SortDialog";

import styles from "@/app/styles/features/rewards/Rewards.module.css";
import layoutStyles from "@/app/styles/components/layout/Layout.module.css";
import itemStyles from "@/app/styles/components/layout/ItemLayout.module.css";
import statusStyles from "@/app/styles/components/status/Status.module.css";
import errorStyles from "@/app/styles/components/status/Error.module.css";

export default function RewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [completedRewards, setCompletedRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState("cost");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadData = useCallback(async () => {
    setLoadingRewards(true);
    setError(null);
    try {
      const [rewardsRes, pointsRes] = await Promise.all([
        api.get(`/rewards?status=${showCompleted ? 'retrieved' : 'active'}`),
        api.get("/user/points"),
      ]);
      
      if (showCompleted) {
        setRewards([]);
        setCompletedRewards(rewardsRes.data);
      } else {
        setRewards(rewardsRes.data);
        setCompletedRewards([]);
      }
      setUserPoints(pointsRes.data.points);

    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Are you logged in?");
    } finally {
      setLoadingRewards(false);
    }
  }, [showCompleted]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      loadData();
    } else {
      setIsAuthenticated(false);
    }
  }, [loadData]);

  const sortRewards = (rewardsToSort) => {
    return [...rewardsToSort].sort((a, b) => {
      let comparison = 0;
      switch (sortType) {
        case "cost":
          comparison = a.cost - b.cost;
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "state":
          comparison = a.state.localeCompare(b.state);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const handleRewardSelect = (reward) => {
    setSelectedReward(reward);
  };

  const renderRewardContent = (reward) => (
    <div className={itemStyles.itemTitle}>{reward.title}</div>
  );

  const renderRewardBadges = (reward) => (
    <>
      {reward.state === "Active" && (
        <span className={styles.costBadge}>{reward.cost} RP</span>
      )}
      <span
        className={`${statusStyles.itemState} ${
          reward.state === "Active"
            ? statusStyles.stateInProgress
            : statusStyles.stateCompleted
        }`}
      >
        {reward.state}
      </span>
    </>
  );

  const renderLeftPanel = () => (
    <>
      <div className={styles.pointsDisplay}>
        <span className={styles.pointsInfo}>Available Points:</span>
        <span className={styles.pointsAmount}>{userPoints}</span>
      </div>
      <div className={itemStyles.controlsRow}>
        <button
          className={`control-button ${showCompleted ? "active" : ""}`}
          onClick={() => setShowCompleted(!showCompleted)}
          disabled={loadingRewards}
        >
          {showCompleted ? "Hide Retrieved" : "Show Retrieved"}
        </button>
        <button
          className="control-button"
          onClick={() => setShowSortDialog(true)}
        >
          <ArrowUpDown size={16} />
          Sort
        </button>
      </div>
      <button className="action-button" onClick={() => setShowForm(true)}>
        Add Reward
      </button>
      {error && (
        <div className={errorStyles.container}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {loadingRewards ? (
        <div className={styles.loadingMessage}>Loading rewards...</div>
      ) : (
        <ItemList
          items={sortRewards([...rewards, ...completedRewards])}
          selectedId={selectedReward?.id}
          onSelect={handleRewardSelect}
          renderContent={renderRewardContent}
          renderBadges={renderRewardBadges}
          renderPrefix={() => <Award size={20} className={styles.rewardIcon} />}
          containerClassName={itemStyles.itemContainer}
          itemClassName={itemStyles.itemRow}
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
          { value: "cost", label: "Cost" },
          { value: "title", label: "Title" },
          { value: "state", label: "Status" },
        ]}
      />
    </>
  );

  const renderRightPanel = () =>
    selectedReward && (
      <>
        <div className={itemStyles.selectedItemHeader}>
          <h2 className={itemStyles.selectedItemTitle}>{selectedReward.title}</h2>
          <span
            className={`${statusStyles.itemState} ${
              selectedReward.state === "Active"
                ? statusStyles.stateInProgress
                : statusStyles.stateCompleted
            }`}
          >
            {selectedReward.state}
          </span>
        </div>
        <p className={itemStyles.selectedItemDescription}>{selectedReward.description}</p>
        <div className={styles.costIndicator}>
          <span className={styles.costAmount}>{selectedReward.cost}</span>
          <span className={styles.pointsLabel}>Reward Points</span>
        </div>
        {selectedReward.state === "Active" && userPoints < selectedReward.cost && (
          <div className={styles.insufficientPoints}>
            <AlertCircle size={16} />
            <span>Insufficient points to redeem</span>
          </div>
        )}
        <RewardOperations
          reward={selectedReward}
          hasEnoughPoints={userPoints >= selectedReward.cost}
          onUpdate={async () => {
            await loadData();
            const updatedReward = [...rewards, ...completedRewards].find(r => r.id === selectedReward.id);
            setSelectedReward(updatedReward || null);
          }}
          onDelete={async () => {
            setSelectedReward(null);
            await loadData();
          }}
          onRedeem={async () => {
            await loadData();
            const updatedReward = [...rewards, ...completedRewards].find(r => r.id === selectedReward.id);
            setSelectedReward(updatedReward || null);
          }}
        />
      </>
    );

  if (!isAuthenticated) {
    return (
      <div className={layoutStyles.pageContainer}>
        <p>Please login to manage rewards.</p>
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
        <RewardOperations
          showAddForm={showForm}
          onCloseForm={() => setShowForm(false)}
          onUpdate={async () => {
            await loadData();
            setShowForm(false);
          }}
        />
      )}
    </>
  );
}

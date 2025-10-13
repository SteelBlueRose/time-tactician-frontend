
import { usePathname } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLayout } from "@/components/layout/LayoutContext";

import styles from "@/app/styles/navigation/Navigation.module.css";
import rewardPointsStyles from "@/app/styles/navigation/RewardPoints.module.css";

export const Navigation = () => {
  const { user, points, isAuthenticated, logout } = useAuth();
  const { isExpanded, isPinned } = useLayout();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const isMainPage = pathname === "/";

  const handleLoginLogout = useCallback(() => {
    if (isAuthenticated) {
      setShowDropdown((prev) => !prev);
    } else {
      logout();
    }
  }, [isAuthenticated, logout]);

  const handleLogout = useCallback(() => {
    setShowDropdown(false);
    logout();
  }, [logout]);

  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <>
      <nav
        className={`${styles.navbar} ${
          isMainPage
            ? styles.mainPage
            : isExpanded || isPinned
            ? styles.shifted
            : ""
        }`}
      >
        <div className={styles["navbar-left"]}>
          {/* Removed SyncButton */}
        </div>

        <div className={styles["navbar-center"]}>
          {/* Removed Contract display */}
        </div>

        <div className={styles["navbar-right"]}>
          {isAuthenticated && user && (
            <div
              className={`button-primary ${rewardPointsStyles.rewardPoints}`}
            >
              <span className={rewardPointsStyles.rewardValue}>
                {points}
              </span>
              <span className={rewardPointsStyles.rewardLabel}>RP</span>
            </div>
          )}
          <button
            className={`button-primary ${styles.navButton}`}
            onClick={handleLoginLogout}
          >
            {isAuthenticated && user ? user.name : "Login"}
          </button>
          {showDropdown && (
            <div className={styles.dropdownMenu} ref={dropdownRef}>
              <button
                className={styles.dropdownMenuButton}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};


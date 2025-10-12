"use client";

import React from "react";
import styles from "@/app/styles/components/dialog/Loading.module.css";
import { Loader2 } from "lucide-react";
import { useLoading } from "./LoadingContext";

export const LoadingOverlay = () => {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <Loader2 className={styles.spinner} size={36} />
        <p className={styles.messageText}>{loadingMessage}</p>
      </div>
    </div>
  );
};

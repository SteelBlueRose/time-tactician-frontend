"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import styles from "@/app/styles/features/main-page/Home.module.css";
import bannerStyles from "@/app/styles/features/main-page/Banner.module.css";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/tasks");
    }
  }, [router]);

  const handleClick = () => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/tasks");
    } else {
      router.push("/login");
    }
  };

  return (
    <main className={`${styles.main} ${styles.mainPage}`}>
      <div className={styles.container}>
        <h1 className={styles.title}>TimeTactician</h1>
        <h2 className={styles.subtitle}>time management system</h2>
        <p className={styles.description}>
          Plan your everyday and boost productivity with TimeTactician!
        </p>
        <div className={bannerStyles.banner} onClick={handleClick}>
          <p className={bannerStyles.bannerText}>
            Use TimeTactician from any browser to manage your tasks and save one
            day every week.
          </p>
        </div>
      </div>
    </main>
  );
}

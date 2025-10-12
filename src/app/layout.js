"use client";

import { LayoutProvider } from "@/components/layout/LayoutContext";
import { LoadingProvider } from "@/components/layout/LoadingContext";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { Navigation } from "@/components/navigational_bar/navigation";
import { LoadingOverlay } from "@/components/layout/LoadingOverlay";
import { AuthProvider } from "@/context/AuthContext";

import "@/app/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        <AuthProvider>
          <LoadingProvider>
            <LayoutProvider>
              <LayoutWrapper>
                <Navigation />
                {children}
                <LoadingOverlay />
              </LayoutWrapper>
            </LayoutProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


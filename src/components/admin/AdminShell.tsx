"use client";

import React from "react";
import { SidebarProvider } from "./SidebarContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { SystemToastContainer } from "@/components/ui/SystemToast";

interface AdminShellProps {
  role?: "SUPER_ADMIN" | "ORGANIZATION_ADMIN" | "SECRETARY" | "FINANCIAL_MANAGER" | "BRANCH_MANAGER" | "EMPLOYEE" | string;
  organizationName?: string;
  userName?: string;
  userEmail?: string;
  children: React.ReactNode;
}

export function AdminShell({
  role,
  organizationName,
  userName,
  userEmail,
  children,
}: AdminShellProps) {
  return (
    <SidebarProvider>
      <SystemToastContainer />
      <div className="flex h-screen bg-[#F4F6F9] overflow-hidden text-[#263445]">
        <AdminSidebar role={role} organizationName={organizationName} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader
            userName={userName}
            userEmail={userEmail}
            role={role}
            organizationName={organizationName}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F4F6F9]">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

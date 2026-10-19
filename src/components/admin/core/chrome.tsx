"use client";

import { createContext, useContext } from "react";

/**
 * Shared state between the admin shell and in-page chrome.
 * When a page shows the contextual save bar, the mobile floating nav steps aside.
 */
export type AdminChrome = { saveBarActive: boolean; setSaveBarActive: (v: boolean) => void };

export const AdminChromeContext = createContext<AdminChrome>({ saveBarActive: false, setSaveBarActive: () => {} });

export const useAdminChrome = () => useContext(AdminChromeContext);

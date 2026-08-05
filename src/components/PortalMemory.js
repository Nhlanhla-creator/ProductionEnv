// src/components/PortalMemory.jsx
// Renders nothing. Watches the current route and remembers which portal the
// user is in, so the public site's "back to dashboard" button can return them
// to the portal they actually left — not just whichever role ranks highest.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { rememberPortal } from "../utils/roleRoutes";

export default function PortalMemory() {
  const location = useLocation();

  useEffect(() => {
    rememberPortal(location.pathname);
  }, [location.pathname]);

  return null;
}
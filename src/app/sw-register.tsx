"use client";
import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}

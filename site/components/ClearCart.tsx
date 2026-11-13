"use client";
import { useEffect } from "react";
export default function ClearCart() {
  useEffect(() => { try { localStorage.removeItem("hairbysd-cart"); } catch { /* ignore */ } }, []);
  return null;
}

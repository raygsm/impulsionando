import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BriefcaseMedical,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  HeartPulse,
  Network,
  ShieldCheck,
  Stethoscope,
  TimerReset,
  Users,
} from "lucide-react";
import { ChrismedShell } from "@/components/chrismed/ChrismedShell";

export const Route = createFileRoute("/chrismed/medicina-ocupacional")({
  head: () => ({
    meta: [
      { title: "Medicina Ocupacional CHRISMED · Gestão, PCMSO, ASO e SST" },
      {
        name: "description",

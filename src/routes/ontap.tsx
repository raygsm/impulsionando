import { createFileRoute } from "@tanstack/react-router";
import { FullClientLanding } from "@/components/clients/FullClientLanding";
export const Route = createFileRoute("/ontap")({ component: () => <FullClientLanding slug="ontap" /> });

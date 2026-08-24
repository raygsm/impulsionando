import { createFileRoute } from "@tanstack/react-router";
import { FullClientLanding } from "@/components/clients/FullClientLanding";
export const Route = createFileRoute("/riobeer")({ component: () => <FullClientLanding slug="riobeer" /> });

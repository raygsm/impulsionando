/**
 * /chrismed — Home institucional CrisMed.
 * Redireciona para a página da Dra. Cristiane Alencar (autoridade médica).
 * O fluxo de agendamento mora em /chrismed/agendar.
 */
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/chrismed')({
  beforeLoad: () => { throw redirect({ to: '/chrismed/dra-cristiane' }); },
});

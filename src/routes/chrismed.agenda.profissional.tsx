import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route=createFileRoute('/chrismed/agenda/profissional')({
  beforeLoad:()=>{throw redirect({to:'/agenda/profissional' as never,replace:true});},
  component:()=>null,
});

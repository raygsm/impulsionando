import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCsiPrivateSession() {
  const [loading,setLoading]=useState(true);
  const [userId,setUserId]=useState<string|null>(null);
  useEffect(()=>{
    let mounted=true;
    supabase.auth.getSession().then(({data})=>{
      if(!mounted)return;
      setUserId(data.session?.user.id??null);
      setLoading(false);
    });
    const { data: sub }=supabase.auth.onAuthStateChange((_event,session)=>{
      setUserId(session?.user.id??null);
      setLoading(false);
    });
    return()=>{mounted=false;sub.subscription.unsubscribe();};
  },[]);
  return { loading, authenticated:Boolean(userId), userId };
}

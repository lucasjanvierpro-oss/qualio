"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Message = {
  id: string;
  study_id: string;
  sender_type: "BRAND" | "ADMIN" | "PARTICIPANT";
  content: string;
  is_read: boolean;
  created_at: string;
};

export function useMessages(studyId: string, initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const supabase = useRef(createClient());

  useEffect(() => {
    const client = supabase.current;

    // Load existing messages
    client
      .from("messages")
      .select("*")
      .eq("study_id", studyId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as Message[]);
      });

    // Subscribe to new messages
    const channel = client
      .channel(`study-${studyId}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `study_id=eq.${studyId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [studyId]);

  async function sendMessage(content: string, senderType: "BRAND" | "ADMIN") {
    const { error } = await supabase.current.from("messages").insert({
      study_id: studyId,
      sender_type: senderType,
      content,
      is_read: false,
    });
    if (error) throw error;
  }

  return { messages, sendMessage };
}

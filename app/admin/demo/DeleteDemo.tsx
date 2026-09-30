"use client";

import { useTransition } from "react";
import { deleteDemo } from "@/app/actions/demoSessions";
import a from "../admin.module.css";

export default function DeleteDemo({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" className={`${a.btn} ${a.btnGhost}`} disabled={pending} onClick={() => { if (confirm("Supprimer cette démo ?")) start(() => deleteDemo(id)); }}>
      {pending ? "…" : "Supprimer"}
    </button>
  );
}

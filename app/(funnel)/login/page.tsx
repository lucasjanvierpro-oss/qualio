import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/server";
import LoginClient from "./LoginClient";

export const metadata: Metadata = { title: "Connexion" };

// Connexion commune aux marques et aux participants, dans la langue choisie
// (cookie) ou celle du navigateur.
export default async function LoginPage() {
  return <LoginClient lang={await getLang()} />;
}

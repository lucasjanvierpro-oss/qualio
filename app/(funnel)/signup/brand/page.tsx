import { getLang } from "@/lib/i18n/server";
import BrandSignupClient from "./BrandSignupClient";

export default async function BrandSignupPage() {
  return <BrandSignupClient lang={await getLang()} />;
}

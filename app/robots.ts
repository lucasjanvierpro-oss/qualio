import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/brand/", "/participant/", "/admin/", "/api/"],
      },
    ],
    sitemap: "https://www.rarelyst.co/sitemap.xml",
  };
}

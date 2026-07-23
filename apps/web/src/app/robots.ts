import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://tradekav.ir";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/namad", "/login", "/register", "/contact", "/help/ea-setup", "/fa", "/fa/contact", "/en", "/en/contact"],
      disallow: [
        "/dashboard/",
        "/admin/",
        "/analytics/",
        "/journal/",
        "/settings/",
        "/trades/",
        "/payments/",
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

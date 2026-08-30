import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SubRadar — Détecte et résilie tes abonnements oubliés", template: "%s | SubRadar" },
  description: "SubRadar scanne ta boîte mail avec l'IA et détecte tous tes abonnements actifs. Résilie en 1 clic et économise jusqu'à 300 €/an.",
  keywords: ["abonnements", "résiliation", "économies", "budget", "IA", "automatisation"],
  authors: [{ name: "SubRadar" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "SubRadar",
    title: "SubRadar — L'IA qui résilie tes abonnements oubliés",
    description: "Économise jusqu'à 300 €/an en détectant et résiliez vos abonnements oubliés automatiquement.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}

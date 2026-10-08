import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plateforme de Gestion des Demandes de Congé",
  description: "Plateforme multi-entreprises moderne et sécurisée de gestion des congés",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full bg-slate-50">
      <body className="h-full flex flex-col antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}

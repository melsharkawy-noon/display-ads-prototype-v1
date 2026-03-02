import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CampaignProvider } from "@/context/CampaignContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Display Ads - Create Campaign",
  description: "Managed Display Ads Campaign Creation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CampaignProvider>{children}</CampaignProvider>
      </body>
    </html>
  );
}

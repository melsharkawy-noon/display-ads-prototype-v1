import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CampaignProvider } from "@/context/CampaignContext";
import { IntakeProvider } from "@/context/IntakeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Display Ads Prototype",
  description: "Display Ads Booking & Campaign Builder Prototype",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CampaignProvider>
          <IntakeProvider>{children}</IntakeProvider>
        </CampaignProvider>
      </body>
    </html>
  );
}

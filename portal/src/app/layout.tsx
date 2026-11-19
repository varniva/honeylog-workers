import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Client Portal",
    template: "%s | Client Portal",
  },
  description: "A portal for freelancers to manage clients, projects, and invoices.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Client Portal
        </footer>
      </body>
    </html>
  );
}

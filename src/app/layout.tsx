import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "TrackFleet",
  description: "Vehicle, driver and delivery operations",
  applicationName: "TrackFleet"
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><div className="app-shell"><header className="topbar">
    <a className="brand" href="/"><span className="brand-mark">TF</span><span>TrackFleet<small>Vehicle, driver and delivery operations</small></span></a>
    <nav><a href="/">Dashboard</a><a href="/login">Sign in</a></nav>
  </header>{children}<footer>© {new Date().getFullYear()} TrackFleet. Built for responsible business use.</footer></div></body></html>;
}

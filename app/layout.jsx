import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata = {
  title: "SpinalSense",
  description: "AI Powered Spine Analysis"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
      </body>
    </html>
  );
}

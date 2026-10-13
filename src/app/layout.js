import "./globals.css";

export const metadata = {
  title: "GeoExplorer | Custom Map",
  description:
    "Explore locations, custom geographic boundaries, and road routes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
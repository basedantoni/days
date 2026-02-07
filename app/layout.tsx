export const metadata = {
  title: 'Days',
  description: 'Year progress wallpaper generator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

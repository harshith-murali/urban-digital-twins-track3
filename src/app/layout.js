import Providers from "./providers";
import ClientLayout from "./ClientLayout";

export const metadata = { title: "UrbanTwins" };

export default function RootLayout({ children }) {
  return (
    <Providers>
      <ClientLayout>{children}</ClientLayout>
    </Providers>
  );
}
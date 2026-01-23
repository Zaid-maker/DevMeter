import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Post - DevMeter",
  description: "Read our latest insights on coding productivity and developer analytics.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

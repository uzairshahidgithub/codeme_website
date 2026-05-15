// Admin auth pages get no shell — full viewport, dark background.
// They still live inside the root layout (Poppins font, theme script).
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

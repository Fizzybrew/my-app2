export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center items-center h-dvh w-screen px-4">
      <div className="w-full max-w-100">{children}</div>
    </div>
  );
}

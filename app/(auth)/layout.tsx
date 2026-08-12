export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-center items-center h-dvh w-screen bg-background p-4 md:p-0">
      <div className="w-full max-w-100">{children}</div>
    </div>
  );
}

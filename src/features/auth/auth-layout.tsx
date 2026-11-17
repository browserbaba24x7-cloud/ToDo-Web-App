import { CheckCircle2 } from "lucide-react";

export const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) => (
  <div className="flex min-h-screen">
    {/* Left brand panel */}
    <div className="hidden flex-1 flex-col justify-between border-r-2 bg-sidebar p-10 shadow-clay lg:flex">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-clay">
          <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-[17px] font-semibold">TaskFlow</span>
      </div>
      <div className="max-w-md">
        <h2 className="text-3xl font-semibold leading-tight">The workspace where your work gets done.</h2>
        <p className="mt-3 text-[14px] text-muted-foreground">
          Plan projects, capture ideas, and track progress — all in a fast, focused interface built for professional teams.
        </p>
        <div className="mt-8 space-y-3">
          {["Lightning-fast task capture", "Projects & Kanban boards", "Beautiful dark & light themes"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" /> {f}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground">© 2025 TaskFlow. All rights reserved.</p>
    </div>

    {/* Right form panel */}
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 lg:hidden flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-clay">
            <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-[17px] font-semibold">TaskFlow</span>
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  </div>
);
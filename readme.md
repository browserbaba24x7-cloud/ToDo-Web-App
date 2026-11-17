taskflow/
├── src/
│   ├── components/
│   │   ├── ui/              # Base primitives
│   │   ├── layout/          # Shell, Sidebar, Header
│   │   ├── tasks/           # TaskCard, TaskRow, TaskForm
│   │   ├── projects/        # ProjectCard, ProjectForm
│   │   └── shared/          # EmptyState, ConfirmDialog
│   ├── features/
│   │   ├── dashboard/
│   │   ├── inbox/
│   │   ├── today/
│   │   ├── upcoming/
│   │   ├── projects/
│   │   ├── settings/
│   │   └── auth/
│   ├── lib/
│   │   ├── services/        # Service abstraction
│   │   ├── store/           # Zustand stores
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   └── mock-data.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── index.html

## Supabase setup

1. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` from your Supabase project's API settings.
   Never use a `service_role` key in a browser app. Environment files are
   ignored by Git.
2. Run `supabase/migrations/20261117000000_initial_schema.sql` in the
   Supabase SQL Editor to create the tables and enable row-level security.
3. In Supabase Authentication settings, set the Site URL to your app origin
   and add `<app-origin>/reset-password` and `<app-origin>/app/settings` as
   redirect URLs for password resets and email changes.
4. Restart the Vite dev server after changing environment variables, then run
   `npm run dev`.

The app uses Supabase Auth for signup, sign-in, password recovery, and sign-out.
Tasks and projects are stored in Supabase; the authenticated user's ID and RLS
policies enforce ownership. Email address changes take effect after the user
confirms the verification email from Supabase.
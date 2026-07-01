This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Football Tournament Admin

The football tournament admin uses Supabase for auth, database, and row-level
security.

Required local environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Apply the SQL migrations in `supabase/migrations/` to the Supabase project in
filename order. The incremental migrations add tournament formats, viewer
assignment/locking support, staff suspension, and the public `team-photos`
storage bucket used for team images.

For the first access, create one Supabase Auth user and insert a matching admin
profile. Admins can manage everything:

```sql
insert into public.admin_profiles (id, email, role)
values ('AUTH_USER_UUID', 'admin@example.com', 'admin');
```

After that, use `/admin/usuarios` to create, update, suspend, reactivate, or
exceptionally delete staff accounts. Viewers can only submit final results for
assigned matches.

Run locally:

```bash
npm run dev
```

Then open:

- public football page: `http://localhost:3000/futbol`
- private admin: `http://localhost:3000/admin`
- viewer results panel: `http://localhost:3000/veedor`

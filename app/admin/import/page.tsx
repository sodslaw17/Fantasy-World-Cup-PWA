import { ImportPanel } from "@/components/admin/ImportPanel";

export const metadata = { title: "Import Data — WC26 Admin" };

export default function ImportPage() {
  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gold mb-1">Import data</h1>
      <p className="text-sm text-paper/50 mb-6">
        Paste CSV to load teams and group-stage fixtures. See{" "}
        <code className="text-paper/70">supabase/sample-data/README.md</code> for
        column formats. Import teams before fixtures.
      </p>
      <ImportPanel />
    </main>
  );
}

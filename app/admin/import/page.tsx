import { ImportPanel } from "@/components/admin/ImportPanel";
import { AdminPageHeader } from "../_components/AdminShell";

export const metadata = { title: "Import Data — WC26 Admin" };

export default function ImportPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader
        title="Import Data"
        sub="Load teams and group-stage fixtures via CSV"
      />
      <div className="px-4 pb-8">
        <p className="text-sm text-admin-muted mb-6">
          Paste CSV to load teams and group-stage fixtures. See{" "}
          <code className="text-admin-ink bg-admin-soft px-1 rounded">
            supabase/sample-data/README.md
          </code>{" "}
          for column formats. Import teams before fixtures.
        </p>
        <ImportPanel />
      </div>
    </div>
  );
}

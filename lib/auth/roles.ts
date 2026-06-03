function splitEmails(envVar: string | undefined): string[] {
  return (envVar ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(email: string): boolean {
  return splitEmails(process.env.ADMIN_EMAILS).includes(email.toLowerCase());
}

export function isSuperAdmin(email: string): boolean {
  return splitEmails(process.env.SUPER_ADMIN_EMAILS).includes(
    email.toLowerCase()
  );
}

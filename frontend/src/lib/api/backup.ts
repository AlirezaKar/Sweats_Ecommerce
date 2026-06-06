import { apiFetchAuth } from "@/lib/api/client";
import { endpoints } from "@/lib/constants/endpoints";

export type DatabaseBackup = {
  filename: string;
  size_bytes: number;
  created_at: string;
};

export async function fetchBackups(token: string): Promise<DatabaseBackup[]> {
  const data = await apiFetchAuth<{ backups: DatabaseBackup[] }>(endpoints.adminBackups, token);
  return data.backups;
}

export async function createBackup(token: string, name?: string): Promise<DatabaseBackup> {
  return apiFetchAuth<DatabaseBackup>(endpoints.adminBackups, token, {
    method: "POST",
    body: JSON.stringify({ name: name?.trim() ?? "" }),
    revalidate: false,
  });
}

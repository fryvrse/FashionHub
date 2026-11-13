import React from "react";
import { db } from "@/lib/prisma";
import { SuperadminUsersClient } from "@/components/superadmin-users-client";

export default function SuperadminUsersPage() {
  const users = db.getAllUsers();
  return <SuperadminUsersClient initialUsers={users} />;
}


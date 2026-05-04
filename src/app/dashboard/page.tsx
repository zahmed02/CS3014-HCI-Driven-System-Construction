import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export default async function DashboardPage() {
  const cookieStore = await cookies(); // ✅ await the promise
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = verifyToken(token);
  if (!payload) redirect("/login");

  // Redirect to role-specific dashboard
  switch (payload.role) {
    case "organizer":
      redirect("/dashboard/organizer");
    case "vendor":
      redirect("/dashboard/vendor");
    case "staff":
      redirect("/dashboard/staff");
    case "attendee":
      redirect("/dashboard/attendee");
    default:
      redirect("/login");
  }
}

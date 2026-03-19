import { connectToDatabase } from "@/lib/mongodb";
import { createSession, verifyPassword } from "@/lib/auth";
import { authSchema, getFirstError } from "@/lib/validators";
import { buildRedirectUrl } from "@/lib/http";
import { User } from "@/models/User";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const submitted = {
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = authSchema.safeParse(submitted);

  if (!parsed.success) {
    redirect(
      buildRedirectUrl("/auth", {
        mode: "login",
        error: getFirstError(parsed.error),
        username: submitted.username,
      }),
    );
  }

  await connectToDatabase();

  const user = await User.findOne({ username: parsed.data.username }).lean();

  if (!user) {
    redirect(
      buildRedirectUrl("/auth", {
        mode: "login",
        error: "Invalid username or password.",
        username: submitted.username,
      }),
    );
  }

  const isValidPassword = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!isValidPassword) {
    redirect(
      buildRedirectUrl("/auth", {
        mode: "login",
        error: "Invalid username or password.",
        username: submitted.username,
      }),
    );
  }

  await createSession({ userId: String(user._id), username: user.username, isAdmin: user.isAdmin ?? false });
  redirect("/board");
}

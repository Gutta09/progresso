import { connectToDatabase } from "@/lib/mongodb";
import { createSession, hashPassword } from "@/lib/auth";
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
        mode: "register",
        error: getFirstError(parsed.error),
        username: submitted.username,
      }),
    );
  }

  await connectToDatabase();

  const existingUser = await User.findOne(
    { username: parsed.data.username },
    { _id: 1 },
  ).lean();

  if (existingUser) {
    redirect(
      buildRedirectUrl("/auth", {
        mode: "register",
        error: "Username is already taken.",
        username: submitted.username,
      }),
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await User.create({
    username: parsed.data.username,
    passwordHash,
  });

  await createSession({ userId: String(user._id), username: user.username });
  redirect("/board");
}

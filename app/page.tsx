import { LoginButton } from "@/components/ui/auth/LoginButton";
import { User } from "@/components/ui/auth/User";
import { getAuthSession } from "@/lib/auth";

export default async function Home() {
  const session = await getAuthSession();
  if (session) {
    return <User />;
  }
  return (
    <div>
      <LoginButton />
    </div>
  );
}

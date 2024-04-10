import { BuyButton } from "../stripe/BuyButton";
import { LogoutButton } from "./LogoutButton";
import { getAuthSession } from "@/lib/auth";

export const User = async () => {
  const session = await getAuthSession();

  if (!session?.user) {
    return <p>NO USER !!</p>;
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="avatar">
          <div className="w-24 rouended">
            <img src={session.user.image ?? ""} />
          </div>
        </div>
        <h2 className="card-title">{session.user.name}</h2>
        <p>{session.user.email}</p>
        <p className="text-xs italic text-gray-300">{session.user.id}</p>
        <div className="card-action justify-end">
          <LogoutButton />
          <BuyButton />
        </div>
      </div>
    </div>
  );
};

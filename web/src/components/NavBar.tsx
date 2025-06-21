import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function NavBar() {
  const { user, signOut } = useAuth();
  return (
    <nav className="flex items-center justify-between px-4 py-2 border-b">
      <Link href="/" className="text-lg font-bold">
        Dice Deals
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm">{user.email}</span>
            <button
              className="text-sm text-red-600 hover:underline"
              onClick={() => signOut()}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm hover:underline">
              Login
            </Link>
            <Link href="/register" className="text-sm hover:underline">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

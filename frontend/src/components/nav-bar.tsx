import { useAuth } from "react-oidc-context";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ClipboardList, LogOut, ScanLine } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";
import { Link } from "react-router";

const NavBar: React.FC = () => {
  const { user, signoutRedirect } = useAuth();
  const { isOrganizer, isStaff } = useRoles();

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/90 text-white backdrop-blur-xl">
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-10 md:gap-20 items-center">
            <Link to="/" className="text-xl font-bold tracking-tight">
              Event<span className="text-violet-400">Pilot</span>
            </Link>
            <div className="hidden text-gray-300 sm:flex gap-6">
              <Link className="hover:text-white" to="/">Discover</Link>
              {isOrganizer && <Link to="/dashboard/events">Events</Link>}
              <Link className="hover:text-white" to="/dashboard/tickets">My Tickets</Link>
              <Link className="flex items-center gap-1 hover:text-white" to="/dashboard/orders">
                <ClipboardList className="h-4 w-4" /> My Orders
              </Link>
              {isStaff && (
                <Link className="flex items-center gap-1 hover:text-white" to="/dashboard/validate-qr">
                  <ScanLine className="h-4 w-4" /> Scan
                </Link>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gray-700">
                  {user?.profile?.preferred_username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-gray-900 border-gray-700 text-white"
              align="end"
            >
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">
                  {user?.profile?.preferred_username}
                </p>
                <p className="text-sm text-gray-400">{user?.profile?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="hover:bg-gray-800"
                onClick={() => signoutRedirect()}
              >
                <LogOut />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default NavBar;

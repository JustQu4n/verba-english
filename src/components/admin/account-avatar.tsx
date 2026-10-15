import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { pickInitials } from "@/lib/profile-display";
import { cn } from "@/lib/utils";

/** A picture, or the initials when there is none (or it cannot be loaded). */
export function AccountAvatar({ name, avatarUrl, className }: { name: string; avatarUrl: string | null; className?: string }) {
  return (
    <Avatar className={cn("size-10", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback>{pickInitials(name)}</AvatarFallback>
    </Avatar>
  );
}

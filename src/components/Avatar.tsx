import { imageUrl } from "@/lib/images-url";

/** Foto de perfil, ou a inicial do nome quando não há foto. */
export function Avatar({ user, size = "" }: { user: { username: string; storeName?: string; avatarId?: string | null }; size?: "" | "lg" | "xl" }) {
  const name = user.storeName || user.username;
  return user.avatarId ? (
    <img className={`avatar ${size}`} src={imageUrl(user.avatarId, true)} alt="" />
  ) : (
    <span className={`avatar ${size}`}>{name[0]}</span>
  );
}

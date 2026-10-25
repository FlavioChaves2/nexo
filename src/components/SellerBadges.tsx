import { sellerLevel, type SellerRep } from "@/lib/reputation";
import { Icon } from "./Icon";

/** Selo de verificado + nível do vendedor. */
export function SellerBadges({ rep, compact = false }: { rep: SellerRep; compact?: boolean }) {
  const level = sellerLevel(rep);
  return (
    <>
      {rep.verification === "APROVADO" && (
        <span className="verified" title="Vendedor verificado">
          <Icon name="verified" />
        </span>
      )}
      {(!compact || level.cls !== "novato") && <span className={`level ${level.cls}`}>{level.name}</span>}
    </>
  );
}

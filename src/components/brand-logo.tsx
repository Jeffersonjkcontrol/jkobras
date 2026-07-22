import { HardHat } from "lucide-react";

/** Marca do escritório: logo (data URL) se houver, senão ícone + nome. */
export function BrandLogo({ logoData, nome }: { logoData?: string | null; nome: string }) {
  if (logoData) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoData} alt={nome} className="max-h-10 max-w-[190px] object-contain" />
    );
  }
  return (
    <>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <HardHat className="h-5 w-5" />
      </div>
      <span className="truncate font-bold text-foreground">{nome}</span>
    </>
  );
}

import { Monitor, Moon, Sun, Rows3, Rows4, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppearance, type Density, type Theme } from "@/hooks/use-appearance";

export function AppearanceMenu() {
  const { theme, density, setTheme, setDensity } = useAppearance();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Aparência" aria-label="Aparência">
          <Settings2 className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          <DropdownMenuRadioItem value="light"><Sun className="w-4 h-4 mr-2" />Claro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark"><Moon className="w-4 h-4 mr-2" />Escuro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system"><Monitor className="w-4 h-4 mr-2" />Sistema</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Densidade</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={density} onValueChange={(v) => setDensity(v as Density)}>
          <DropdownMenuRadioItem value="comfortable"><Rows3 className="w-4 h-4 mr-2" />Confortável</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="compact"><Rows4 className="w-4 h-4 mr-2" />Compacta</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

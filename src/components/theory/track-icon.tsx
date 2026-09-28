import {
  BookOpen,
  Boxes,
  Dices,
  Layers,
  Network,
  Puzzle,
  Search,
  Sigma,
  TextCursorInput,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  book: BookOpen,
  zap: Zap,
  sigma: Sigma,
  boxes: Boxes,
  layers: Layers,
  text: TextCursorInput,
  network: Network,
  dices: Dices,
  search: Search,
  puzzle: Puzzle,
};

export function TrackIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? BookOpen;
  return <Icon className={className} aria-hidden />;
}

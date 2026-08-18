import type { ReactNode } from "react";
import {
  Smartphone,
  WalletCards,
  BadgeCheck,
  BriefcaseBusiness,
  KeyRound,
  Gem,
  Zap,
  FileText,
  Shirt,
  PawPrint,
  GraduationCap,
  PackageSearch,
} from "lucide-react";
import type { ItemCategory } from "@/types/database";

/**
 * A distinct icon for every item category, shared by the lost and found
 * listing pages so the full category set can be shown at a glance.
 */
export const CATEGORY_ICONS: Record<ItemCategory, ReactNode> = {
  phones: <Smartphone size={20} />,
  wallets: <WalletCards size={20} />,
  ids: <BadgeCheck size={20} />,
  bags: <BriefcaseBusiness size={20} />,
  keys: <KeyRound size={20} />,
  jewelry: <Gem size={20} />,
  electronics: <Zap size={20} />,
  documents: <FileText size={20} />,
  clothing: <Shirt size={20} />,
  pets: <PawPrint size={20} />,
  school_items: <GraduationCap size={20} />,
  other: <PackageSearch size={20} />,
};

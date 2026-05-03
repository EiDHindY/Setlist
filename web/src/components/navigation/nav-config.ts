import { Home, User, Music2, ListMusic, Mic2, Disc3, Sliders, Headphones, LucideIcon } from 'lucide-react';
import BumpingHeadphonesIcon from '../icons/BumpingHeadphonesIcon';
import BleedingClashIcon from '../icons/BleedingClashIcon';
import SyncedHeadsetsIcon from '../icons/SyncedHeadsetsIcon';

export interface TabConfig {
  id: number;
  label: string;
  icon?: LucideIcon;
  customIcon?: React.FC<{ isActive: boolean; size: number }>;
}

export interface SubTabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const tabs: TabConfig[] = [
  { id: 0, label: 'HOME', icon: Home },
  { id: 1, label: 'COLLECTION', customIcon: BumpingHeadphonesIcon },
  { id: 2, label: 'CLASH', customIcon: BleedingClashIcon },
  { id: 3, label: 'PARTY', customIcon: SyncedHeadsetsIcon },
  { id: 4, label: 'PROFILE', icon: User },
];

export const collectionSubTabs: SubTabConfig[] = [
  { id: 'songs',     label: 'Songs',     icon: Music2    },
  { id: 'setlists',  label: 'Setlists',  icon: ListMusic },
  { id: 'artists',   label: 'Artists',   icon: Mic2      },
  { id: 'albums',    label: 'Albums',    icon: Disc3     },
  { id: 'producers', label: 'Producers', icon: Sliders   },
  { id: 'mixers',    label: 'Mixers',    icon: Headphones},
];

export interface SideNavProps {
  avatarUrl?: string;
  activeTab?: number;
  onTabChange?: (tabId: number) => void;
  activeSubTab?: string;
  onSubTabChange?: (subId: string) => void;
  isHidden?: boolean;
}

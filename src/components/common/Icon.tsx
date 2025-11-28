import { lazy, Suspense } from 'react';
import type { LucideProps } from 'lucide-react';
import type { PromptIconName } from '../../config/constants';

// Dynamic icon import mapping
const iconComponents: Record<PromptIconName, React.LazyExoticComponent<React.FC<LucideProps>>> = {
  // Documents & Text
  'file-text': lazy(() => import('lucide-react').then(m => ({ default: m.FileText }))),
  'message-square': lazy(() => import('lucide-react').then(m => ({ default: m.MessageSquare }))),
  'align-left': lazy(() => import('lucide-react').then(m => ({ default: m.AlignLeft }))),
  'type': lazy(() => import('lucide-react').then(m => ({ default: m.Type }))),
  'list': lazy(() => import('lucide-react').then(m => ({ default: m.List }))),
  'clipboard': lazy(() => import('lucide-react').then(m => ({ default: m.Clipboard }))),
  'file-code': lazy(() => import('lucide-react').then(m => ({ default: m.FileCode }))),
  // Development
  'code': lazy(() => import('lucide-react').then(m => ({ default: m.Code }))),
  'terminal': lazy(() => import('lucide-react').then(m => ({ default: m.Terminal }))),
  'git-branch': lazy(() => import('lucide-react').then(m => ({ default: m.GitBranch }))),
  'database': lazy(() => import('lucide-react').then(m => ({ default: m.Database }))),
  'bug': lazy(() => import('lucide-react').then(m => ({ default: m.Bug }))),
  'cpu': lazy(() => import('lucide-react').then(m => ({ default: m.Cpu }))),
  'braces': lazy(() => import('lucide-react').then(m => ({ default: m.Braces }))),
  // Actions & Workflow
  'edit': lazy(() => import('lucide-react').then(m => ({ default: m.Edit }))),
  'pen-tool': lazy(() => import('lucide-react').then(m => ({ default: m.PenTool }))),
  'send': lazy(() => import('lucide-react').then(m => ({ default: m.Send }))),
  'mail': lazy(() => import('lucide-react').then(m => ({ default: m.Mail }))),
  'search': lazy(() => import('lucide-react').then(m => ({ default: m.Search }))),
  'settings': lazy(() => import('lucide-react').then(m => ({ default: m.Settings }))),
  'wrench': lazy(() => import('lucide-react').then(m => ({ default: m.Wrench }))),
  'check-circle': lazy(() => import('lucide-react').then(m => ({ default: m.CheckCircle }))),
  'help-circle': lazy(() => import('lucide-react').then(m => ({ default: m.HelpCircle }))),
  'info': lazy(() => import('lucide-react').then(m => ({ default: m.Info }))),
  // Organization
  'bookmark': lazy(() => import('lucide-react').then(m => ({ default: m.Bookmark }))),
  'tag': lazy(() => import('lucide-react').then(m => ({ default: m.Tag }))),
  'folder': lazy(() => import('lucide-react').then(m => ({ default: m.Folder }))),
  'archive': lazy(() => import('lucide-react').then(m => ({ default: m.Archive }))),
  'inbox': lazy(() => import('lucide-react').then(m => ({ default: m.Inbox }))),
  'layers': lazy(() => import('lucide-react').then(m => ({ default: m.Layers }))),
  // People & Social
  'user': lazy(() => import('lucide-react').then(m => ({ default: m.User }))),
  'users': lazy(() => import('lucide-react').then(m => ({ default: m.Users }))),
  'smile': lazy(() => import('lucide-react').then(m => ({ default: m.Smile }))),
  'meh': lazy(() => import('lucide-react').then(m => ({ default: m.Meh }))),
  'frown': lazy(() => import('lucide-react').then(m => ({ default: m.Frown }))),
  // Fun & Expression
  'star': lazy(() => import('lucide-react').then(m => ({ default: m.Star }))),
  'heart': lazy(() => import('lucide-react').then(m => ({ default: m.Heart }))),
  'zap': lazy(() => import('lucide-react').then(m => ({ default: m.Zap }))),
  'lightbulb': lazy(() => import('lucide-react').then(m => ({ default: m.Lightbulb }))),
  'sparkles': lazy(() => import('lucide-react').then(m => ({ default: m.Sparkles }))),
  'flame': lazy(() => import('lucide-react').then(m => ({ default: m.Flame }))),
  'rocket': lazy(() => import('lucide-react').then(m => ({ default: m.Rocket }))),
  'trophy': lazy(() => import('lucide-react').then(m => ({ default: m.Trophy }))),
  'crown': lazy(() => import('lucide-react').then(m => ({ default: m.Crown }))),
  'gem': lazy(() => import('lucide-react').then(m => ({ default: m.Gem }))),
  'gift': lazy(() => import('lucide-react').then(m => ({ default: m.Gift }))),
  // Nature & Weather
  'sun': lazy(() => import('lucide-react').then(m => ({ default: m.Sun }))),
  'moon': lazy(() => import('lucide-react').then(m => ({ default: m.Moon }))),
  'cloud': lazy(() => import('lucide-react').then(m => ({ default: m.Cloud }))),
  'snowflake': lazy(() => import('lucide-react').then(m => ({ default: m.Snowflake }))),
  'umbrella': lazy(() => import('lucide-react').then(m => ({ default: m.Umbrella }))),
  'leaf': lazy(() => import('lucide-react').then(m => ({ default: m.Leaf }))),
  // Food & Drink
  'coffee': lazy(() => import('lucide-react').then(m => ({ default: m.Coffee }))),
  'pizza': lazy(() => import('lucide-react').then(m => ({ default: m.Pizza }))),
  'apple': lazy(() => import('lucide-react').then(m => ({ default: m.Apple }))),
  'cookie': lazy(() => import('lucide-react').then(m => ({ default: m.Cookie }))),
  'cake': lazy(() => import('lucide-react').then(m => ({ default: m.Cake }))),
  'wine': lazy(() => import('lucide-react').then(m => ({ default: m.Wine }))),
  'beer': lazy(() => import('lucide-react').then(m => ({ default: m.Beer }))),
  // Animals
  'cat': lazy(() => import('lucide-react').then(m => ({ default: m.Cat }))),
  'dog': lazy(() => import('lucide-react').then(m => ({ default: m.Dog }))),
  'bird': lazy(() => import('lucide-react').then(m => ({ default: m.Bird }))),
  'fish': lazy(() => import('lucide-react').then(m => ({ default: m.Fish }))),
  'rabbit': lazy(() => import('lucide-react').then(m => ({ default: m.Rabbit }))),
  // Media & Entertainment
  'music': lazy(() => import('lucide-react').then(m => ({ default: m.Music }))),
  'video': lazy(() => import('lucide-react').then(m => ({ default: m.Video }))),
  'image': lazy(() => import('lucide-react').then(m => ({ default: m.Image }))),
  'camera': lazy(() => import('lucide-react').then(m => ({ default: m.Camera }))),
  'mic': lazy(() => import('lucide-react').then(m => ({ default: m.Mic }))),
  'headphones': lazy(() => import('lucide-react').then(m => ({ default: m.Headphones }))),
  'gamepad-2': lazy(() => import('lucide-react').then(m => ({ default: m.Gamepad2 }))),
  'tv': lazy(() => import('lucide-react').then(m => ({ default: m.Tv }))),
  'radio': lazy(() => import('lucide-react').then(m => ({ default: m.Radio }))),
  // Travel & Places
  'globe': lazy(() => import('lucide-react').then(m => ({ default: m.Globe }))),
  'map': lazy(() => import('lucide-react').then(m => ({ default: m.Map }))),
  'compass': lazy(() => import('lucide-react').then(m => ({ default: m.Compass }))),
  'plane': lazy(() => import('lucide-react').then(m => ({ default: m.Plane }))),
  'car': lazy(() => import('lucide-react').then(m => ({ default: m.Car }))),
  'bike': lazy(() => import('lucide-react').then(m => ({ default: m.Bike }))),
  'home': lazy(() => import('lucide-react').then(m => ({ default: m.Home }))),
  'building': lazy(() => import('lucide-react').then(m => ({ default: m.Building }))),
  // Time & Calendar
  'calendar': lazy(() => import('lucide-react').then(m => ({ default: m.Calendar }))),
  'clock': lazy(() => import('lucide-react').then(m => ({ default: m.Clock }))),
  'timer': lazy(() => import('lucide-react').then(m => ({ default: m.Timer }))),
  'hourglass': lazy(() => import('lucide-react').then(m => ({ default: m.Hourglass }))),
  // Business
  'briefcase': lazy(() => import('lucide-react').then(m => ({ default: m.Briefcase }))),
  'wallet': lazy(() => import('lucide-react').then(m => ({ default: m.Wallet }))),
  'credit-card': lazy(() => import('lucide-react').then(m => ({ default: m.CreditCard }))),
  'shopping-cart': lazy(() => import('lucide-react').then(m => ({ default: m.ShoppingCart }))),
  // Misc
  'puzzle': lazy(() => import('lucide-react').then(m => ({ default: m.Puzzle }))),
  'palette': lazy(() => import('lucide-react').then(m => ({ default: m.Palette }))),
  'scissors': lazy(() => import('lucide-react').then(m => ({ default: m.Scissors }))),
  'glasses': lazy(() => import('lucide-react').then(m => ({ default: m.Glasses }))),
  'wand-2': lazy(() => import('lucide-react').then(m => ({ default: m.Wand2 }))),
};

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: PromptIconName;
}

export function Icon({ name, size = 16, ...props }: IconProps) {
  const IconComponent = iconComponents[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <Suspense fallback={<span style={{ width: size, height: size, display: 'inline-block' }} />}>
      <IconComponent size={size} {...props} />
    </Suspense>
  );
}

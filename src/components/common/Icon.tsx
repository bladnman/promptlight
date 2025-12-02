import { lazy, Suspense } from 'react';
import type { LucideProps } from 'lucide-react';

// Import the icon list from iconData for type safety
import { PROMPT_ICONS } from '../../config/iconData';

// Create a union type from the icon names
export type IconName = (typeof PROMPT_ICONS)[number];

// Dynamic icon import mapping - must include ALL icons from iconData.ts
const iconComponents: Record<string, React.LazyExoticComponent<React.FC<LucideProps>>> = {
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

  // NEW ICONS - AI & Technology
  'bot': lazy(() => import('lucide-react').then(m => ({ default: m.Bot }))),
  'brain': lazy(() => import('lucide-react').then(m => ({ default: m.Brain }))),
  'circuit-board': lazy(() => import('lucide-react').then(m => ({ default: m.CircuitBoard }))),
  'wifi': lazy(() => import('lucide-react').then(m => ({ default: m.Wifi }))),
  'bluetooth': lazy(() => import('lucide-react').then(m => ({ default: m.Bluetooth }))),
  'smartphone': lazy(() => import('lucide-react').then(m => ({ default: m.Smartphone }))),
  'tablet': lazy(() => import('lucide-react').then(m => ({ default: m.Tablet }))),
  'laptop': lazy(() => import('lucide-react').then(m => ({ default: m.Laptop }))),
  'monitor': lazy(() => import('lucide-react').then(m => ({ default: m.Monitor }))),
  'server': lazy(() => import('lucide-react').then(m => ({ default: m.Server }))),

  // NEW ICONS - Communication
  'phone': lazy(() => import('lucide-react').then(m => ({ default: m.Phone }))),
  'phone-call': lazy(() => import('lucide-react').then(m => ({ default: m.PhoneCall }))),
  'video-off': lazy(() => import('lucide-react').then(m => ({ default: m.VideoOff }))),
  'mic-off': lazy(() => import('lucide-react').then(m => ({ default: m.MicOff }))),
  'volume-2': lazy(() => import('lucide-react').then(m => ({ default: m.Volume2 }))),
  'bell': lazy(() => import('lucide-react').then(m => ({ default: m.Bell }))),
  'bell-off': lazy(() => import('lucide-react').then(m => ({ default: m.BellOff }))),
  'at-sign': lazy(() => import('lucide-react').then(m => ({ default: m.AtSign }))),

  // NEW ICONS - Arrows & Navigation
  'arrow-up': lazy(() => import('lucide-react').then(m => ({ default: m.ArrowUp }))),
  'arrow-down': lazy(() => import('lucide-react').then(m => ({ default: m.ArrowDown }))),
  'arrow-left': lazy(() => import('lucide-react').then(m => ({ default: m.ArrowLeft }))),
  'arrow-right': lazy(() => import('lucide-react').then(m => ({ default: m.ArrowRight }))),
  'chevron-up': lazy(() => import('lucide-react').then(m => ({ default: m.ChevronUp }))),
  'chevron-down': lazy(() => import('lucide-react').then(m => ({ default: m.ChevronDown }))),
  'refresh-cw': lazy(() => import('lucide-react').then(m => ({ default: m.RefreshCw }))),
  'rotate-cw': lazy(() => import('lucide-react').then(m => ({ default: m.RotateCw }))),

  // NEW ICONS - Status & Feedback
  'check': lazy(() => import('lucide-react').then(m => ({ default: m.Check }))),
  'x': lazy(() => import('lucide-react').then(m => ({ default: m.X }))),
  'alert-circle': lazy(() => import('lucide-react').then(m => ({ default: m.AlertCircle }))),
  'alert-triangle': lazy(() => import('lucide-react').then(m => ({ default: m.AlertTriangle }))),
  'x-circle': lazy(() => import('lucide-react').then(m => ({ default: m.XCircle }))),
  'loader': lazy(() => import('lucide-react').then(m => ({ default: m.Loader }))),
  'ban': lazy(() => import('lucide-react').then(m => ({ default: m.Ban }))),

  // NEW ICONS - Files & Documents
  'file': lazy(() => import('lucide-react').then(m => ({ default: m.File }))),
  'file-plus': lazy(() => import('lucide-react').then(m => ({ default: m.FilePlus }))),
  'file-minus': lazy(() => import('lucide-react').then(m => ({ default: m.FileMinus }))),
  'file-check': lazy(() => import('lucide-react').then(m => ({ default: m.FileCheck }))),
  'file-x': lazy(() => import('lucide-react').then(m => ({ default: m.FileX }))),
  'files': lazy(() => import('lucide-react').then(m => ({ default: m.Files }))),
  'folder-plus': lazy(() => import('lucide-react').then(m => ({ default: m.FolderPlus }))),
  'folder-open': lazy(() => import('lucide-react').then(m => ({ default: m.FolderOpen }))),

  // NEW ICONS - Editing & Actions
  'copy': lazy(() => import('lucide-react').then(m => ({ default: m.Copy }))),
  'clipboard-copy': lazy(() => import('lucide-react').then(m => ({ default: m.ClipboardCopy }))),
  'clipboard-check': lazy(() => import('lucide-react').then(m => ({ default: m.ClipboardCheck }))),
  'trash': lazy(() => import('lucide-react').then(m => ({ default: m.Trash }))),
  'trash-2': lazy(() => import('lucide-react').then(m => ({ default: m.Trash2 }))),
  'save': lazy(() => import('lucide-react').then(m => ({ default: m.Save }))),
  'download': lazy(() => import('lucide-react').then(m => ({ default: m.Download }))),
  'upload': lazy(() => import('lucide-react').then(m => ({ default: m.Upload }))),
  'external-link': lazy(() => import('lucide-react').then(m => ({ default: m.ExternalLink }))),
  'link': lazy(() => import('lucide-react').then(m => ({ default: m.Link }))),
  'unlink': lazy(() => import('lucide-react').then(m => ({ default: m.Unlink }))),

  // NEW ICONS - Layout & UI
  'layout': lazy(() => import('lucide-react').then(m => ({ default: m.Layout }))),
  'grid': lazy(() => import('lucide-react').then(m => ({ default: m.Grid }))),
  'sidebar': lazy(() => import('lucide-react').then(m => ({ default: m.Sidebar }))),
  'columns': lazy(() => import('lucide-react').then(m => ({ default: m.Columns }))),
  'rows': lazy(() => import('lucide-react').then(m => ({ default: m.Rows }))),
  'maximize': lazy(() => import('lucide-react').then(m => ({ default: m.Maximize }))),
  'minimize': lazy(() => import('lucide-react').then(m => ({ default: m.Minimize }))),
  'move': lazy(() => import('lucide-react').then(m => ({ default: m.Move }))),

  // NEW ICONS - Formatting
  'bold': lazy(() => import('lucide-react').then(m => ({ default: m.Bold }))),
  'italic': lazy(() => import('lucide-react').then(m => ({ default: m.Italic }))),
  'underline': lazy(() => import('lucide-react').then(m => ({ default: m.Underline }))),
  'strikethrough': lazy(() => import('lucide-react').then(m => ({ default: m.Strikethrough }))),
  'heading': lazy(() => import('lucide-react').then(m => ({ default: m.Heading }))),
  'quote': lazy(() => import('lucide-react').then(m => ({ default: m.Quote }))),
  'list-ordered': lazy(() => import('lucide-react').then(m => ({ default: m.ListOrdered }))),
  'list-todo': lazy(() => import('lucide-react').then(m => ({ default: m.ListTodo }))),

  // NEW ICONS - Security & Privacy
  'lock': lazy(() => import('lucide-react').then(m => ({ default: m.Lock }))),
  'unlock': lazy(() => import('lucide-react').then(m => ({ default: m.Unlock }))),
  'key': lazy(() => import('lucide-react').then(m => ({ default: m.Key }))),
  'shield': lazy(() => import('lucide-react').then(m => ({ default: m.Shield }))),
  'shield-check': lazy(() => import('lucide-react').then(m => ({ default: m.ShieldCheck }))),
  'eye': lazy(() => import('lucide-react').then(m => ({ default: m.Eye }))),
  'eye-off': lazy(() => import('lucide-react').then(m => ({ default: m.EyeOff }))),

  // NEW ICONS - Social & Sharing
  'share': lazy(() => import('lucide-react').then(m => ({ default: m.Share }))),
  'share-2': lazy(() => import('lucide-react').then(m => ({ default: m.Share2 }))),
  'thumbs-up': lazy(() => import('lucide-react').then(m => ({ default: m.ThumbsUp }))),
  'thumbs-down': lazy(() => import('lucide-react').then(m => ({ default: m.ThumbsDown }))),
  'message-circle': lazy(() => import('lucide-react').then(m => ({ default: m.MessageCircle }))),
  'messages-square': lazy(() => import('lucide-react').then(m => ({ default: m.MessagesSquare }))),
  'hash': lazy(() => import('lucide-react').then(m => ({ default: m.Hash }))),
  'flag': lazy(() => import('lucide-react').then(m => ({ default: m.Flag }))),

  // NEW ICONS - Charts & Data
  'bar-chart': lazy(() => import('lucide-react').then(m => ({ default: m.BarChart }))),
  'bar-chart-2': lazy(() => import('lucide-react').then(m => ({ default: m.BarChart2 }))),
  'pie-chart': lazy(() => import('lucide-react').then(m => ({ default: m.PieChart }))),
  'line-chart': lazy(() => import('lucide-react').then(m => ({ default: m.LineChart }))),
  'trending-up': lazy(() => import('lucide-react').then(m => ({ default: m.TrendingUp }))),
  'trending-down': lazy(() => import('lucide-react').then(m => ({ default: m.TrendingDown }))),
  'activity': lazy(() => import('lucide-react').then(m => ({ default: m.Activity }))),
  'percent': lazy(() => import('lucide-react').then(m => ({ default: m.Percent }))),

  // NEW ICONS - Shapes & Design
  'circle': lazy(() => import('lucide-react').then(m => ({ default: m.Circle }))),
  'square': lazy(() => import('lucide-react').then(m => ({ default: m.Square }))),
  'triangle': lazy(() => import('lucide-react').then(m => ({ default: m.Triangle }))),
  'hexagon': lazy(() => import('lucide-react').then(m => ({ default: m.Hexagon }))),
  'octagon': lazy(() => import('lucide-react').then(m => ({ default: m.Octagon }))),
  'plus': lazy(() => import('lucide-react').then(m => ({ default: m.Plus }))),
  'minus': lazy(() => import('lucide-react').then(m => ({ default: m.Minus }))),
  'divide': lazy(() => import('lucide-react').then(m => ({ default: m.Divide }))),

  // NEW ICONS - More Categories
  'target': lazy(() => import('lucide-react').then(m => ({ default: m.Target }))),
  'crosshair': lazy(() => import('lucide-react').then(m => ({ default: m.Crosshair }))),
  'anchor': lazy(() => import('lucide-react').then(m => ({ default: m.Anchor }))),
  'navigation': lazy(() => import('lucide-react').then(m => ({ default: m.Navigation }))),
  'power': lazy(() => import('lucide-react').then(m => ({ default: m.Power }))),
  'battery': lazy(() => import('lucide-react').then(m => ({ default: m.Battery }))),
  'plug': lazy(() => import('lucide-react').then(m => ({ default: m.Plug }))),
  'sliders': lazy(() => import('lucide-react').then(m => ({ default: m.Sliders }))),
  'filter': lazy(() => import('lucide-react').then(m => ({ default: m.Filter }))),
  'sort-asc': lazy(() => import('lucide-react').then(m => ({ default: m.SortAsc }))),
  'sort-desc': lazy(() => import('lucide-react').then(m => ({ default: m.SortDesc }))),

  // NEW ICONS - Miscellaneous
  'package': lazy(() => import('lucide-react').then(m => ({ default: m.Package }))),
  'truck': lazy(() => import('lucide-react').then(m => ({ default: m.Truck }))),
  'ship': lazy(() => import('lucide-react').then(m => ({ default: m.Ship }))),
  'train': lazy(() => import('lucide-react').then(m => ({ default: m.Train }))),
  'construction': lazy(() => import('lucide-react').then(m => ({ default: m.Construction }))),
  'hammer': lazy(() => import('lucide-react').then(m => ({ default: m.Hammer }))),
  'ruler': lazy(() => import('lucide-react').then(m => ({ default: m.Ruler }))),
  'pencil': lazy(() => import('lucide-react').then(m => ({ default: m.Pencil }))),
  'eraser': lazy(() => import('lucide-react').then(m => ({ default: m.Eraser }))),
  'highlighter': lazy(() => import('lucide-react').then(m => ({ default: m.Highlighter }))),
  'brush': lazy(() => import('lucide-react').then(m => ({ default: m.Brush }))),
  'spray-can': lazy(() => import('lucide-react').then(m => ({ default: m.SprayCan }))),
  'pipette': lazy(() => import('lucide-react').then(m => ({ default: m.Pipette }))),
  'crop': lazy(() => import('lucide-react').then(m => ({ default: m.Crop }))),
  'scan': lazy(() => import('lucide-react').then(m => ({ default: m.Scan }))),
  'printer': lazy(() => import('lucide-react').then(m => ({ default: m.Printer }))),
  'log-in': lazy(() => import('lucide-react').then(m => ({ default: m.LogIn }))),
  'log-out': lazy(() => import('lucide-react').then(m => ({ default: m.LogOut }))),
  'user-plus': lazy(() => import('lucide-react').then(m => ({ default: m.UserPlus }))),
  'user-minus': lazy(() => import('lucide-react').then(m => ({ default: m.UserMinus }))),
  'user-check': lazy(() => import('lucide-react').then(m => ({ default: m.UserCheck }))),
  'award': lazy(() => import('lucide-react').then(m => ({ default: m.Award }))),
  'medal': lazy(() => import('lucide-react').then(m => ({ default: m.Medal }))),
  'graduation-cap': lazy(() => import('lucide-react').then(m => ({ default: m.GraduationCap }))),
  'book': lazy(() => import('lucide-react').then(m => ({ default: m.Book }))),
  'book-open': lazy(() => import('lucide-react').then(m => ({ default: m.BookOpen }))),
  'library': lazy(() => import('lucide-react').then(m => ({ default: m.Library }))),
  'newspaper': lazy(() => import('lucide-react').then(m => ({ default: m.Newspaper }))),
  'megaphone': lazy(() => import('lucide-react').then(m => ({ default: m.Megaphone }))),
  'siren': lazy(() => import('lucide-react').then(m => ({ default: m.Siren }))),
};

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: string;
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

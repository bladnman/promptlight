/**
 * Icon definitions with searchable keywords
 *
 * IMPORTANT: When adding new icons, you MUST:
 * 1. Add the icon definition here with 3-5 searchable keywords
 * 2. Add the lazy import to src/components/common/Icon.tsx
 * 3. The icon name must match a valid Lucide icon name
 */

/**
 * Icon definition with searchable keywords
 */
export interface IconDefinition {
  /** Icon name (must match Lucide icon name) */
  name: string;
  /** Searchable keywords (3-5 terms) */
  keywords: string[];
}

/**
 * All available icons with their searchable keywords.
 * Organized by category for maintainability.
 */
export const ICON_DEFINITIONS: IconDefinition[] = [
  // Documents & Text
  { name: 'file-text', keywords: ['document', 'text', 'file', 'paper', 'note'] },
  { name: 'message-square', keywords: ['chat', 'message', 'comment', 'bubble', 'conversation'] },
  { name: 'align-left', keywords: ['text', 'paragraph', 'format', 'align', 'left'] },
  { name: 'type', keywords: ['text', 'font', 'typography', 'letter', 'character'] },
  { name: 'list', keywords: ['bullet', 'items', 'todo', 'checklist', 'menu'] },
  { name: 'clipboard', keywords: ['copy', 'paste', 'board', 'notes', 'task'] },
  { name: 'file-code', keywords: ['code', 'programming', 'script', 'source', 'dev'] },

  // Development
  { name: 'code', keywords: ['programming', 'developer', 'coding', 'script', 'software'] },
  { name: 'terminal', keywords: ['console', 'command', 'shell', 'cli', 'prompt'] },
  { name: 'git-branch', keywords: ['version', 'branch', 'git', 'merge', 'code'] },
  { name: 'database', keywords: ['data', 'storage', 'sql', 'db', 'server'] },
  { name: 'bug', keywords: ['error', 'debug', 'issue', 'problem', 'fix'] },
  { name: 'cpu', keywords: ['processor', 'chip', 'hardware', 'computer', 'tech'] },
  { name: 'braces', keywords: ['code', 'json', 'object', 'curly', 'programming'] },

  // Actions & Workflow
  { name: 'edit', keywords: ['write', 'pencil', 'modify', 'change', 'update'] },
  { name: 'pen-tool', keywords: ['draw', 'design', 'create', 'art', 'vector'] },
  { name: 'send', keywords: ['submit', 'arrow', 'forward', 'email', 'message'] },
  { name: 'mail', keywords: ['email', 'letter', 'envelope', 'message', 'inbox'] },
  { name: 'search', keywords: ['find', 'look', 'magnify', 'query', 'explore'] },
  { name: 'settings', keywords: ['gear', 'config', 'options', 'preferences', 'cog'] },
  { name: 'wrench', keywords: ['tool', 'fix', 'repair', 'configure', 'build'] },
  { name: 'check-circle', keywords: ['done', 'complete', 'success', 'approve', 'yes'] },
  { name: 'help-circle', keywords: ['question', 'help', 'support', 'info', 'faq'] },
  { name: 'info', keywords: ['information', 'about', 'details', 'help', 'notice'] },

  // Organization
  { name: 'bookmark', keywords: ['save', 'favorite', 'mark', 'read', 'later'] },
  { name: 'tag', keywords: ['label', 'category', 'price', 'badge', 'mark'] },
  { name: 'folder', keywords: ['directory', 'files', 'organize', 'category', 'group'] },
  { name: 'archive', keywords: ['box', 'storage', 'backup', 'old', 'save'] },
  { name: 'inbox', keywords: ['mail', 'receive', 'messages', 'tray', 'input'] },
  { name: 'layers', keywords: ['stack', 'levels', 'design', 'multiple', 'arrange'] },

  // People & Social
  { name: 'user', keywords: ['person', 'profile', 'account', 'avatar', 'human'] },
  { name: 'users', keywords: ['people', 'team', 'group', 'members', 'community'] },
  { name: 'smile', keywords: ['happy', 'face', 'emoji', 'emotion', 'joy'] },
  { name: 'meh', keywords: ['neutral', 'face', 'emoji', 'emotion', 'okay'] },
  { name: 'frown', keywords: ['sad', 'face', 'emoji', 'emotion', 'unhappy'] },

  // Fun & Expression
  { name: 'star', keywords: ['favorite', 'rating', 'best', 'featured', 'important'] },
  { name: 'heart', keywords: ['love', 'like', 'favorite', 'health', 'care'] },
  { name: 'zap', keywords: ['lightning', 'power', 'energy', 'fast', 'electric'] },
  { name: 'lightbulb', keywords: ['idea', 'light', 'bright', 'innovation', 'tip'] },
  { name: 'sparkles', keywords: ['magic', 'new', 'special', 'ai', 'shine'] },
  { name: 'flame', keywords: ['fire', 'hot', 'trending', 'popular', 'burn'] },
  { name: 'rocket', keywords: ['launch', 'fast', 'startup', 'space', 'growth'] },
  { name: 'trophy', keywords: ['win', 'award', 'prize', 'champion', 'achievement'] },
  { name: 'crown', keywords: ['king', 'queen', 'royal', 'premium', 'best'] },
  { name: 'gem', keywords: ['diamond', 'jewel', 'precious', 'valuable', 'ruby'] },
  { name: 'gift', keywords: ['present', 'surprise', 'reward', 'bonus', 'wrap'] },

  // Nature & Weather
  { name: 'sun', keywords: ['day', 'light', 'bright', 'weather', 'sunny'] },
  { name: 'moon', keywords: ['night', 'dark', 'sleep', 'lunar', 'evening'] },
  { name: 'cloud', keywords: ['weather', 'sky', 'storage', 'upload', 'server'] },
  { name: 'snowflake', keywords: ['winter', 'cold', 'freeze', 'ice', 'snow'] },
  { name: 'umbrella', keywords: ['rain', 'weather', 'protect', 'shield', 'cover'] },
  { name: 'leaf', keywords: ['nature', 'plant', 'green', 'eco', 'tree'] },

  // Food & Drink
  { name: 'coffee', keywords: ['drink', 'cafe', 'morning', 'cup', 'caffeine'] },
  { name: 'pizza', keywords: ['food', 'meal', 'italian', 'slice', 'dinner'] },
  { name: 'apple', keywords: ['fruit', 'food', 'healthy', 'snack', 'red'] },
  { name: 'cookie', keywords: ['sweet', 'snack', 'treat', 'biscuit', 'dessert'] },
  { name: 'cake', keywords: ['birthday', 'dessert', 'sweet', 'celebrate', 'party'] },
  { name: 'wine', keywords: ['drink', 'alcohol', 'glass', 'celebrate', 'dinner'] },
  { name: 'beer', keywords: ['drink', 'alcohol', 'mug', 'pub', 'bar'] },

  // Animals
  { name: 'cat', keywords: ['pet', 'animal', 'kitten', 'feline', 'meow'] },
  { name: 'dog', keywords: ['pet', 'animal', 'puppy', 'canine', 'bark'] },
  { name: 'bird', keywords: ['animal', 'fly', 'tweet', 'feather', 'wing'] },
  { name: 'fish', keywords: ['animal', 'sea', 'ocean', 'aquarium', 'swim'] },
  { name: 'rabbit', keywords: ['animal', 'bunny', 'pet', 'hop', 'easter'] },

  // Media & Entertainment
  { name: 'music', keywords: ['audio', 'song', 'note', 'sound', 'play'] },
  { name: 'video', keywords: ['movie', 'film', 'play', 'watch', 'stream'] },
  { name: 'image', keywords: ['picture', 'photo', 'gallery', 'graphic', 'visual'] },
  { name: 'camera', keywords: ['photo', 'picture', 'capture', 'lens', 'shoot'] },
  { name: 'mic', keywords: ['microphone', 'audio', 'record', 'voice', 'podcast'] },
  { name: 'headphones', keywords: ['audio', 'music', 'listen', 'sound', 'earphones'] },
  { name: 'gamepad-2', keywords: ['game', 'play', 'controller', 'gaming', 'console'] },
  { name: 'tv', keywords: ['television', 'screen', 'watch', 'show', 'video'] },
  { name: 'radio', keywords: ['audio', 'broadcast', 'music', 'listen', 'fm'] },

  // Travel & Places
  { name: 'globe', keywords: ['world', 'earth', 'international', 'global', 'web'] },
  { name: 'map', keywords: ['location', 'navigate', 'direction', 'place', 'travel'] },
  { name: 'compass', keywords: ['direction', 'navigate', 'north', 'explore', 'guide'] },
  { name: 'plane', keywords: ['flight', 'travel', 'airplane', 'trip', 'vacation'] },
  { name: 'car', keywords: ['vehicle', 'drive', 'auto', 'transport', 'travel'] },
  { name: 'bike', keywords: ['bicycle', 'cycle', 'ride', 'exercise', 'transport'] },
  { name: 'home', keywords: ['house', 'building', 'residence', 'main', 'start'] },
  { name: 'building', keywords: ['office', 'company', 'business', 'tower', 'work'] },

  // Time & Calendar
  { name: 'calendar', keywords: ['date', 'schedule', 'event', 'plan', 'month'] },
  { name: 'clock', keywords: ['time', 'hour', 'watch', 'schedule', 'timer'] },
  { name: 'timer', keywords: ['countdown', 'stopwatch', 'time', 'measure', 'alarm'] },
  { name: 'hourglass', keywords: ['time', 'wait', 'sand', 'loading', 'patience'] },

  // Business
  { name: 'briefcase', keywords: ['work', 'job', 'business', 'career', 'office'] },
  { name: 'wallet', keywords: ['money', 'payment', 'cash', 'finance', 'cards'] },
  { name: 'credit-card', keywords: ['payment', 'money', 'buy', 'bank', 'purchase'] },
  { name: 'shopping-cart', keywords: ['buy', 'store', 'ecommerce', 'purchase', 'basket'] },

  // Misc
  { name: 'puzzle', keywords: ['piece', 'game', 'solve', 'fit', 'extension'] },
  { name: 'palette', keywords: ['color', 'art', 'paint', 'design', 'creative'] },
  { name: 'scissors', keywords: ['cut', 'trim', 'craft', 'edit', 'clip'] },
  { name: 'glasses', keywords: ['read', 'see', 'vision', 'look', 'spectacles'] },
  { name: 'wand-2', keywords: ['magic', 'wizard', 'ai', 'auto', 'transform'] },

  // NEW ICONS - AI & Technology
  { name: 'bot', keywords: ['robot', 'ai', 'assistant', 'automation', 'chat'] },
  { name: 'brain', keywords: ['ai', 'intelligence', 'thinking', 'mind', 'smart'] },
  { name: 'circuit-board', keywords: ['tech', 'hardware', 'electronic', 'chip', 'board'] },
  { name: 'wifi', keywords: ['internet', 'wireless', 'network', 'connect', 'signal'] },
  { name: 'bluetooth', keywords: ['wireless', 'connect', 'pair', 'device', 'audio'] },
  { name: 'smartphone', keywords: ['phone', 'mobile', 'device', 'cell', 'app'] },
  { name: 'tablet', keywords: ['device', 'ipad', 'screen', 'mobile', 'touch'] },
  { name: 'laptop', keywords: ['computer', 'device', 'work', 'portable', 'notebook'] },
  { name: 'monitor', keywords: ['screen', 'display', 'computer', 'desktop', 'view'] },
  { name: 'server', keywords: ['hosting', 'backend', 'cloud', 'data', 'network'] },

  // NEW ICONS - Communication
  { name: 'phone', keywords: ['call', 'contact', 'mobile', 'ring', 'dial'] },
  { name: 'phone-call', keywords: ['calling', 'ring', 'contact', 'dial', 'talk'] },
  { name: 'video-off', keywords: ['camera', 'mute', 'meeting', 'call', 'disabled'] },
  { name: 'mic-off', keywords: ['mute', 'silent', 'audio', 'disabled', 'quiet'] },
  { name: 'volume-2', keywords: ['sound', 'audio', 'speaker', 'loud', 'hear'] },
  { name: 'bell', keywords: ['notification', 'alert', 'ring', 'alarm', 'remind'] },
  { name: 'bell-off', keywords: ['mute', 'silent', 'notification', 'quiet', 'disabled'] },
  { name: 'at-sign', keywords: ['email', 'mention', 'address', 'contact', 'user'] },

  // NEW ICONS - Arrows & Navigation
  { name: 'arrow-up', keywords: ['up', 'direction', 'top', 'increase', 'north'] },
  { name: 'arrow-down', keywords: ['down', 'direction', 'bottom', 'decrease', 'south'] },
  { name: 'arrow-left', keywords: ['left', 'back', 'previous', 'west', 'return'] },
  { name: 'arrow-right', keywords: ['right', 'next', 'forward', 'east', 'continue'] },
  { name: 'chevron-up', keywords: ['up', 'expand', 'collapse', 'top', 'more'] },
  { name: 'chevron-down', keywords: ['down', 'expand', 'dropdown', 'bottom', 'more'] },
  { name: 'refresh-cw', keywords: ['reload', 'refresh', 'sync', 'update', 'rotate'] },
  { name: 'rotate-cw', keywords: ['rotate', 'turn', 'spin', 'clockwise', 'redo'] },

  // NEW ICONS - Status & Feedback
  { name: 'check', keywords: ['done', 'yes', 'confirm', 'approve', 'tick'] },
  { name: 'x', keywords: ['close', 'cancel', 'delete', 'remove', 'no'] },
  { name: 'alert-circle', keywords: ['warning', 'error', 'attention', 'caution', 'problem'] },
  { name: 'alert-triangle', keywords: ['warning', 'danger', 'caution', 'alert', 'error'] },
  { name: 'x-circle', keywords: ['error', 'close', 'cancel', 'wrong', 'fail'] },
  { name: 'loader', keywords: ['loading', 'wait', 'spinner', 'progress', 'busy'] },
  { name: 'ban', keywords: ['block', 'stop', 'forbidden', 'prohibited', 'no'] },

  // NEW ICONS - Files & Documents
  { name: 'file', keywords: ['document', 'page', 'blank', 'new', 'empty'] },
  { name: 'file-plus', keywords: ['new', 'add', 'create', 'document', 'upload'] },
  { name: 'file-minus', keywords: ['remove', 'delete', 'document', 'subtract', 'less'] },
  { name: 'file-check', keywords: ['verified', 'done', 'approved', 'document', 'complete'] },
  { name: 'file-x', keywords: ['delete', 'error', 'remove', 'document', 'cancel'] },
  { name: 'files', keywords: ['documents', 'multiple', 'copy', 'duplicate', 'batch'] },
  { name: 'folder-plus', keywords: ['new', 'add', 'create', 'directory', 'folder'] },
  { name: 'folder-open', keywords: ['open', 'browse', 'explore', 'directory', 'contents'] },

  // NEW ICONS - Editing & Actions
  { name: 'copy', keywords: ['duplicate', 'clone', 'paste', 'clipboard', 'replicate'] },
  { name: 'clipboard-copy', keywords: ['copy', 'paste', 'duplicate', 'clipboard', 'text'] },
  { name: 'clipboard-check', keywords: ['task', 'done', 'complete', 'verified', 'checklist'] },
  { name: 'trash', keywords: ['delete', 'remove', 'garbage', 'bin', 'discard'] },
  { name: 'trash-2', keywords: ['delete', 'remove', 'garbage', 'bin', 'discard'] },
  { name: 'save', keywords: ['disk', 'store', 'file', 'preserve', 'download'] },
  { name: 'download', keywords: ['save', 'get', 'arrow', 'receive', 'import'] },
  { name: 'upload', keywords: ['send', 'put', 'arrow', 'share', 'export'] },
  { name: 'external-link', keywords: ['open', 'new', 'tab', 'window', 'redirect'] },
  { name: 'link', keywords: ['url', 'chain', 'connect', 'hyperlink', 'attach'] },
  { name: 'unlink', keywords: ['disconnect', 'break', 'remove', 'detach', 'separate'] },

  // NEW ICONS - Layout & UI
  { name: 'layout', keywords: ['grid', 'design', 'template', 'structure', 'arrange'] },
  { name: 'grid', keywords: ['layout', 'table', 'squares', 'gallery', 'view'] },
  { name: 'sidebar', keywords: ['panel', 'menu', 'layout', 'navigation', 'drawer'] },
  { name: 'columns', keywords: ['layout', 'grid', 'split', 'divide', 'sections'] },
  { name: 'rows', keywords: ['layout', 'lines', 'horizontal', 'list', 'table'] },
  { name: 'maximize', keywords: ['fullscreen', 'expand', 'enlarge', 'big', 'grow'] },
  { name: 'minimize', keywords: ['shrink', 'reduce', 'small', 'collapse', 'hide'] },
  { name: 'move', keywords: ['drag', 'reorder', 'arrange', 'position', 'shift'] },

  // NEW ICONS - Formatting
  { name: 'bold', keywords: ['text', 'strong', 'format', 'style', 'weight'] },
  { name: 'italic', keywords: ['text', 'slant', 'format', 'style', 'emphasis'] },
  { name: 'underline', keywords: ['text', 'format', 'style', 'line', 'emphasis'] },
  { name: 'strikethrough', keywords: ['text', 'delete', 'format', 'cross', 'line'] },
  { name: 'heading', keywords: ['title', 'header', 'text', 'h1', 'format'] },
  { name: 'quote', keywords: ['blockquote', 'cite', 'text', 'reference', 'speech'] },
  { name: 'list-ordered', keywords: ['numbers', 'numbered', 'steps', 'sequence', 'order'] },
  { name: 'list-todo', keywords: ['checklist', 'tasks', 'checkbox', 'todo', 'items'] },

  // NEW ICONS - Security & Privacy
  { name: 'lock', keywords: ['secure', 'private', 'password', 'protect', 'closed'] },
  { name: 'unlock', keywords: ['open', 'access', 'unsecure', 'free', 'available'] },
  { name: 'key', keywords: ['password', 'access', 'unlock', 'security', 'login'] },
  { name: 'shield', keywords: ['protect', 'security', 'safe', 'guard', 'defense'] },
  { name: 'shield-check', keywords: ['verified', 'secure', 'protected', 'safe', 'approved'] },
  { name: 'eye', keywords: ['view', 'see', 'watch', 'visible', 'show'] },
  { name: 'eye-off', keywords: ['hide', 'invisible', 'private', 'hidden', 'blind'] },

  // NEW ICONS - Social & Sharing
  { name: 'share', keywords: ['send', 'social', 'forward', 'distribute', 'post'] },
  { name: 'share-2', keywords: ['network', 'connect', 'social', 'nodes', 'distribute'] },
  { name: 'thumbs-up', keywords: ['like', 'approve', 'yes', 'good', 'positive'] },
  { name: 'thumbs-down', keywords: ['dislike', 'disapprove', 'no', 'bad', 'negative'] },
  { name: 'message-circle', keywords: ['chat', 'comment', 'reply', 'discuss', 'talk'] },
  { name: 'messages-square', keywords: ['chat', 'conversation', 'discuss', 'forum', 'comments'] },
  { name: 'hash', keywords: ['hashtag', 'number', 'tag', 'pound', 'topic'] },
  { name: 'flag', keywords: ['report', 'mark', 'country', 'milestone', 'signal'] },

  // NEW ICONS - Charts & Data
  { name: 'bar-chart', keywords: ['graph', 'stats', 'analytics', 'data', 'metrics'] },
  { name: 'bar-chart-2', keywords: ['graph', 'statistics', 'analytics', 'data', 'report'] },
  { name: 'pie-chart', keywords: ['graph', 'percentage', 'analytics', 'data', 'share'] },
  { name: 'line-chart', keywords: ['graph', 'trend', 'analytics', 'data', 'growth'] },
  { name: 'trending-up', keywords: ['growth', 'increase', 'rise', 'up', 'positive'] },
  { name: 'trending-down', keywords: ['decline', 'decrease', 'fall', 'down', 'negative'] },
  { name: 'activity', keywords: ['pulse', 'health', 'monitor', 'heartbeat', 'live'] },
  { name: 'percent', keywords: ['discount', 'percentage', 'ratio', 'sale', 'math'] },

  // NEW ICONS - Shapes & Design
  { name: 'circle', keywords: ['shape', 'round', 'dot', 'ring', 'bullet'] },
  { name: 'square', keywords: ['shape', 'box', 'rectangle', 'block', 'container'] },
  { name: 'triangle', keywords: ['shape', 'play', 'arrow', 'delta', 'geometry'] },
  { name: 'hexagon', keywords: ['shape', 'polygon', 'geometry', 'cell', 'hive'] },
  { name: 'octagon', keywords: ['shape', 'stop', 'polygon', 'geometry', 'sign'] },
  { name: 'plus', keywords: ['add', 'new', 'create', 'positive', 'increase'] },
  { name: 'minus', keywords: ['remove', 'subtract', 'delete', 'negative', 'less'] },
  { name: 'divide', keywords: ['split', 'separate', 'math', 'fraction', 'slash'] },

  // NEW ICONS - More Categories
  { name: 'target', keywords: ['goal', 'aim', 'focus', 'objective', 'bullseye'] },
  { name: 'crosshair', keywords: ['target', 'aim', 'focus', 'precision', 'center'] },
  { name: 'anchor', keywords: ['link', 'dock', 'marine', 'fixed', 'stable'] },
  { name: 'navigation', keywords: ['location', 'gps', 'direction', 'pointer', 'arrow'] },
  { name: 'power', keywords: ['on', 'off', 'button', 'switch', 'start'] },
  { name: 'battery', keywords: ['power', 'charge', 'energy', 'level', 'device'] },
  { name: 'plug', keywords: ['power', 'connect', 'electric', 'socket', 'charge'] },
  { name: 'sliders', keywords: ['settings', 'adjust', 'control', 'options', 'filter'] },
  { name: 'filter', keywords: ['sort', 'search', 'refine', 'funnel', 'narrow'] },
  { name: 'sort-asc', keywords: ['order', 'arrange', 'ascending', 'a-z', 'up'] },
  { name: 'sort-desc', keywords: ['order', 'arrange', 'descending', 'z-a', 'down'] },

  // NEW ICONS - Miscellaneous
  { name: 'package', keywords: ['box', 'shipping', 'delivery', 'product', 'cargo'] },
  { name: 'truck', keywords: ['delivery', 'shipping', 'transport', 'vehicle', 'cargo'] },
  { name: 'ship', keywords: ['boat', 'marine', 'transport', 'ocean', 'cruise'] },
  { name: 'train', keywords: ['rail', 'transport', 'metro', 'subway', 'travel'] },
  { name: 'construction', keywords: ['build', 'work', 'warning', 'progress', 'wip'] },
  { name: 'hammer', keywords: ['build', 'tool', 'fix', 'construct', 'work'] },
  { name: 'ruler', keywords: ['measure', 'size', 'length', 'design', 'tool'] },
  { name: 'pencil', keywords: ['write', 'edit', 'draw', 'sketch', 'note'] },
  { name: 'eraser', keywords: ['delete', 'remove', 'clear', 'undo', 'clean'] },
  { name: 'highlighter', keywords: ['mark', 'emphasis', 'color', 'text', 'important'] },
  { name: 'brush', keywords: ['paint', 'art', 'design', 'draw', 'creative'] },
  { name: 'spray-can', keywords: ['paint', 'graffiti', 'art', 'color', 'spray'] },
  { name: 'pipette', keywords: ['color', 'pick', 'sample', 'dropper', 'eyedropper'] },
  { name: 'crop', keywords: ['cut', 'trim', 'resize', 'image', 'edit'] },
  { name: 'scan', keywords: ['qr', 'barcode', 'document', 'read', 'capture'] },
  { name: 'printer', keywords: ['print', 'document', 'paper', 'output', 'copy'] },
  { name: 'log-in', keywords: ['signin', 'enter', 'access', 'login', 'auth'] },
  { name: 'log-out', keywords: ['signout', 'exit', 'leave', 'logout', 'close'] },
  { name: 'user-plus', keywords: ['add', 'invite', 'register', 'signup', 'new'] },
  { name: 'user-minus', keywords: ['remove', 'delete', 'unfriend', 'ban', 'block'] },
  { name: 'user-check', keywords: ['verified', 'approved', 'confirm', 'valid', 'active'] },
  { name: 'award', keywords: ['badge', 'medal', 'prize', 'achievement', 'ribbon'] },
  { name: 'medal', keywords: ['award', 'prize', 'first', 'winner', 'achievement'] },
  { name: 'graduation-cap', keywords: ['education', 'school', 'degree', 'learn', 'student'] },
  { name: 'book', keywords: ['read', 'library', 'education', 'novel', 'manual'] },
  { name: 'book-open', keywords: ['read', 'study', 'education', 'learning', 'manual'] },
  { name: 'library', keywords: ['books', 'read', 'collection', 'archive', 'knowledge'] },
  { name: 'newspaper', keywords: ['news', 'article', 'press', 'media', 'read'] },
  { name: 'megaphone', keywords: ['announce', 'loud', 'marketing', 'promote', 'speaker'] },
  { name: 'siren', keywords: ['alert', 'emergency', 'warning', 'alarm', 'urgent'] },
];

/**
 * Flat array of icon names for backward compatibility
 */
export const PROMPT_ICONS = ICON_DEFINITIONS.map((d) => d.name);

/**
 * Search icons by name or keywords
 * @param query Search string (case-insensitive)
 * @returns Array of matching icon names
 */
export function searchIcons(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return PROMPT_ICONS;

  return ICON_DEFINITIONS.filter(
    (icon) =>
      icon.name.includes(q) || icon.keywords.some((k) => k.includes(q))
  ).map((d) => d.name);
}

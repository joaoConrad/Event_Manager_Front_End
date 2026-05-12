/**
 * Substitui cores fixas por variáveis de tema nos CSS do app.
 * Executar na raiz do front: node scripts/tokenize-theme-css.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const files = [
  'src/app/app.css',
  'src/app/components/footer/footer.css',
  'src/app/features/admin/dashboard/dashboard.css',
  'src/app/features/auth/pages/login/login.css',
  'src/app/features/auth/pages/register/register.css',
  'src/app/features/auth/pages/profile/profile.css',
  'src/app/features/events/pages/event-create/event-create.css',
  'src/app/features/events/pages/event-detail/event-detail.css',
  'src/app/features/events/pages/event-list/event-list.css',
  'src/app/features/events/pages/qr-checkin/qr-checkin.css',
  'src/app/features/home/pages/home/home.css',
  'src/app/features/shared/not-found/not-found.css',
];

function tokenize(css) {
  let s = css;

  const pairs = [
    [
      'linear-gradient(180deg, #f3f4f6 0%, #e9edf5 100%)',
      'linear-gradient(180deg, var(--page-bg) 0%, var(--page-bg-end) 100%)',
    ],
    [
      'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
      'linear-gradient(180deg, var(--surface) 0%, var(--surface-secondary) 100%)',
    ],
    [
      'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      'linear-gradient(90deg, var(--skeleton-a) 25%, var(--skeleton-b) 50%, var(--skeleton-a) 75%)',
    ],
    ['background: #f8fafc', 'background: var(--surface-subtle)'],
    ['background: #f9fafb', 'background: var(--surface-secondary)'],
    ['background: #fafafa', 'background: var(--surface-secondary)'],
    ['background: #f1f5f9', 'background: var(--surface-muted)'],
    ['background: #f3f4f6', 'background: var(--page-bg)'],
    ['background: #fbfdff', 'background: var(--surface-subtle)'],
    ['background: #ffffff', 'background: var(--surface)'],
    ['background: #fff;', 'background: var(--surface);'],
    ['background-color: #ffffff', 'background-color: var(--surface)'],
    ['border: 1px solid #e6ebf2', 'border: 1px solid var(--border-strong)'],
    ['border: 1px solid #e8edf3', 'border: 1px solid var(--border-strong)'],
    ['border: 1px solid #e9eef5', 'border: 1px solid var(--border-soft)'],
    ['border: 1px solid #f1f5f9', 'border: 1px solid var(--border-table)'],
    ['border: 1.5px solid #e5e7eb', 'border: 1.5px solid var(--border)'],
    ['border: 1.5px solid #e6ebf2', 'border: 1.5px solid var(--border-strong)'],
    ['border: 2px dashed #e5e7eb', 'border: 2px dashed var(--border)'],
    ['border: 2px dashed #d1d5db', 'border: 2px dashed var(--border)'],
    ['border-bottom: 1px solid #e9eef5', 'border-bottom: 1px solid var(--border-soft)'],
    ['border-bottom: 1px solid #f1f5f9', 'border-bottom: 1px solid var(--border-table)'],
    ['border-bottom: 1px solid #f0f0f0', 'border-bottom: 1px solid var(--border-table)'],
    ['border-bottom: 2px solid #e9ecef', 'border-bottom: 2px solid var(--border-soft)'],
    ['border-top: 1px solid #e7edf5', 'border-top: 1px solid var(--border-strong)'],
    ['border-top: 1px solid #e8edf3', 'border-top: 1px solid var(--border-strong)'],
    ['border-top: 1px solid #eee', 'border-top: 1px solid var(--border-strong)'],
    ['border-top: 1px solid #f1f5f9', 'border-top: 1px solid var(--border-table)'],
    ['border-top: 1px solid #edf2f7', 'border-top: 1px solid var(--border-table)'],
    ['border-bottom: 1px solid #eee', 'border-bottom: 1px solid var(--border-strong)'],
    ['border-bottom: 1px solid #e9ecef', 'border-bottom: 1px solid var(--border-soft)'],
    ['border: 1px solid #e5e7eb', 'border: 1px solid var(--border)'],
    ['border: 1.5px solid #e5e7eb', 'border: 1.5px solid var(--border)'],
    ['border: 2px solid #e5e7eb', 'border: 2px solid var(--border)'],
    ['border: 1px solid #dbe3ee', 'border: 1px solid var(--border-input)'],
    ['border: 1px solid #e6ebf2', 'border: 1px solid var(--border-strong)'],
    ['border: 1px solid #e9eef5', 'border: 1px solid var(--border-soft)'],
    ['border: 1px solid #e8edf3', 'border: 1px solid var(--border-strong)'],
    ['border: 1px solid #edf2f7', 'border: 1px solid var(--border-table)'],
    ['border: 1px solid #eee', 'border: 1px solid var(--border-strong)'],
    ['border: 1.5px solid #dbe3ee', 'border: 1.5px solid var(--border-input)'],
    ['color: #111827', 'color: var(--text)'],
    ['color: #1a1a2e', 'color: var(--text)'],
    ['color: #243241', 'color: var(--text)'],
    ['color: #374151', 'color: var(--text-secondary)'],
    ['color: #4b5563', 'color: var(--text-secondary)'],
    ['color: #5b6472', 'color: var(--text-muted)'],
    ['color: #667085', 'color: var(--text-muted)'],
    ['color: #6b7280', 'color: var(--text-muted)'],
    ['color: #617487', 'color: var(--text-muted)'],
    ['color: #516174', 'color: var(--text-muted)'],
    ['color: #9ca3af', 'color: var(--text-muted-2)'],
    ['color: #64748b', 'color: var(--text-muted-2)'],
    ['background: #f5f7fb', 'background: var(--btn-secondary-bg)'],
    ['background: #eef2f7', 'background: var(--btn-secondary-hover)'],
    ['background: #f0f5ff', 'background: rgba(37, 99, 235, 0.12)'],
    ['background: #f3f8ff', 'background: rgba(37, 99, 235, 0.1)'],
    ['background: #f8f9fa', 'background: var(--surface-subtle)'],
    ['background: #fcfdff', 'background: var(--surface-subtle)'],
    ['background: #f8fbff', 'background: var(--surface-subtle)'],
    ['background: #f1f6fd', 'background: var(--surface-subtle)'],
    ['background: #e5e7eb', 'background: var(--border)'],
    ['background: #dbeafe', 'background: rgba(37, 99, 235, 0.18)'],
    ['background: #dbe4f0', 'background: var(--border-strong)'],
    ['background: #f3f4f6', 'background: var(--page-bg)'],
    ['background: #f8fafc', 'background: var(--surface-subtle)'],
    ['background: #fff', 'background: var(--surface)'],
    ['background: #ffffff', 'background: var(--surface)'],
  ];

  for (const [a, b] of pairs) {
    s = s.split(a).join(b);
  }

  return s;
}

for (const rel of files) {
  const fp = path.join(root, rel);
  const before = fs.readFileSync(fp, 'utf8');
  const after = tokenize(before);
  if (after !== before) {
    fs.writeFileSync(fp, after, 'utf8');
    console.log('updated', rel);
  } else {
    console.log('unchanged', rel);
  }
}

# Personal Finance App — Project Instructions for Claude Code

## Tech Stack

### Backend
- Runtime: Node.js with TypeScript (strict mode)
- Framework: Express.js
- Database: PostgreSQL — raw SQL only, no ORM
- Auth: JWT (access token 15min + refresh token 7d)
- Validation: Zod
- Config: dotenv (.env file)

### Frontend
- Framework: Angular 21 (standalone components only, no NgModules)
- UI Library: Taiga UI v4 (latest)
- Change Detection: OnPush everywhere
- State: Angular Signals + resource API
- HTTP: HttpClient with interceptors

---

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── routes/        # Express route handlers (thin, delegate to services)
│   │   ├── services/      # Business logic
│   │   ├── db/
│   │   │   ├── migrations/ # Raw SQL migration files (001_init.sql, etc.)
│   │   │   └── queries/    # SQL query functions
│   │   ├── middleware/    # auth, error handler, validation
│   │   └── types/         # Shared TypeScript interfaces
│   └── .env
└── frontend/
    └── src/
        └── app/
            ├── core/          # Auth service, HTTP interceptor, guards
            ├── shared/        # Reusable components, pipes, utils
            └── features/      # Feature modules (transactions, categories, etc.)
                └── transactions/
                    ├── transactions.component.ts
                    ├── transactions.service.ts
                    └── transaction-form/
```

---

## Backend Rules

- All API responses use the format: `{ data: T | null, error: string | null }`
- All endpoints except `/api/auth/*` require JWT middleware
- All database tables have a `user_id` foreign key (data is user-scoped)
- Use `async/await` everywhere, no callbacks
- Use Zod for request body validation in routes
- Never use ORM — write raw SQL using `pg` (node-postgres)
- Migrations are numbered SQL files: `001_create_users.sql`, `002_create_categories.sql`
- Seed default categories (Food, Transport, Salary, etc.) on first run

### API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/transactions       # supports ?from=&to=&category=&type=&page=&limit=
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id

GET    /api/summary            # totals for current month: income, expense, balance
```

---

## Frontend Rules

### Angular 21 — Mandatory Patterns

**Standalone components only** — never use NgModules:
```typescript
@Component({
  standalone: true,
  imports: [TuiButton, AsyncPipe, ...],
  changeDetection: ChangeDetectionStrategy.OnPush,
  ...
})
```

**Signals for all state** — avoid BehaviorSubject and manual subscriptions:
```typescript
// ✅ Good
transactions = signal<Transaction[]>([]);
total = computed(() => this.transactions().reduce(...));

// ❌ Bad
transactions$ = new BehaviorSubject<Transaction[]>([]);
```

**resource API for async data** — use instead of ngOnInit + subscribe:
```typescript
// Trigger request only on explicit user action (not on every keystroke)
private filterSignal = signal<FilterParams>({});

transactionsResource = resource({
  params: () => this.filterSignal(),
  loader: ({ params }) => this.transactionService.getAll(params),
});
```

**Loading / error states from resource**:
```typescript
// In template:
@if (transactionsResource.isLoading()) {
  <tui-loader />
} @else if (transactionsResource.hasValue()) {
  <!-- render data -->
} @else {
  <p>Error. <button (click)="transactionsResource.reload()">Retry</button></p>
}
```

**Inject function** — use instead of constructor injection:
```typescript
// ✅ Good
private authService = inject(AuthService);

// ❌ Avoid
constructor(private authService: AuthService) {}
```

**No manual subscribe** — prefer `toSignal()` if you must work with observables:
```typescript
data = toSignal(this.http.get(...), { initialValue: [] });
```

**Control flow syntax** — use `@if`, `@for`, `@switch` (not *ngIf, *ngFor):
```html
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

---

### Taiga UI v4 — Usage Rules

**Install via schematic** (automatic setup):
```bash
ng add @taiga-ui/cdk
```

**Required packages**:
- `@taiga-ui/cdk` — utilities, directives, base tools
- `@taiga-ui/core` — TuiRoot, basic components
- `@taiga-ui/kit` — full component set (inputs, selects, dialogs, etc.)
- `@taiga-ui/addon-charts` — charts (if needed)

**TuiRoot must wrap the app** in `app.component.html`:
```html
<tui-root>
  <router-outlet />
</tui-root>
```

**Providers in main.ts**:
```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    ...
  ]
});
```

**Import components granularly** (tree-shaking):
```typescript
// ✅ Good — import only what you use
import { TuiButton } from '@taiga-ui/core';
import { TuiInputModule, TuiSelectModule } from '@taiga-ui/kit';

// ❌ Bad
import * as TaigaUI from '@taiga-ui/kit';
```

**Naming convention** — no module/component postfix needed in v4:
```typescript
// ✅ TuiButton (not TuiButtonModule or TuiButtonComponent)
imports: [TuiButton, TuiInput, TuiSelect]
```

**Prefer host directives** for composing behaviour without extra HTML nesting.

**Forms** — use Taiga UI input components with Angular Reactive Forms:
```typescript
form = new FormGroup({
  amount: new FormControl<number | null>(null, Validators.required),
  category: new FormControl<string | null>(null, Validators.required),
});
```

**Key components to use in this project**:
| Purpose | Taiga UI Component |
|---|---|
| Button | `TuiButton` |
| Text input | `TuiTextfieldControllerModule` + `TuiInput` |
| Number input | `TuiInputNumber` |
| Date picker | `TuiInputDate` |
| Select | `TuiSelect` |
| Dialog | `TuiDialogService` |
| Notification | `TuiAlertService` |
| Loading | `TuiLoader` |
| Table | `@taiga-ui/addon-table` |
| Icons | `TuiIcon` |

---

## Code Style

- TypeScript strict mode always
- `interface` over `type` for object shapes
- `readonly` for properties that don't change
- No `any` — use `unknown` if type is uncertain and narrow it
- Functions prefer `const` arrow functions for services, class methods for components
- File names: `kebab-case.component.ts`, `kebab-case.service.ts`

---

## Git

- Commit before starting each new feature
- Commit message format: `feat: add transaction filtering` / `fix: jwt refresh logic`

---

## Environment Variables (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/finance_db
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
PORT=3000
```

---

## Docker

Use `docker-compose.yml` for local PostgreSQL. Always include it in the project root.

---

## What NOT to do

- No NgModules
- No ORM (no TypeORM, Prisma, Sequelize)
- No `ngOnInit` + subscribe pattern — use `resource` API instead
- No BehaviorSubject for component state — use signals
- No `any` type
- No `*ngIf` / `*ngFor` — use `@if` / `@for`
- No importing entire Taiga UI packages

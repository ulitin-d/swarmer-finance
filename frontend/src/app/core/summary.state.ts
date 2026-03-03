import { Injectable, computed, effect, inject, resource, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, Summary } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SummaryState {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly resource = resource<Summary | null, boolean>({
    params: () => this.auth.isAuthenticated(),
    loader: async ({ params }) => {
      if (!params) return null;
      const r = await firstValueFrom(this.api.getSummary());
      return r.data ?? null;
    }
  });
  

  readonly summary = computed(() => this.resource.value() ?? null);
  readonly loading = this.resource.isLoading;

  constructor() {
    effect(() => {
      if (this.auth.refreshCount() > 0) {
        untracked(() => this.resource.reload());
      }
    });
  }

  reload() {
    this.resource.reload();
  }
}

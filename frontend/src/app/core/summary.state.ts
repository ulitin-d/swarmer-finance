import { Injectable, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ApiService, Summary } from './api.service';

@Injectable({ providedIn: 'root' })
export class SummaryState {
  private readonly api = inject(ApiService);

  private readonly resource = rxResource<Summary | null, void>({
    stream: () => this.api.getSummary().pipe(map(r => r.data ?? null)),
  });

  readonly summary = computed(() => this.resource.value() ?? null);
  readonly loading = this.resource.isLoading;

  reload() {
    this.resource.reload();
  }
}

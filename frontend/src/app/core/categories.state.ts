import { Injectable, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs';
import { ApiService, Category } from './api.service';

@Injectable({ providedIn: 'root' })
export class CategoriesState {
  private readonly api = inject(ApiService);

  private readonly resource = rxResource<Category[], void>({
    stream: () => this.api.getCategories().pipe(map(r => r.data ?? [])),
  });

  readonly categories = computed(() => this.resource.value() ?? []);
  readonly loading = this.resource.isLoading;

  readonly leafCategories = computed(() => {
    const getLeaves = (items: Category[]): Category[] =>
      items.flatMap(item => item.children?.length ? getLeaves(item.children) : [item]);
    return getLeaves(this.categories());
  });

  create(data: { name: string; parentId: number; color?: string }) {
    return this.api.createCategory(data).pipe(tap(() => this.resource.reload()));
  }

  update(id: number, data: { name?: string; color?: string }) {
    return this.api.updateCategory(id, data).pipe(tap(() => this.resource.reload()));
  }

  delete(id: number) {
    return this.api.deleteCategory(id).pipe(tap(() => this.resource.reload()));
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { ApiService, Category } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ReactiveFormsModule, TuiButton],
  template: `
    <div class="page-container">
      <header class="header">
        <h1>Categories</h1>
        <button tuiButton (click)="openDialog()">Add Category</button>
      </header>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else if (categories().length > 0) {
        <div class="categories-tree">
          @for (root of categories(); track root.id) {
            <div class="root-category">
              <div class="category-row system">
                <span class="category-icon" [style.background]="root.color">●</span>
                <span class="category-name">{{ root.name }}</span>
              </div>
              <div class="children">
                @for (child of root.children || []; track child.id) {
                  <div class="category-row">
                    <span class="category-icon" [style.background]="child.color">●</span>
                    <span class="category-name">{{ child.name }}</span>
                    <span class="category-actions">
                      @if (child.user_id) {
                        <button tuiButton appearance="flat" size="s" (click)="openDialog(child)">Edit</button>
                        <button tuiButton appearance="flat" size="s" (click)="deleteCategory(child.id)">Delete</button>
                      }
                    </span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (showDialog()) {
        <div class="dialog-overlay" (click)="closeDialog()">
          <div class="dialog card" (click)="$event.stopPropagation()">
            <h2>{{ editingCategory() ? 'Edit' : 'Add' }} Category</h2>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label>Name</label>
                <input type="text" formControlName="name" class="form-input" placeholder="Category name">
              </div>
              @if (!editingCategory()) {
                <div class="form-group">
                  <label>Parent Category</label>
                  <select formControlName="parentId" class="form-input">
                    <option [value]="null">Select parent</option>
                    @for (cat of parentCategories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
              }
              <div class="form-group">
                <label>Color</label>
                <input type="color" formControlName="color" class="form-input-color">
              </div>
              <div class="dialog-actions">
                <button tuiButton appearance="flat" type="button" (click)="closeDialog()">Cancel</button>
                <button tuiButton type="submit" [disabled]="form.invalid">{{ editingCategory() ? 'Update' : 'Create' }}</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 28px; }
    .categories-tree { display: flex; flex-direction: column; gap: 24px; }
    .root-category { background: white; border-radius: 8px; padding: 16px; }
    .category-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 6px; }
    .category-row.system { background: #f5f5f5; font-weight: 600; }
    .category-icon { width: 16px; height: 16px; border-radius: 50%; }
    .category-name { flex: 1; }
    .category-actions { display: flex; gap: 8px; }
    .children { margin-left: 28px; margin-top: 8px; }
    .dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { width: 100%; max-width: 480px; padding: 24px; background: white; border-radius: 8px; }
    .dialog h2 { margin: 0 0 24px; }
    .dialog-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #666; }
    .form-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
    .form-input-color { width: 60px; height: 40px; padding: 2px; cursor: pointer; }
    .form-input:focus { outline: none; border-color: #526ed3; }
    .loading { padding: 20px; text-align: center; color: #666; }
  `]
})
export class CategoriesComponent implements OnInit {
  authService = inject(AuthService);
  private apiService = inject(ApiService);

  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    parentId: new FormControl<number | null>(null, [Validators.required]),
    color: new FormControl<string>('#000000', [])
  });

  categories = signal<Category[]>([]);
  showDialog = signal(false);
  editingCategory = signal<Category | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    this.apiService.getCategories().subscribe({
      next: (response) => {
        if (response.data) this.categories.set(response.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  parentCategories = () => {
    const cats = this.categories();
    const result: Category[] = [];
    for (const root of cats) {
      if (root.children?.length) {
        result.push(...root.children.filter(c => c.user_id !== null));
      }
    }
    return result;
  };

  openDialog(cat?: Category) {
    if (cat) {
      this.editingCategory.set(cat);
      this.form.patchValue({ name: cat.name, color: cat.color });
    } else {
      this.editingCategory.set(null);
      this.form.reset();
      this.form.patchValue({ color: '#000000' });
    }
    this.showDialog.set(true);
  }

  closeDialog() {
    this.showDialog.set(false);
    this.editingCategory.set(null);
    this.form.reset();
  }

  onSubmit() {
    if (this.form.invalid) return;
    const { name, parentId, color } = this.form.value;
    const editing = this.editingCategory();
    const reqName = name || '';
    const reqColor = color || '#000000';
    
    const request = editing
      ? this.apiService.updateCategory(editing.id, { name: reqName, color: reqColor })
      : this.apiService.createCategory({ name: reqName, parentId: parentId!, color: reqColor });
    request.subscribe({ 
      next: () => { 
        this.closeDialog(); 
        this.loadCategories(); 
      }, 
      error: console.error 
    });
  }

  deleteCategory(id: number) {
    if (!confirm('Delete this category?')) return;
    this.apiService.deleteCategory(id).subscribe({ 
      next: () => this.loadCategories(), 
      error: console.error 
    });
  }
}

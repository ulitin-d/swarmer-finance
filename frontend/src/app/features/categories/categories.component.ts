import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiDataList, TuiLoader, TuiTextfield, tuiItemsHandlersProvider } from '@taiga-ui/core';
import { TuiDataListWrapper, TuiInputColor, TuiSelect } from '@taiga-ui/kit';
import { ApiService, Category } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TuiButton, TuiTextfield, TuiSelect, TuiDataList, TuiDataListWrapper, TuiInputColor, TuiLoader],
  providers: [tuiItemsHandlersProvider({ stringify: signal((cat: Category) => cat.name) })],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  authService = inject(AuthService);
  private apiService = inject(ApiService);

  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    parentId: new FormControl<Category | null>(null, [Validators.required]),
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
      : this.apiService.createCategory({ name: reqName, parentId: parentId!.id, color: reqColor });
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

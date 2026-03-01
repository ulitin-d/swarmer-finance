import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiLoader, TuiTextfield, tuiItemsHandlersProvider } from '@taiga-ui/core';
import { TuiDataListWrapper, TuiInputColor, TuiSelect } from '@taiga-ui/kit';
import { Category } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CategoriesState } from '../../core/categories.state';

@Component({
  selector: 'app-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TuiButton, TuiTextfield, TuiSelect, TuiDataListWrapper, TuiInputColor, TuiLoader],
  providers: [tuiItemsHandlersProvider({ stringify: signal((cat: unknown) => (cat as Category).name) })],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent {
  authService = inject(AuthService);
  categoriesState = inject(CategoriesState);

  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    parentId: new FormControl<Category | null>(null, [Validators.required]),
    color: new FormControl<string>('#000000', [])
  });

  showDialog = signal(false);
  editingCategory = signal<Category | null>(null);

  parentCategories = () => this.categoriesState.categories();

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
      ? this.categoriesState.update(editing.id, { name: reqName, color: reqColor })
      : this.categoriesState.create({ name: reqName, parentId: parentId!.id, color: reqColor });
    request.subscribe({
      next: () => this.closeDialog(),
      error: console.error
    });
  }

  deleteCategory(id: number) {
    if (!confirm('Delete this category?')) return;
    this.categoriesState.delete(id).subscribe({ error: console.error });
  }
}

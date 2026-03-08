import { Component, inject } from '@angular/core';
import { CategoriesState } from '../../core/categories.state';
import { TuiTree } from '@taiga-ui/kit';
import { Category } from '../../models/category';
import { EMPTY_ARRAY, TuiHandler } from '@taiga-ui/cdk';
import { TuiButton, TuiIcon, TuiLoader } from '@taiga-ui/core';

@Component({
  selector: 'app-categories',
  imports: [TuiTree, TuiIcon, TuiButton, TuiLoader],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories {
  categoriesState = inject(CategoriesState);
  protected readonly map = new Map<Category, boolean>();
  protected readonly handler: TuiHandler<Category, readonly Category[]> = (item) => item.children || EMPTY_ARRAY;
  selected: number = 1;

  setAsSelected(node: Category) {
    this.selected = node.id;
  }
}

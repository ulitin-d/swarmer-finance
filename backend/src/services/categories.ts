import * as categoryQueries from '../db/queries/categories';
import { Category } from '../types';

export const getCategoryTree = async (userId: number): Promise<Category[]> => {
  const allCategories = await categoryQueries.getCategoriesByUserId(userId);
  
  const systemRoots = allCategories.filter(c => c.user_id === null);
  const userCategories = allCategories.filter(c => c.user_id === userId);
  
  return systemRoots.map(root => ({
    ...root,
    children: buildTree(userCategories, root.id),
  }));
};

const buildTree = (categories: Category[], parentId: number): Category[] => {
  return categories
    .filter(c => c.parent_id === parentId)
    .map(c => ({
      ...c,
      children: buildTree(categories, c.id),
    }));
};

export const createCategory = async (
  userId: number,
  name: string,
  parentId: number,
  color?: string,
  icon?: string
): Promise<Category> => {
  if (parentId === null) {
    throw { statusCode: 400, message: 'Cannot create root categories' };
  }
  
  const parentCategory = await categoryQueries.getCategoryById(parentId);
  if (!parentCategory) {
    throw { statusCode: 404, message: 'Parent category not found' };
  }
  
  if (parentCategory.user_id !== null && parentCategory.user_id !== userId) {
    throw { statusCode: 403, message: 'Cannot create category under this parent' };
  }
  
  return categoryQueries.createCategory(userId, name, parentId, color, icon);
};

export const updateCategory = async (
  id: number,
  userId: number,
  name: string,
  color?: string,
  icon?: string
): Promise<Category> => {
  if (id === 1 || id === 2) {
    throw { statusCode: 403, message: 'Cannot edit system categories' };
  }
  
  const updated = await categoryQueries.updateCategory(id, userId, name, color, icon);
  if (!updated) {
    throw { statusCode: 404, message: 'Category not found or not owned by user' };
  }
  
  return updated;
};

export const deleteCategory = async (id: number, userId: number): Promise<void> => {
  if (id === 1 || id === 2) {
    throw { statusCode: 403, message: 'Cannot delete system categories' };
  }
  
  const hasChildren = await categoryQueries.hasChildren(id);
  if (hasChildren) {
    throw { statusCode: 400, message: 'Cannot delete category with children' };
  }
  
  const deleted = await categoryQueries.deleteCategory(id, userId);
  if (!deleted) {
    throw { statusCode: 404, message: 'Category not found or not owned by user' };
  }
};

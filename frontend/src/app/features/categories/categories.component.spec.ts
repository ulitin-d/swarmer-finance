import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CategoriesComponent } from './categories.component';
import { ApiService, Category } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

const mockCategories: Category[] = [
  { id: 1, user_id: null, name: 'Food', parent_id: null, color: '#ff0000', icon: '', children: [
    { id: 10, user_id: 1, name: 'Groceries', parent_id: 1, color: '#ff8800', icon: '' },
  ]},
  { id: 2, user_id: null, name: 'Transport', parent_id: null, color: '#0000ff', icon: '', children: [] },
];

function makeApiService() {
  return jasmine.createSpyObj<ApiService>('ApiService', [
    'getCategories', 'createCategory', 'updateCategory', 'deleteCategory',
  ]);
}

function makeAuthService(): AuthService {
  return {
    isAuthenticated: signal(true),
    user: signal(null),
    logout: jasmine.createSpy('logout'),
    register: jasmine.createSpy('register'),
    login: jasmine.createSpy('login'),
    getToken: jasmine.createSpy('getToken').and.returnValue(null),
    refreshToken: jasmine.createSpy('refreshToken'),
  } as unknown as AuthService;
}

describe('CategoriesComponent', () => {
  let fixture: ComponentFixture<CategoriesComponent>;
  let component: CategoriesComponent;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiService = makeApiService();
    apiService.getCategories.and.returnValue(of({ data: mockCategories, error: null }));

    await TestBed.configureTestingModule({
      imports: [CategoriesComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiService },
        { provide: AuthService, useValue: makeAuthService() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesComponent);
    component = fixture.componentInstance;
  });

  // ── Initialisation ─────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('loads categories on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(apiService.getCategories).toHaveBeenCalledTimes(1);
      expect(component.categories()).toEqual(mockCategories);
      expect(component.loading()).toBeFalse();
    }));

    it('sets loading to false on error', fakeAsync(() => {
      apiService.getCategories.and.returnValue(throwError(() => new Error('network')));
      fixture.detectChanges();
      tick();
      expect(component.loading()).toBeFalse();
      expect(component.categories()).toEqual([]);
    }));

    it('keeps categories empty when response.data is null', fakeAsync(() => {
      apiService.getCategories.and.returnValue(of({ data: null, error: 'oops' }));
      fixture.detectChanges();
      tick();
      expect(component.categories()).toEqual([]);
    }));
  });

  // ── parentCategories ────────────────────────────────────────────────────────

  describe('parentCategories()', () => {
    it('returns the full categories list', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.parentCategories()).toEqual(mockCategories);
    }));

    it('returns empty array before data loads', () => {
      expect(component.parentCategories()).toEqual([]);
    });
  });

  // ── openDialog ──────────────────────────────────────────────────────────────

  describe('openDialog()', () => {
    beforeEach(() => fixture.detectChanges());

    it('opens dialog in create mode', () => {
      component.openDialog();
      expect(component.showDialog()).toBeTrue();
      expect(component.editingCategory()).toBeNull();
    });

    it('resets form in create mode and sets default color', () => {
      component.form.patchValue({ name: 'Old' });
      component.openDialog();
      expect(component.form.value.name).toBeNull();
      expect(component.form.value.color).toBe('#000000');
    });

    it('opens dialog in edit mode and patches form', () => {
      const cat = mockCategories[0].children![0];
      component.openDialog(cat);
      expect(component.showDialog()).toBeTrue();
      expect(component.editingCategory()).toEqual(cat);
      expect(component.form.value.name).toBe(cat.name);
      expect(component.form.value.color).toBe(cat.color);
    });
  });

  // ── closeDialog ─────────────────────────────────────────────────────────────

  describe('closeDialog()', () => {
    it('hides dialog and clears editing state', () => {
      component.openDialog(mockCategories[0].children![0]);
      component.closeDialog();
      expect(component.showDialog()).toBeFalse();
      expect(component.editingCategory()).toBeNull();
    });

    it('resets form', () => {
      component.form.patchValue({ name: 'Something' });
      component.closeDialog();
      expect(component.form.value.name).toBeNull();
    });
  });

  // ── onSubmit ─────────────────────────────────────────────────────────────────

  describe('onSubmit()', () => {
    beforeEach(() => fixture.detectChanges());

    it('does nothing when form is invalid', () => {
      component.form.patchValue({ name: '', parentId: null });
      component.onSubmit();
      expect(apiService.createCategory).not.toHaveBeenCalled();
      expect(apiService.updateCategory).not.toHaveBeenCalled();
    });

    it('calls createCategory in create mode', fakeAsync(() => {
      const parent = mockCategories[0];
      apiService.createCategory.and.returnValue(of({ data: null, error: null }));

      component.openDialog();
      component.form.patchValue({ name: 'Eating Out', parentId: parent, color: '#123456' });
      component.onSubmit();
      tick();

      expect(apiService.createCategory).toHaveBeenCalledWith({
        name: 'Eating Out',
        parentId: parent.id,
        color: '#123456',
      });
    }));

    it('calls updateCategory in edit mode', fakeAsync(() => {
      const child = mockCategories[0].children![0];
      apiService.updateCategory.and.returnValue(of({ data: null, error: null }));

      component.openDialog(child);
      // parentId must be set to satisfy Validators.required on the shared form
      component.form.patchValue({ name: 'Renamed', color: '#abcdef', parentId: mockCategories[0] });
      component.onSubmit();
      tick();

      expect(apiService.updateCategory).toHaveBeenCalledWith(child.id, {
        name: 'Renamed',
        color: '#abcdef',
      });
    }));

    it('closes dialog and reloads on success', fakeAsync(() => {
      const parent = mockCategories[0];
      apiService.createCategory.and.returnValue(of({ data: null, error: null }));

      component.openDialog();
      component.form.patchValue({ name: 'New', parentId: parent, color: '#000000' });
      component.onSubmit();
      tick();

      expect(component.showDialog()).toBeFalse();
      expect(apiService.getCategories).toHaveBeenCalledTimes(2);
    }));
  });

  // ── deleteCategory ───────────────────────────────────────────────────────────

  describe('deleteCategory()', () => {
    beforeEach(() => {
      fixture.detectChanges();
      spyOn(window, 'confirm').and.returnValue(true);
    });

    it('calls deleteCategory and reloads on confirm', fakeAsync(() => {
      apiService.deleteCategory.and.returnValue(of({ data: { success: true }, error: null }));
      component.deleteCategory(10);
      tick();
      expect(apiService.deleteCategory).toHaveBeenCalledWith(10);
      expect(apiService.getCategories).toHaveBeenCalledTimes(2);
    }));

    it('does nothing when user cancels', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      component.deleteCategory(10);
      expect(apiService.deleteCategory).not.toHaveBeenCalled();
    });
  });
});

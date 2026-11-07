import { Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService, Product, ProductService } from './api';

type View = 'catalog' | 'login' | 'register';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './app.html'
})
export class App {
  auth = inject(AuthService);
  private api = inject(ProductService);

  view = signal<View>('catalog');
  products = signal<Product[]>([]);
  categories = signal<string[]>([]);
  activeCategory = signal('');
  search = signal('');
  form = signal<Product | null>(null);
  toDelete = signal<Product | null>(null);
  error = signal('');
  authForm = { email: '', password: '', inviteCode: '' };

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.products();
    return this.products().filter((p) =>
      [p.name, p.description, p.category].some((s) => (s || '').toLowerCase().includes(q)));
  });

pageSize = 9;
page = signal(1);
totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
currentPage = computed(() => Math.min(this.page(), this.totalPages()));
pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
paged = computed(() => {
  const start = (this.currentPage() - 1) * this.pageSize;
  return this.filtered().slice(start, start + this.pageSize);
});

goTo(n: number) {
  this.page.set(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

  constructor() {
    this.load();
    effect(() => {
      if (this.auth.expired()) {
        this.auth.expired.set(false);
        this.close();
        this.show('login');
        this.error.set('Your session expired. Sign in again.');
      }
    });
  }

  show(v: View) { this.view.set(v); this.error.set(''); this.authForm = { email: '', password: '', inviteCode: '' }; }

  submitAuth() {
    this.auth.authenticate(this.view() === 'register' ? 'register' : 'login', this.authForm).subscribe({
      next: (r) => { this.auth.store(r); this.show('catalog'); },
      error: (e) => this.fail(e)
    });
  }
  logout() { this.auth.logout(); this.close(); }

  load() {
    this.api.list(this.activeCategory()).subscribe({ next: (p) => this.products.set(p), error: (e) => this.fail(e) });
    this.api.categories().subscribe((c) => {
      this.categories.set(c);
      if (this.activeCategory() && !c.includes(this.activeCategory())) { this.activeCategory.set(''); this.load(); }
    });
  }
  setCategory(c: string) { this.activeCategory.set(c); this.page.set(1); this.load(); }

  openAdd() { this.error.set(''); this.form.set({ name: '', category: '', price: null, imageUrl: '', description: '' }); }
  openEdit(p: Product) { this.error.set(''); this.form.set({ ...p }); }
  confirmDelete(p: Product) { this.error.set(''); this.toDelete.set(p); }
  close() { this.form.set(null); this.toDelete.set(null); this.error.set(''); }

  save() {
    this.api.save(this.form()!).subscribe({ next: () => { this.close(); this.load(); }, error: (e) => this.fail(e) });
  }
  remove() {
    this.api.remove(this.toDelete()!._id!).subscribe({ next: () => { this.close(); this.load(); }, error: (e) => this.fail(e) });
  }

  private fail(e: HttpErrorResponse) { this.error.set(e.error?.error || 'Something went wrong. Try again.'); }
}

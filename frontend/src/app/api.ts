import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const API = 'https://bahay-kubo-api.vercel.app/api';

export interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number | null;
  category: string;
  imageUrl: string;
}

interface AuthResult { token: string; email: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  token = signal<string | null>(localStorage.getItem('bahaykubo_token'));
  email = signal<string | null>(localStorage.getItem('bahaykubo_email'));
  expired = signal(false);
  isAdmin = computed(() => !!this.token());

  authenticate(mode: 'login' | 'register', body: object) {
    return this.http.post<AuthResult>(`${API}/auth/${mode}`, body);
  }
  store(r: AuthResult) {
    localStorage.setItem('bahaykubo_token', r.token);
    localStorage.setItem('bahaykubo_email', r.email);
    this.token.set(r.token);
    this.email.set(r.email);
  }
  logout(expired = false) {
    localStorage.removeItem('bahaykubo_token');
    localStorage.removeItem('bahaykubo_email');
    this.token.set(null);
    this.email.set(null);
    this.expired.set(expired);
  }
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  list(category: string) {
    return this.http.get<Product[]>(`${API}/products`, { params: category ? { category } : {} });
  }
  categories() { return this.http.get<string[]>(`${API}/categories`); }
  save(p: Product) {
    return p._id ? this.http.put<Product>(`${API}/products/${p._id}`, p) : this.http.post<Product>(`${API}/products`, p);
  }
  remove(id: string) { return this.http.delete(`${API}/products/${id}`); }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  if (token) req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(req).pipe(catchError((e) => {
    if (e.status === 401 && token) auth.logout(true);
    return throwError(() => e);
  }));
};

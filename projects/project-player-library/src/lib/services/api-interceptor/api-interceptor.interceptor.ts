import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ToastService } from '../toast/toast.service';
import { DataService } from '../data/data.service';
import { NetworkServiceService } from 'network-service';
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private onlineStatus: boolean = true;
  constructor(private toastService:ToastService,private dataService:DataService,private network:NetworkServiceService){
    this.network.isOnline$.subscribe((status)=>{
      this.onlineStatus=status
    })
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.onlineStatus) {
      return this.handleOfflineError();
    }
    let config = this.dataService.getConfig()
    if(config.isPreview){
      this.toastService.showToast("PREVIEW_MODE_MSG","danger")
      return this.handlePreview()
    }
    const token = config.accessToken;
    let authReq = this.addAuthHeader(req, token);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  private addAuthHeader(req: HttpRequest<any>, token: string | null): HttpRequest<any> {
    if (!token) {
      return req;
    }

    let headers: any = localStorage.getItem('headers');
    let extraHeaders = JSON.parse(headers);

    return req.clone({
      setHeaders: {
      'Content-Type': 'application/json',
      'x-app-ver':'', ...extraHeaders }
    }
    );
  }

    private handleError=(error: HttpErrorResponse): Observable<never> => {
      let config = this.dataService.getConfig()
    let errorMessage = 'Unknown error!';
    this.toastService.showToast(error.error.message,"danger")
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        window.location.href = config?.redirectionLinks?.unauthorizedRedirectUrl
      }
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(error.error));
  }

  private handleOfflineError(): Observable<never> {
    this.toastService.showToast("OFFLINE_MSG",'danger')
    return throwError(() => ({
      status: 0,
      error:{message: 'You are offline'},
    }));
  }

  private handlePreview(): Observable<never> {
    return throwError(() => ({}));
  }
}

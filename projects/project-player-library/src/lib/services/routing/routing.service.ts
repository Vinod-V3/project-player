import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data/data.service';

@Injectable({
  providedIn: 'root'
})
export class RoutingService {

  constructor(private router: Router, private data: DataService) { }

  navigate(path:any,queryParams:any, options?:any){
    let skipLocation = null
    if(this.data.getConfig()?.isPreview){
      skipLocation = { skipLocationChange: true }
    }
    if(options){
      let routerOptions = { ...options, ...skipLocation }
      this.router.navigate([path],{queryParams: queryParams, ...routerOptions})
    }else{
      this.router.navigate([path],{ queryParams: queryParams, ...skipLocation })
    }
    
  }

  navigateByHref(path: any){
    window.location.href = path
  }
}

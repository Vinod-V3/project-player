import { Component, Input, OnInit, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { RoutingService } from '../../services/routing/routing.service';
import { DbService } from '../../services/db/db.service';;
import { DataService } from '../../services/data/data.service';
import { ApiService } from '../../services/api/api.service';
import { apiUrls } from '../../constants/urlConstants';
import { NavigationEnd, Router, Routes, UrlTree } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { DetailsPageComponent } from '../details-page/details-page.component';
import { TaskDetailsPageComponent } from '../task-details-page/task-details-page.component';
import { AddFilesPageComponent } from '../add-files-page/add-files-page.component';
import { AddTaskPageComponent } from '../add-task-page/add-task-page.component';
import { AttachmentListingPageComponent } from '../attachment-listing-page/attachment-listing-page.component';
import { SyncPageComponent } from '../sync-page/sync-page.component';
import { PreviewDetailsPageComponent } from '../preview-details-page/preview-details-page.component';
import { LearningResourcesComponent } from '../learning-resources/learning-resources.component';
import { UtilsService } from '../../services/utils/utils.service';
import { CertificatePageComponent } from '../certificate-page/certificate-page.component';
import { ToastService } from '../../services/toast/toast.service';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'lib-main-player',
  templateUrl: './main-player.component.html',
  styleUrls: ['./main-player.component.css']
})
export class MainPlayerComponent implements OnInit {
  projectDetails:any;
  projectId:any;
  solutionId:any;
  @Input() projectData:any;
  @Input() config: any
  @ViewChild('dynamicComponent', { read: ViewContainerRef }) dynamicComponent!: ViewContainerRef;
  keyMap:any = {
    id: '_id',
    objective: 'description',
    recommended_duration: 'duration',
    is_mandatory: "isDeletable"
  };
  private routerSubscription!: Subscription;
  constructor(private routerService: RoutingService, private db: DbService, private apiService:ApiService, private dataService: DataService, private router: Router,
    private utils: UtilsService, private toastService: ToastService, private location: Location, private translate: TranslateService
  ) {}

  private componentMapper: any = {
    details: DetailsPageComponent,
    taskDetails: TaskDetailsPageComponent,
    addFile: AddFilesPageComponent,
    addTask: AddTaskPageComponent,
    attachments: AttachmentListingPageComponent,
    sync: SyncPageComponent,
    template: PreviewDetailsPageComponent,
    resources: LearningResourcesComponent,
    certificate: CertificatePageComponent

  };

  ngOnInit() {
      this.routerSubscription = this.router.events.pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event:any) => {
        const urlTree: UrlTree = this.router.parseUrl(event.urlAfterRedirects);
        const type = urlTree.queryParams['type'];
        this.loadComponent(type);
      });
  }

  loadComponent(type: string) {
    this.dynamicComponent.clear();
    const componentType = this.componentMapper[type];
    if (componentType) {
      this.dynamicComponent.createComponent(componentType);
    }
  }

  setRoutes(isPreview: any = false) {
    let routePath;
    if (isPreview) {
      routePath = window.location.pathname.slice(1)
    } else {
      const baseUrl = document.baseURI.replace(window.location.origin, "");
      const currentUrl = window.location.href.replace(window.location.origin, "");
      routePath = currentUrl.replace(baseUrl, "");
    }
    let newRoutes: Routes = [
      { path: routePath, component: MainPlayerComponent },
      { path: '**', redirectTo: routePath }
    ]
    this.router.resetConfig(newRoutes)
  }

  ngOnChanges(changes: SimpleChanges) {
    this.setLanguage(changes['config'].currentValue.language)
    this.dataService.setConfig(changes['config'].currentValue)
    this.projectData = changes['projectData'].currentValue
    this.setRoutes(changes['config'].currentValue.isPreview)
    if(changes['config'].currentValue.isPreview){
      let formattedData = this.utils.snakeToCamelCaseConverter(this.projectData, this.keyMap)
      let projectData = { ...formattedData, isPreview: changes['config'].currentValue.isPreview }
      let data = {
        key: projectData._id,
        data: projectData
      }
      setTimeout(() => {
        this.db.addData(data)
        this.routerService.navigate("/project-details",{ type:'template',id: projectData._id },{ replaceUrl:true })
      },100)
      return
    }
    if(!this.projectData){
      let urlQueryParams = this.getQueryParams(window.location.search)
      this.projectData = urlQueryParams
    }
    if(this.utils.isLoggedIn()){
      setTimeout(() => {
        if(this.projectData.referenceFrom == "certificate"){
          let urlQueryParams = this.getQueryParams(window.location.search)
          this.routerService.navigate(window.location.pathname, urlQueryParams, { replaceUrl: true })
          return
        }
        if(this.projectData.referenceFrom == "library"){
          this.routerService.navigate("/project-details",{ type:'template', ...this.projectData },{ replaceUrl:true })
          return
        }
        let id = this.projectData?._id || this.projectData?.projectId
        if(id){
          this.projectId = id;
        } else {
          this.solutionId = this.projectData.solutionId;
        }
        this.storeDataToLocal()
      }, 100);
    }else{
      if(this.projectData.referenceFrom == "link"){
        this.routerService.navigate("/project-details",{ type:'template',id: this.projectData.link, ...this.projectData },{ replaceUrl:true })
      }else{
        this.toastService.showToast("USER_NOT_LOGGEDIN_MSG","danger")
        setTimeout(() => {
          history.replaceState(null, '', '/');
          window.location.href = '/'
        }, 1000);
      }
    }

  }

  navigateToDetails(type:string){
    let pageType = type ? type : "details"
    this.routerService.navigate("/project-details",{ type: pageType,id: this.projectId, ...this.projectData },{ replaceUrl:true })
  }

  navigateToTemplate(){
    this.routerService.navigate("/project-details",{ type:'template',id: this.solutionId, ...this.projectData },{ replaceUrl:true })
  }

  storeDataToLocal(){
    if(this.projectId){
      this.db.getData(this.projectId).then((data)=>{
        if(data){
          this.navigateToDetails(this.projectData.type)
        }else{
          this.getProjectDetails()
        }
        }).catch((res)=>{
          this.getProjectDetails()
      })
    }
    else {
      this.navigateToTemplate()
    }
  }

  getProjectDetails(){
    const configForProjectId = {
      url: `${apiUrls.GET_PROJECT_DETAILS}/${this.projectId}`,
      payload: {}
    }
      this.apiService.post(configForProjectId).subscribe((res)=>{
        if(!res.result._id){
          this.toastService.showToast("NO_SOLUTION_FOUND","danger")
          setTimeout(() => {
            this.location.back()
          },1000);
          return
        }
        this.projectDetails = res.result;
        if(this.projectDetails){
          let data = {
            key: this.projectDetails._id,
            data: this.projectDetails
          }
          this.db.addData(data)
          this.navigateToDetails(this.projectData.type)
        }
      })
  }

  ngOnDestroy(){
    if(this.dataService.getConfig().isPreview){
      this.db.clearDb()
    }
    this.dataService.clearConfig()
    this.routerService.navigate('/',{},{skipLocationChange: true})
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  getQueryParams(queryParams:any){
    const queryObj: any = {}

    if (queryParams.startsWith('?')) {
      queryParams = queryParams.substring(1);
    }

    const queryArray = queryParams.split('&');

    queryArray.forEach((query:any) => {
        const [key, value] = query.split('=');
        queryObj[key] = value 
    });
    return queryObj;
  }

  setLanguage(language: string) {
    let preferredLanguage = language ? language : "en"
    this.translate.setTranslation(preferredLanguage, require(`../../assets/i18n/${preferredLanguage}.json`));
    this.translate.setDefaultLang(preferredLanguage);
  }
}

import { Component } from '@angular/core';
import { actions } from '../../constants/actionConstants';
import { Router, UrlTree } from '@angular/router';
import { ApiService } from '../../services/api/api.service';
import { apiUrls } from '../../constants/urlConstants';
import { DataService } from '../../services/data/data.service';
import { MatDialog } from '@angular/material/dialog';
import { StartImprovementPopupComponent } from '../../shared/start-improvement-popup/start-improvement-popup.component';
import { UtilsService } from '../../services/utils/utils.service';
import { ToastService } from '../../services/toast/toast.service';
import { Location } from '@angular/common';
import { PreviewStrategyFactory } from '../../services/strategy/preview-strategy.service';
import { DbService } from '../../services/db/db.service';

@Component({
  selector: 'lib-preview-details-page',
  templateUrl: './preview-details-page.component.html',
  styleUrl: './preview-details-page.component.css'
})
export class PreviewDetailsPageComponent {
  projectDetails:any;
  actionsList = [];
  displayedTasks:any;
  remainingTasks = [];
  startImprovement: boolean = true;
  id:any;
  stateData:any = {}
  private strategy: any
  constructor(private apiService:ApiService,private dataService: DataService,
    private dialog: MatDialog, private router: Router, private utils: UtilsService, private toastService: ToastService,
    private location: Location, private previewStrategyFactory: PreviewStrategyFactory, private db: DbService
  ){
    const urlTree: UrlTree = this.router.parseUrl(this.router.url);
    this.id = urlTree.queryParams['id']
    this.stateData = urlTree.queryParams
    this.stateData["isATargetedSolution"] = this.stateData.isATargetedSolution ? this.stateData.isATargetedSolution == "true" : null
    let config = this.dataService.getConfig()
    let isPreview = config.isPreview
    if(isPreview){
      this.db.getData(this.id).then(data=>{
        this.projectDetails = data.data
        this.setActionsList();
        this.initializeTasks()
      })
      return
    }
    if(this.utils.isLoggedIn()){
      if(this.stateData.referenceFrom == "library"){
        this.getTemplateByExternalId()
      }else if(this.stateData.referenceFrom == "observation"){
        this.getTemplateByObsExternalId()
      }else{
        this.getProjectTemplate()
      }
    }else{
      this.getTemplateByExternalId(true)
    }
  }
  ngOnInit(): void {
  }

  getTemplateByExternalId(isLink?:boolean){
    let config = {
      url: isLink ? `${apiUrls.GET_TEMPLATE_BY_LINK}?link=${this.id}` : `${apiUrls.GET_TEMPLATE_BY_LINK}/${this.stateData.externalId}`
    }
    this.apiService.get(config).subscribe({
      next: (response:any) => {
        this.projectDetails = response.result;
        this.setActionsList();
        this.initializeTasks()
      },
      error: (error:any) => {
        setTimeout(() => {
          this.location.back()
        }, 1000);
      }
    })
  }

  getTemplateByObsExternalId(){
    let config = {
      url: `${apiUrls.GET_TEMPLATE_BY_EXTERNAL_ID}/${this.stateData.externalId}`
    }
    this.apiService.get(config).subscribe({
      next: (response:any) => {
        this.projectDetails = response.result;
        this.setActionsList();
        this.initializeTasks()
      },
      error: (error:any) => {
        setTimeout(() => {
          this.location.back()
        }, 1000);
      }
    })
  }

  getProjectTemplate(){
    let config = this.dataService.getConfig()
    let profileInfo = config.profileInfo
    const configForSolutionId = {
      url: `${apiUrls.GET_TEMPLATE_DETAILS}${this.id}`,
      payload: profileInfo
    }
    this.apiService.post(configForSolutionId).subscribe((res)=>{
      this.projectDetails = res.result;
      this.setActionsList();
      this.initializeTasks()
    })
}
  setActionsList(){
    let optionList:any = actions.ACTION_LIST;
    this.actionsList = optionList;
  }
  taskCardAction(event:any){
  }
  navigate(){
    this.showStartImprovementPopup()
  }
  onLearningResources(){
  }
  onStartObservation(){
  }
  initializeTasks(): void {
    if (this.projectDetails.tasks && this.projectDetails.tasks.length > 0) {
      this.displayedTasks = this.projectDetails.tasks.slice(0, 4);
      this.remainingTasks = this.projectDetails.tasks.slice(4);
    }
  }

  loadMoreTasks(): void {
    if (this.remainingTasks.length > 0) {
      this.displayedTasks.push(...this.remainingTasks);
      this.remainingTasks = [];
    }
  }

  startImprovementProgram(data:Event){
    if(data){
      this.navigate();
    }
  }

  showStartImprovementPopup() {
    const dialogRef = this.dialog.open(StartImprovementPopupComponent, {
      width: '400px',
      minHeight: '150px',
    });

    dialogRef.afterClosed().subscribe(data=>{
      if(data){
        this.startProject()
      }
    })
  }

 async startProject(){
    if(!this.utils.isLoggedIn() && !this.projectDetails.isPreview){
      this.toastService.showToast("USER_NOT_LOGGEDIN_MSG","danger")
      setTimeout(() => {
        history.replaceState(null, '', '/');
        window.location.href = this.dataService.getConfig()?.redirectionLinks?.unauthorizedRedirectUrl ?? '/'
      }, 1000);
      return
    }
    let strategyType = "targetted"
    if(this.stateData?.referenceFrom === "library"){
      strategyType = "library"
    }else if(this.stateData?.referenceFrom === "link" && !this.stateData?.isATargetedSolution){
      strategyType = "nonTargetted"
    }
    this.strategy = this.previewStrategyFactory.getStrategy(strategyType)
    let data = { ...this.projectDetails, ...this.stateData }
    this.strategy.start(data)
  }

  onFeedback(){}
}

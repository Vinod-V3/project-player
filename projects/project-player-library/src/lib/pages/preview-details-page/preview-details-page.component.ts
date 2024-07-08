import { Component, SimpleChanges } from '@angular/core';
import { actions } from '../../constants/actionConstants';
import { RoutingService } from '../../services/routing/routing.service';
import { ActivatedRoute } from '@angular/router';
import { DbService } from '../../services/db/db.service';
import { ApiService } from '../../services/api/api.service';
import { apiUrls } from '../../constants/urlConstants';
import { DataService } from '../../services/data/data.service';
import { MatDialog } from '@angular/material/dialog';
import { StartImprovementPopupComponent } from '../../shared/start-improvement-popup/start-improvement-popup.component';

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
  solutionId:any;
  constructor(private routerService:RoutingService,private activatedRoute:ActivatedRoute,private db:DbService,private apiService:ApiService,private dataService: DataService,
    private dialog: MatDialog
  ){
    activatedRoute.params.subscribe(param=>{
     this.solutionId = param['id']
     this.getProjectTemplate()
    })
  }
  ngOnInit(): void {
  }

  getProjectTemplate(){
    let config = this.dataService.getConfig()
    let profileInfo = config.profileInfo
    const configForSolutionId = {
      url: `${apiUrls.GET_TEMPLATE_DETAILS}${this.solutionId}`,
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

  getProjectDetails(){
    console.log("this is getProjectDetails")
    let config = this.dataService.getConfig()
    console.log("this is getProjectDetails",config)
    let profileInfo = config.profileInfo
    console.log("this is getProjectDetails",profileInfo)
    const configForProjectId = {
      url: `${apiUrls.GET_PROJECT_DETAILS}?solutionId=${this.solutionId}&templateId=${this.projectDetails.externalId}`,
      payload: { ...profileInfo, type: "improvementProject" }
    }
    console.log("this is getProjectDetails",configForProjectId)
      this.apiService.post(configForProjectId).subscribe((res)=>{
        if(res.result){
          let data = {
            key: res.result._id,
            data: res.result
          }
          this.db.addData(data)
          this.routerService.navigate(`/details/${res.result._id}`);
        }
      })
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
        this.getProjectDetails()
      }
    })
  }
}

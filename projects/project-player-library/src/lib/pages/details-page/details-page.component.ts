import { Component, OnInit } from '@angular/core';
import { RoutingService } from '../../services/routing/routing.service';
import { actions } from '../../constants/actionConstants';
import { DbService } from '../../services/db/db.service';
import { Router, UrlTree } from '@angular/router';
import { ToastService } from '../../services/toast/toast.service';
import { UtilsService } from '../../services/utils/utils.service';
import { statusType } from '../../constants/statusConstants';
import { ProjectService } from '../../services/project/project.service';
import { apiUrls } from '../../constants/urlConstants';
import { ApiService } from '../../services/api/api.service';
import { NetworkServiceService } from 'network-service';

@Component({
  selector: 'lib-details-page',
  templateUrl: './details-page.component.html',
  styleUrls: ['./details-page.component.css'],
})
export class DetailsPageComponent implements OnInit {
  completedCount: number = 0;
  progressValue: number = 0;
  actionsList = [];
  projectActions = []
  submitted: boolean = false;
  projectDetails:any;
  displayedTasks:any[]=[];
  remainingTasks:any[]=[];
  tasksList:any = []
  selectedTabIndex:any = 0
  isOnline:any;
  showProjectShareControl = false
  projectShare = false
  statusConstant = statusType

  constructor(private routerService: RoutingService, private db: DbService,
    private toasterService:ToastService, private utils: UtilsService, private projectService: ProjectService, private apiService: ApiService, private router: Router,private network:NetworkServiceService
  ) {
    this.network.isOnline$.subscribe((status)=>{
      this.isOnline=status
    })
    // const urlTree: UrlTree = this.router.parseUrl(this.router.url);
    // const id = urlTree.queryParams['id'];
    // this.selectedTabIndex = urlTree.queryParams['tab'] || 0
    // this.getData(id)
    console.log("constructor is called")
  }

  ngOnInit(): void {
    console.log("Oninit is called")
    const urlTree: UrlTree = this.router.parseUrl(this.router.url);
    const id = urlTree.queryParams['id'];
    this.selectedTabIndex = urlTree.queryParams['tab'] || 0
    this.getData(id)
  }

  getData(id:any){
    this.db.getData(id).then(data=>{
      this.projectDetails = data.data
      this.submitted = data.data.status == statusType.submitted
      this.tasksList = data.data.tasks || []
      this.projectShare = data.data.hasAcceptedTAndC || false
      this.initializeTasks()
      this.getProjectTaskStatus()
      this.countCompletedTasks();
      this.calculateProgress();
      this.setActionsList()
    })
  }
  countCompletedTasks() {
    this.completedCount = 0; // Reset the count each time the method is called

    if (this.tasksList.length > 0) {
      this.tasksList.forEach((task: any) => {
        if (task.status === statusType.completed) {
          this.completedCount++;
        }
      });
    }
  }

  calculateProgress(): void {
    const totalTasks = this.tasksList.length

    if (totalTasks > 0 && this.completedCount > 0) {
      this.progressValue = (this.completedCount / totalTasks) * 100;
    } else {
      this.progressValue = 0; // Ensure progress is zero if no tasks are completed
    }
  }

  submitImprovement() {
    if(this.projectDetails.isPreview){
      this.toasterService.showToast("PREVIEW_MODE_MSG","danger")
      return
    }
    this.routerService.navigate("/project-details",{ type:"addFile", projectId:this.projectDetails._id })
  }

  navigateToNewTask() {
    this.routerService.navigate('/project-details',{ type: "addTask", projectId: this.projectDetails._id })
  }

  taskCardAction(event:any){
    switch (event.action) {
      case 'edit':
        this.moveToDetailsTask(event._id);
        break;

      case 'share':
        if(!this.isOnline){
          this.toasterService.showToast("OFFLINE_MSG",'danger')
          return
        }
        if(this.projectDetails.isPreview){
          this.toasterService.showToast("PREVIEW_MODE_MSG","danger")
          return
        }
        this.projectService.showSyncSharePopup('task', event.name, this.projectDetails, event._id)
        break;

      case 'delete':
        this.openDialogForDelete(event._id);
        break;

      default:
        break;
    }
  }

  moveToDetailsTask(taskId: any) {
    if (!this.submitted) {
      this.routerService.navigate('/project-details',{ type: "taskDetails", taskId: taskId, projectId: this.projectDetails._id })
  }
  }

  iconListAction(event: any) {
    if(this.projectDetails.isPreview){
      let list = ["download","share","sync"]
      if(list.includes(event.action)){
        this.toasterService.showToast("PREVIEW_MODE_MSG","danger")
        return
      }
    }
    switch (event.action) {
      case "download":
        if(!this.isOnline){
          return this.toasterService.showToast("PROJECT_DOWNLOAD_FAILED","danger")
        }
        this.projectDetails.isDownload = true;
        let data = {
          key: this.projectDetails._id,
          data:this.projectDetails,
        }
        this.db.updateData(data)
        this.setActionsList()
        this.toasterService.showToast("PROJECT_DOWNLOADING_SUCCESS","success")
        break;

      case "share":
        if(!this.isOnline){
          this.toasterService.showToast("OFFLINE_MSG",'danger')
          return
        }
        this.projectService.showSyncSharePopup('project', this.projectDetails.title, this.projectDetails)
        break;

      case "files":
        this.moveToFiles()
        break;

      case "sync":
        if(!this.isOnline){
          this.toasterService.showToast("OFFLINE_MSG",'danger')
          return
        }
        this.routerService.navigate('/project-details',{type: "sync", projectId:this.projectDetails._id})
        break;

        case "edit":
          this.routerService.navigate('/project-details',{type: "editDetails", projectId:this.projectDetails._id})
        break;

        case "certificate":
        this.routerService.navigate('/project-details',{type: "certificate",projectId:this.projectDetails._id})
        break;

      default:
        break;
    }
  }

    moveToFiles() {
    this.routerService.navigate('/project-details',{ type: "attachments", projectId: this.projectDetails._id });
  }

  async openDialogForDelete(id:any) {
    let popupDetails= {
      title: "CONFIRMATION_DELETE",
      actionButtons: [
        { label: "NO", action: false},
        { label: "YES", action: true }
      ]
    }
    let response = await this.utils.showDialogPopup(popupDetails)

    if(response){
      let taskIndex = this.projectDetails.tasks.findIndex((data:any)=>{
        return data._id == id
      })
      this.projectDetails.tasks[taskIndex].isDeleted = true
      this.projectDetails.tasks[taskIndex].isEdit = true
      this.projectDetails.isEdit = true
      let finalData = {
        key: this.projectDetails._id,
        data:this.projectDetails
      }
      this.db.updateData(finalData)
      this.initializeTasks()
      this.setActionsList()
      this.countCompletedTasks();
      this.calculateProgress();
      this.toasterService.showToast("TASK_DELETE_SUCCESS","success")
    }
  }

  setActionsList(){
    let options:any = JSON.parse(JSON.stringify(actions.PROJECT_ACTIONS));
    let optionList:any = actions.ACTION_LIST;
    if(!this.projectDetails.isEdit){
      options[options.length-1] = actions.SYNCED_ACTION
    }
    if(this.projectDetails.isDownload){
      options[0] = actions.DOWNLOADED_ACTION
    }
    if(this.submitted){
      options.shift();
      options.pop()
      options.pop()
      if(this.projectDetails.certificate){
        options.push(actions.CERTIFICATE_ACTION)
      }
    }
    this.projectActions = options;
    this.actionsList = optionList;
  }


  onLearningResources(id:any,fromDetailspage:boolean){
    this.routerService.navigate("/project-details",{ type: "resources", taskId: id, projectId: this.projectDetails._id})

  }
  onStartObservation(data:any){
    let submissionDetails = data.submissionDetails
    let enableObserveAgain = !(data.status == statusType.completed)
    if(submissionDetails?.observationId){
      console.log("navigate to obser")
      let path = `/managed-observation-portal/details/${submissionDetails?.observationId}/${submissionDetails?.entityId}/${enableObserveAgain}`
      this.routerService.navigateByHref(path)
    }else{
      if(!this.isOnline){
        this.toasterService.showToast("OFFLINE_MSG",'danger')
      }else{
        this.projectService.startAssessment(this.projectDetails, data)
      }
    }
  }
  initializeTasks(): void {
    this.tasksList = this.tasksList.filter((data:any)=>{
      return !data.isDeleted
    })
    if (this.tasksList && this.tasksList.length > 0) {
      this.displayedTasks = this.tasksList.slice(0, 4);
      this.remainingTasks = this.tasksList.slice(4);
    }else{
      this.displayedTasks=[]
      this.remainingTasks=[]
    }
  }

  loadMoreTasks(): void {
    if (this.remainingTasks.length > 0) {
      this.displayedTasks.push(...this.remainingTasks);
      this.remainingTasks = [];
    }
  }

  getProjectTaskStatus(){
    if(this.projectDetails.isPreview){
      return
    }
    if(!this.tasksList && this.tasksList.length){
      return
    }
    let taskIdList = this.getAssessmentTypeTaskIds()
    if(!taskIdList.length){
      return
    }
    const config = {
      url: `${apiUrls.PROJECT_TASK_STATUS}/${this.projectDetails._id}`,
      payload: { taskIds: taskIdList }
    }
    this.apiService.post(config).subscribe(response=>{
      if(!response.result){
        return
      }
      this.updateAssessmentStatus(response.result)
    })

  }

  getAssessmentTypeTaskIds(){
    const taskIdsList = []
    for(const task of this.tasksList){
      task.type == "assessment" || task.type == "observation" ? taskIdsList.push(task._id) : null
    }
    return taskIdsList
  }

  updateAssessmentStatus(assessmentList:any){
    let isChanged = false
    this.projectDetails.tasks.map((taskData:any)=>{
      assessmentList.map((data:any)=>{
        if(data.type == "assessment" || data.type == "observation"){
          if(data._id == taskData._id && data.submissionDetails.status){
            if(!taskData.submissionDetails || JSON.stringify(taskData.submissionDetails) != JSON.stringify(data.submissionDetails)){
              taskData.submissionDetails = data.submissionDetails
              taskData.status = data.submissionDetails.status
              taskData.isEdit = true
              isChanged = true
              this.projectDetails.isEdit = true
              this.countCompletedTasks();
              this.calculateProgress();
              this.setActionsList()
            }
          }
        }
      })
    })
    if(isChanged){
      let finalData = {
        key: this.projectDetails._id,
        data:this.projectDetails
      }
      this.db.updateData(finalData)
    }
  }

  onTabChange(tabIndex:any){
    this.selectedTabIndex = tabIndex
    switch (tabIndex) {
      case 0:
        this.routerService.navigate('',{ tab: null },{queryParamsHandling: 'merge', replaceUrl: true})
        break;
      case 1:
        this.routerService.navigate('',{ tab: 1 },{queryParamsHandling: 'merge', replaceUrl: true})
        break;
    
      default:
        break;
    }
  }

  saveShareOption(){
    if(this.projectDetails.hasAcceptedTAndC !== this.projectShare){
      this.projectDetails.isEdit = true
      this.projectDetails.hasAcceptedTAndC = this.projectShare
      let data = {
        key: this.projectDetails._id,
        data:this.projectDetails
      }
      this.db.updateData(data)
      this.setActionsList()
    }
    this.showProjectShareControl = false
  }

  closeShareControl(){
    this.projectShare = this.projectDetails.hasAcceptedTAndC
  }
}

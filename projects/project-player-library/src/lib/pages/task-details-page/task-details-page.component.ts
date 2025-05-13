import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UrlTree } from '@angular/router';
import { EditTaskCardComponent } from '../../shared/edit-task-card/edit-task-card.component';
import { actions } from '../../constants/actionConstants';
import { RoutingService } from '../../services/routing/routing.service';
import { DbService } from '../../services/db/db.service';
import { UtilsService } from '../../services/utils/utils.service';
import { ToastService } from '../../services/toast/toast.service';
import { statusType } from '../../constants/statusConstants';
import { Router } from '@angular/router';
import { BackNavigationHandlerComponent } from '../../shared/back-navigation-handler/back-navigation-handler.component';

interface TaskOption {
  value: any;
  label: string;
}
@Component({
  selector: 'lib-taskdetails-page',
  templateUrl: './task-details-page.component.html',
  styleUrl: './task-details-page.component.css',
})
export class TaskDetailsPageComponent extends BackNavigationHandlerComponent implements OnInit {
  constructor( private dialog: MatDialog, private routingService: RoutingService,
    private db: DbService,private utils: UtilsService,private toasterService:ToastService, private router: Router) {
      super(routingService)
    }
  taskId: any;
  selectedValue!: string;
  textFormControl = new FormControl('');
  task: any = {};
  taskOptions : TaskOption[] =[];
  projectId: any
  projectDetails:any
  subTaskData:any;
  params:any = {}
  isDisabled:boolean = false

  ngOnInit(): void {
    this.setOptionList();
    const urlTree: UrlTree = this.router.parseUrl(this.router.url);
    this.taskId = urlTree.queryParams['taskId']
    this.projectId = urlTree.queryParams['projectId']
    this.params = { type: "details", id: this.projectId, tab: 1 }
    this.getProjectDetails()
  }

  getProjectDetails(){
    this.db.getData(this.projectId).then(data=>{
      this.projectDetails = data.data
      this.getTaskDetails();
    })
  }

  getTaskDetails() {
    this.task = this.projectDetails.tasks.find(
      (task:any) => task._id === this.taskId
    );
    this.checkIsDisabled()
  }
  addSubTask(data: any) {
    this.subTaskData = this.utils.getMetaData();
    this.subTaskData.name = data,
    delete this.subTaskData.children;
    this.task.children ? this.task.children : this.task.children = []
    this.task.children.push(this.subTaskData);
    this.updateTaskStatus();
    this.textFormControl.reset();
  }
  editTask() {
    if(this.task.isDeletable){
      this.openEditTaskName(this.task.name,"EDIT_TASK");
    }
  }
  openEditTaskName(
    taskName: string,
    editType:string
  ): void {
    const modelref = this.dialog.open(EditTaskCardComponent, {
      width: '400px'
    });
    modelref.componentInstance.title = taskName;
    modelref.componentInstance.editType=editType;
    modelref.componentInstance.editName.subscribe((res) => {
      this.task.name = res;
    });
    modelref.afterClosed().subscribe((res: boolean) => {
      if (res) {
        this.updateDataInDb()
      }
    });
  }

  openDatePickerForTask() {}

  deleteSubTask(event: any) {
    const index = this.task.children.findIndex(
      (child: any) => child._id === event._id
    );
    if (index !== -1) {
      this.task.children.splice(index, 1);
      this.updateTaskStatus();
    }
  }
  updateTaskStatus(event?: any) {
      const allNotStarted = this.task.children.every(
        (child: any) => child.status === statusType.notStarted
      );
      const allCompleted = this.task.children.every(
        (child: any) => child.status === statusType.completed
      );
      if (allNotStarted) {
        this.task.status = statusType.notStarted;
      } else if (allCompleted) {
        this.task.status = statusType.completed;
      } else {
        this.task.status = statusType.inProgress;
      }
      this.updateDataInDb();
  }
  setOptionList(){
    let options:any = actions.TASK_STATUS;
    this.taskOptions = options;
  }


  taskStatusChange(){
    setTimeout(()=>{
      this.updateDataInDb()
    },0)
  }

  updateDataInDb(){
    this.task.isEdit = true
    this.projectDetails.isEdit = true
    this.projectDetails.status =  this.projectDetails.status ? this.projectDetails.status : statusType.notStarted;
    this.projectDetails.status =  this.projectDetails.status == statusType.notStarted ? statusType.inProgress:this.projectDetails.status;
    this.projectDetails = this.utils.setStatusForProject(this.projectDetails);
    let finalData = {
      key:this.projectDetails._id,
      data:this.projectDetails
    }
    this.db.updateData(finalData);
    this.getProjectDetails();
    this.toasterService.showToast("FILES_CHANGES_UPDATED","success")
  }

  async addFiles(){
    let response = await this.utils.showPopupWithCheckbox("evidence")
    if(response){
      if(response.isChecked && response.buttonAction){
        this.routingService.navigate("/project-details",{ type:"addFile",taskId:this.taskId ,projectId:this.projectDetails._id })
      }else{
        this.toasterService.showToast('ACCEPT_POLICY_ERROR_MSG',"danger")
      }
    }
  }

  onDateChange(newDate: any) {
    this.task.endDate = newDate;
    this.updateDataInDb();
  }

  onLearningResources(id:any,fromDetailspage:boolean){
    this.routingService.navigate("/project-details",{ type: "resources", taskId: id, projectId: this.projectDetails._id })
  }

  checkIsDisabled(){
    const specialTypeArray = ["assessment", "observation"]
    this.isDisabled = specialTypeArray.includes(this.task?.type) || (this.task?.children?.length > 0)
  }
}

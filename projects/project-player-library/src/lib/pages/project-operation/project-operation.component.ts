import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DbService } from '../../services/db/db.service';
import { MatDialog } from '@angular/material/dialog';
import { SelectDialogComponent } from '../../shared/select-dialog/select-dialog.component';
import { DataService } from '../../services/data/data.service';
import { apiUrls } from '../../constants/urlConstants';
import { ApiService } from '../../services/api/api.service';
import { filter } from 'rxjs';
import { dialogData, learningResourceOptions } from '../../constants/dataConstants';
import { DialogInputComponent } from '../../shared/dialog-input/dialog-input.component';
import { UtilsService } from '../../services/utils/utils.service';
import { BackNavigationHandlerComponent } from '../../shared/back-navigation-handler/back-navigation-handler.component';
import { RoutingService } from '../../services/routing/routing.service';
import { Location } from '@angular/common';

@Component({
  selector: 'lib-advance-project-create-edit',
  templateUrl: './project-operation.component.html',
  styleUrl: './project-operation.component.css'
})
export class ProjectOperationComponent extends BackNavigationHandlerComponent {
  formType:any;
  key:any;
  projectDetails:any;
  startDate: string | null = null;
  endDate: string | null = null;
  selectedProgram: any;
  selectedEntity: any;
  selectedLearningResource:any;

  constructor(private routingService:RoutingService, private router: Router,private db:DbService,private dialog: MatDialog,private dataService:DataService,private apiService:ApiService,private utils:UtilsService,private location:Location) {
    super(routingService)
  }

  ngOnInit() {
    const urlTree = this.router.parseUrl(this.router.url);
    this.formType = urlTree.queryParams['option'];
    this.key = urlTree.queryParams['key'];

    this.db.getData(this.key).then((data: any) => {
      if (data) {
        this.projectDetails = data.data;

        if (this.formType === 'edit') {
          this.startDate = this.projectDetails.startDate;
          this.endDate = this.projectDetails.endDate;
          if(this.projectDetails.programName){
            this.selectedProgram = {
              name: this.projectDetails.programName,
              _id: this.projectDetails.programId,
              isAPrivateProgram: this.projectDetails.isAPrivateProgram
            };
          }
          if(this.projectDetails.entityName){
            this.selectedEntity = {
              _id: this.projectDetails.entityId,
              name: this.projectDetails.entityName
            };
          }
          this.selectedLearningResource = this.projectDetails.learningResources ? this.projectDetails.learningResources : [];
        }
      }
    });
  }

    // Triggers confirmation dialog before proceeding to add the project without reviewing
  skip(){
    this.viewProject();
  }

  // Updates the start date when user selects a new start date
onStartDateChange(date: string) {
  this.startDate = date;
}

  // Updates the end date when user selects a new end date
onEndDateChange(date: string) {
  this.endDate = date;
}

  // Opens a dialog to select a program and sets the selected program on confirmation
async openProgramDialog() {
    const data = dialogData.program;
      const result = await this.openDialog(data);
  if (result) {
    this.selectedProgram = result;
  }
}

  // Fetches sub-entities and opens a dialog to select an entity, sets selected entity on confirmation
async openEntityDialog(){

  const options = await this.getSubentities();
  const data = {...dialogData.entity,filters:options,
    defaultFilter: [options[0]]}
   const result = await this.openDialog(data);
  if (result) {
    this.selectedEntity = result;
  }
}

  // Utility method to open selection dialog and return selected value as a promise
openDialog(data: any): Promise<any> {
  const dialogWidth = window.innerWidth < 500 ? '90vw' : '500px';
  const dialogRef = this.dialog.open(SelectDialogComponent, {
    width: dialogWidth,
    maxWidth: '95vw',
    data: data
  });

  return dialogRef.afterClosed().toPromise(); // Converts Observable to Promise
}

  // Opens dialog to select learning resources and stores them in selectedLearningResource
async openLearningResourceDialog(){

  const options = learningResourceOptions;
  const data = {
    ...dialogData.learningResource,
    filters:options,
    defaultFilter: [options[0]],
    selectedValue:this.selectedLearningResource
  }
  const result = await this.openDialog(data);
  if (result) {
    this.selectedLearningResource = result;
  }
}

  // Constructs and validates project payload; if creating, shows success popup before saving;
  // if editing, updates local DB and navigates to project details
async viewProject() {
  const metaData = this.utils.getProjectMetaData();

  const operationData = {
    startDate: this.startDate,
    endDate: this.endDate,
    programName: this.selectedProgram?.name,
    programId: this.selectedProgram?._id,
    isAPrivateProgram: this.selectedProgram.isAPrivateProgram ? true : false,
    entityId: this.selectedEntity?._id,
    entityName: this.selectedEntity?.name,
    learningResources: this.selectedLearningResource?.length ? this.selectedLearningResource : []
  };

  const rawData = Object.fromEntries(
    Object.entries(operationData).filter(([_, v]) =>
      v !== undefined && v !== null && v !== '' &&
      !(Array.isArray(v) && v.length === 0)
    )
  );
  if(this.formType == 'create'){
    let data: any = {
      ...metaData,
      ...rawData,
      title: this.projectDetails.title,
      description: this.projectDetails.description,
      categories: this.projectDetails.categories,
      tasks: this.projectDetails.tasks,
      hasAcceptedTAndC: this.projectDetails.hasAcceptedTAndC,
    };
    this.projectDetails = data;

    this.confirmPopup().then((confirmed) => {
      if (confirmed) {
        this.addProject(this.projectDetails);
      }
    });
  }
  else{
    let data: any = {
      ...this.projectDetails,
      startDate: this.startDate ? this.startDate : null,
      endDate: this.endDate ? this.endDate : null,
      programName: this.selectedProgram?.name ? this.selectedProgram?.name : "",
      programId: this.selectedProgram?.id ? this.selectedProgram?.id : "",
      entityId: this.selectedEntity?._id ? this.selectedEntity?._id : "",
      entityName: this.selectedEntity?.name ? this.selectedEntity?.name : "",
      learningResources: this.selectedLearningResource?.length ? this.selectedLearningResource : []
    };
    data.isEdit = true;
    const rawDataEdit = Object.fromEntries(
      Object.entries(data).filter(([_, v]) =>
        v !== undefined && v !== null && v !== '' &&
        !(Array.isArray(v) && v.length === 0)
      )
    );
    rawDataEdit['tasks'] = this.projectDetails.tasks ? this.projectDetails.tasks : [];
    let updatePayload = {
      key: rawDataEdit['_id'],
      data: rawDataEdit
    };

    await this.db.updateData(updatePayload);
    this.location.back();
  }
}

// Fetches sub-entities based on the logged-in user's state and role
async getSubentities(): Promise<any[]> {
  const profileDataString = localStorage.getItem('profileData');
  let profileData: { state?: string, role?: string } | null = null;
  if (profileDataString) {
    profileData = JSON.parse(profileDataString);
  }
  const configForSubentity = {
    url: `${apiUrls.SUB_ENTITY}${profileData?.state}?role=${profileData?.role}`,
    payload: {}
  };
  return new Promise((resolve, reject) => {
    this.apiService.get(configForSubentity).subscribe(
      (res) => {
        if (res) {
          resolve(res.result);
        } else {
          resolve([]);
        }
      },
      (error) => {
        reject(error);
      }
    );
  });
}

// Deletes selected program/entity/resource based on the type and optional index
async confirmDelete(type?:string,index?: number){
    switch
    (type) {
      case 'learningResource':
        this.selectedLearningResource.splice(index, 1);
        break;
      case 'entity':
        this.selectedEntity = null;
        break;
      case 'program':
        this.selectedProgram = null;
        break;
    }
}

// Sends project data to backend to create the project, stores response in local DB, and navigates
async addProject(projectDetails:any){
  this.db.deleteData(projectDetails.title);
  const config = {
    url: apiUrls.ADD_PROJECT,
    payload: projectDetails
  }
  this.apiService.post(config).subscribe(async (res) => {
    if (res) {
      const response = res.result;
      if (response) {
        let projectId = response.projectId;
        this.projectDetails = {
          ...this.projectDetails,
          lastDownloadedAt: response.lastDownloadedAt,
          _id : projectId,
        };
        if(response.programId){
          let programId = response.programId;
          this.projectDetails = {
            ...this.projectDetails,
            programId : programId,
          };
        }
        let data = {
          key : this.projectDetails._id,
          data : this.projectDetails
        }
        await this.db.addData(data);
        await this.syncprojectDetails();
      }
    }
  }, (error) => {
    console.error('Error:', error);
  });

}

// Navigates to project details page with sync and new project flags
syncprojectDetails(){
  this.routingService.navigate('/project-details',{type: "sync", projectId:this.projectDetails._id,isNew:true},{replaceUrl:true})
}

// Shows a dialog confirming project creation/update success with a 'View Project' button
async confirmPopup(){
  const dialogRef = await this.dialog.open(DialogInputComponent, {
    data: {
      label: this.formType === 'create' ? 'PROJECT_CREATED_SUCCESSFULLY_MSG':'PROJECT_UPDATE_MSG',
      required: false,
      showCancel: false,
      buttonText: { ok: 'VIEW_PROJECT' }
    },
    width: '300px'
  });

  return dialogRef.afterClosed().toPromise();
}

}



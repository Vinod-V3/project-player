import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { MatDialog } from '@angular/material/dialog';
import { DailogPopupComponent } from '../../shared/dialog-popup/dailog-popup.component';
import { firstValueFrom } from 'rxjs';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { statusType } from '../../constants/statusConstants';
import { DataService } from '../data/data.service';
import { privacyPolicyPopupData, shareProjectPopupData } from '../../constants/dataConstants';
import { PrivacyPolicyPopupComponent } from '../../shared/privacy-policy-popup/privacy-policy-popup.component';
import { CertificateConfirmationPopupComponent } from '../../shared/certificate-confirmation-popup/certificate-confirmation-popup.component';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  loader: any

  constructor(private dialog: MatDialog, private dataService: DataService) { }

  getMetaData() {
    let metaData = {
      _id: uuidv4(),
      status: "notStarted",
      name: "",
      endDate: "",
      assignee: "",
      type: "simple",
      attachments: [],
      startDate: "",
      isNew: true,
      isEdit: true,
      children: [],
      isDeleted: false,
      isDeletable: true
    };

    return metaData
  }

  async showDialogPopup(data:any,width?:any){
    const dialogRef = this.dialog.open(DailogPopupComponent, {
      width: width ? width : '400px',
      data: data
    });
    let response = await firstValueFrom(dialogRef.afterClosed())
    return response
  }

  viewFile(dataResponse:any){
    const w: any = window.open('', '_blank');
    const iframe = w.document.createElement('iframe');
    iframe.src = dataResponse;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    w.document.body.style.margin = '0';
    w.document.body.style.padding = '0';
    w.document.body.style.width = '100%';
    w.document.body.style.height = '100%';
    w.document.body.style.overflow = 'hidden';
    w.document.body.appendChild(iframe);
  }

  startLoader(){
    this.loader = this.dialog.open(LoaderComponent,{
      disableClose: true
    })
  }

  stopLoader(){
    this.loader = this.loader ? this.loader.close() : null
  }

  viewVideo(dataResponse: any) {
    const w: any = window.open('', '_blank');
    const video = w.document.createElement('video');
    video.src = dataResponse;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.border = 'none';
    video.controls = true;  // Adding controls so the user can play/pause the video
    w.document.body.style.margin = '0';
    w.document.body.style.padding = '0';
    w.document.body.style.width = '100%';
    w.document.body.style.height = '100%';
    w.document.body.style.overflow = 'hidden';
    w.document.body.appendChild(video);
}

  setStatusForProject(project: any){
    const projectData = { ...project };
    for (const task of projectData.tasks) {
      const activeSubTask = task.children ? task.children.filter((d:any) => !d.isDeleted) : []
      task.status = activeSubTask.length
        ? this.calculateStatus(task.children)
        : task.status;
    }
    let projectStatus = this.calculateStatus(projectData.tasks);
    if (projectData.status) {
      if (projectData.status == statusType.inProgress && projectStatus == statusType.notStarted) {
        projectData.status = statusType.inProgress;
      }else{
        projectData.status = projectStatus;
      }
    } else {
      projectData.status = statusType.notStarted;
    }
    return projectData;
  }

  calculateStatus(childArray:any) {
    let status;
    const items = [...childArray];
    const completedList = items.filter((d:any) => !d.isDeleted && d.status === statusType.completed)
    const inProgressList = items.filter((d:any) => !d.isDeleted && d.status === statusType.inProgress)
    const validchildArray = items.filter((d:any) => !d.isDeleted)
    if (completedList.length === validchildArray.length) {
      status = statusType.completed;
    } else if (inProgressList.length || completedList.length) {
      status = statusType.inProgress;
    } else {
      status = statusType.notStarted;
    }
    return validchildArray.length ? status : statusType.notStarted;
  }

  isLoggedIn(){
    let config = this.dataService.getConfig()
    let token = config.accessToken
    return token ? true : false
  }

  async showPopupWithCheckbox(type:any){
    let popupData = type == "evidence" ? privacyPolicyPopupData : shareProjectPopupData
    const dialogRef = this.dialog.open(PrivacyPolicyPopupComponent, {
      width:'400px',
      minHeight:'150px',
      data: popupData
    });
    let response = await firstValueFrom(dialogRef.afterClosed())
    return response
  }

  snakeToCamelCaseConverter(data:any, keyMap:any):any{
    if (Array.isArray(data)) {
      return data.map(item => this.snakeToCamelCaseConverter(item, keyMap));
    } else if (data !== null && typeof data === 'object') {
      return Object.keys(data).reduce((acc, key) => {
        let value = data[key];
        const newKey = keyMap[key] || this.toCamelCase(key);
        switch (key) {
          case 'recommended_duration':
            acc[newKey] = `${value.number} ${value.duration}`;
            break;
          case 'learning_resources':
            acc[newKey] = value.map((res: any) => ({ name: res.name,link: res.url }));
            break;
          case 'categories':
            acc[newKey] = value.map((category: string) => ({ name: category }));
            break;
          case 'id':
            acc[newKey] = String(value)
            break;
          case 'is_mandatory':
            acc[newKey] = !value
            break;
          default:
            acc[newKey] = this.snakeToCamelCaseConverter(value, keyMap);
        }
        return acc;
      }, {} as any);
    }
    return data;
  }

  toCamelCase(str: string){
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  getProjectMetaData(){
    let metaData = {
      title:"",
      description:"",
      categories:[],
      tasks:[],
      hasAcceptedTAndC: false,
      isDeleted: false,
      status: statusType.started,
    };
    return metaData;
  }

  postMessageListener(data:any):Promise<boolean>{
    return new Promise((resolve) => {
      try {
        if ((window as any).FlutterChannel) {
          (window as any).FlutterChannel.postMessage(data);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (err: any) {
        console.error('FlutterChannel Error:', err);
        resolve(false);
      }
    });
  }

  async showCertificateNamePopup(width?:any){
    const dialogRef = this.dialog.open(CertificateConfirmationPopupComponent, {
      width: width ? width : '400px',
      minHeight:'150px',
    });
    let response = await firstValueFrom(dialogRef.afterClosed())
    return response
  }

}
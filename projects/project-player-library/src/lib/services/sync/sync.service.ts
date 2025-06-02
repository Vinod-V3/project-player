import { Injectable } from '@angular/core';
import { apiUrls } from '../../constants/urlConstants';
import { statusType } from '../../constants/statusConstants';
import { ApiService } from '../api/api.service';
import { DbService } from '../db/db.service';
import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { AttachmentService } from '../attachment/attachment.service';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../data/data.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private customHttp: HttpClient;

  constructor(private apiService: ApiService, private db: DbService, private attachmentService: AttachmentService, private httpBackend: HttpBackend,
    private dataService: DataService
  ) {
    this.customHttp = new HttpClient(httpBackend);
  }

  getAttachmentsOfProject(projectDetails:any){
    let attachments:any = []

    if (projectDetails.attachments && projectDetails.attachments.length) {
      for (const attachment of projectDetails.attachments) {
        if (attachment.type != 'link') {
          !attachment['sourcePath'] ? attachments.push(attachment) : null;
        }
      }
    }

    for (const task of projectDetails.tasks) {
      if (task.attachments && task.attachments.length) {
        for (const attachment of task.attachments) {
          if (attachment.type != 'link') {
            !attachment['sourcePath'] ? attachments.push(attachment) : null;
          }
        }
      }
    }
    return attachments
  }

  removeKeys(data:any, fields:any) {
    for (const field of fields) {
      delete data[field]
      data.tasks = this.deleteSpecificKey(data.tasks, field)
    }
    return data
  }

  deleteSpecificKey(tasks:any, key:any) {
    for (const task of tasks) {
      delete task[key];
      if (task?.children && task?.children?.length) {
        for (const subTask of task?.children) {
          delete subTask[key]
        }
      }
    }
    return tasks
  }

  syncApiRequest(payload:any): Promise<any> {
    const obj:any = this.processPayload(payload);
    const { _id } = payload;
    delete payload._id;
    if (!obj.programId) {
      delete obj.programId
    }
    const config = {
      url: `${apiUrls.SYNC_PROJECT}${_id}?lastDownloadedAt=${payload.lastDownloadedAt}`,
      payload: obj
    }
    return new Promise((resolve, reject) => {
      this.apiService.post(config).subscribe(success => {
        resolve(success)
      })
    })
  }

  processPayload(data:any){
    delete data._rev;
    delete data.solutionInformation;
    delete data.programInformation;
    delete data.userId;
    delete data.downloaded;
    data.status = (data.status === statusType.notStarted) ? statusType.started : data.status;
    data.status = (data.status === statusType.completed) ? statusType.inProgress : data.status;
    return data
  }

  getImageUploadUrls(projects:any):Promise<any>{
    const payload = this.createImageUrlPayload(projects)
    return new Promise((resolve, reject) => {
      const config = {
        url: apiUrls.PRE_SIGNED_URL,
        payload: {...payload, ref: "improvementProject"},
      };
      this.apiService.post(config).subscribe(success => {
        let formattedData = {
          cloudStorage: success.result.cloudStorage,
          files: success.result[projects._id].files
        }
        resolve(formattedData)
      })
    })
  }

  async cloudImageUpload(fileDetails:any){
    return new Promise(async(resolve, reject) => {
      await this.db.getData(fileDetails.name).then(async fileData=>{
        let convertedFile
        if(fileData){
          convertedFile = this.attachmentService.base64ToFile(fileData.data,fileDetails.name)
        }else{
          reject()
          return
        }
        var options = {
          headers: {
            "Content-Type": fileDetails.type
          }
        }
        // firstValueFrom(this.customHttp.put(fileDetails.uploadUrl, convertedFile, options)).then(data=>{
        //   resolve(data)
        // }).catch(err=>reject(err))
        let formData = new FormData();
        formData.append('file', convertedFile)
        formData.append('url', fileDetails.uploadUrl)
        let payload = {
          url: fileDetails.uploadUrl,
          file: convertedFile
        }
        const baseUrl = this.dataService.getConfig().baseUrl;
        const uploadUrl = new URL(baseUrl).origin + apiUrls.CLOUD_UPLOAD;
        const headers = new HttpHeaders();
        firstValueFrom(this.customHttp.put(uploadUrl, formData, {headers})).then(data=>{
          resolve(data)
        }).catch(err=>reject(err))
      })

    })
  }

  createImageUrlPayload(project:any) {
    const payload:any = { request: {} };
    const completeImgObj = this.getAttachmentsOfProject(project);
    const payloadImages = [];
    for (const image of completeImgObj) {
      payloadImages.push(image.name);
    }
    payload.request[project._id] = {
      files: payloadImages
    }
    return payload
  }
}

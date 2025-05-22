import { Injectable } from '@angular/core';
import { UtilsService } from '../utils/utils.service';
import { ToastService } from '../toast/toast.service';
import { apiUrls } from '../../constants/urlConstants';
import { statusType } from '../../constants/statusConstants';
import { ApiService } from '../api/api.service';
import { firstValueFrom } from 'rxjs';
import { RoutingService } from '../routing/routing.service';
import { DataService } from '../data/data.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(private utils: UtilsService, private toastService: ToastService, private apiService: ApiService, private routerService: RoutingService,
    private dataService: DataService
  ) { }

async showSyncSharePopup(type:string, name:string, project:any, taskId?:string){
    let popupDetails= {
      title: "SHAREABLE_FILE",
      actionButtons: [
        { label: "DONT_SYNC", action: false},
        { label: "SYNC_AND_SHARE", action: true }
      ]
    }
    if(project.status != statusType.submitted){
      let response = await this.utils.showDialogPopup(popupDetails)
      if(response){
        if(project.isEdit){
          this.routerService.navigate('/project-details',{type: "sync", projectId: project._id, taskId: taskId, isShare: true, fileName: name})
        }else{
          taskId ? this.getPdfUrl(name, project._id, taskId) : this.getPdfUrl(name, project._id)
        }
      }else{
        this.toastService.showToast("FILE_NOT_SHARED","danger")
      }
    }else{
      taskId ? this.getPdfUrl(name, project._id, taskId) : this.getPdfUrl(name, project._id)
    }
  }

    getPdfUrl(name:string, projectId:string, taskId?:string,loader?:any){
    let url = taskId ? `${apiUrls.SHARE}/${projectId}?tasks=${taskId}` : `${apiUrls.SHARE}/${projectId}`
    const config = {
      url: url
    }
    let showLoader = loader ? false : true ;
    if(showLoader){
      this.utils.startLoader()
    }
    return firstValueFrom(this.apiService.get(config))
        .then(response => {
      this.utils.stopLoader()
      let shareResponse:any = response.result.downloadUrl || response.result?.data?.downloadUrl
      if(response.result && shareResponse){
          this.sendMessage(shareResponse,name);
      }else{
        this.toastService.showToast("ERROR_IN_DOWNLOADING_MSG","danger")
      }
    }).catch(error=>{
      this.utils.stopLoader()
      this.toastService.showToast("ERROR_IN_DOWNLOADING_MSG","danger")
    })
  }

  sendMessage(data:any,name:any) {
    const message = { type: 'SHARE_LINK', url: data ,name:name};
    window.postMessage(message, '*');
  }

  async startAssessment(projectData:any, taskData:any){
    let profileInfo = this.dataService.getConfig().profileInfo
    let apiConfig = {
      url: `${apiUrls.START_ASSESSMENT}${projectData._id}?taskId=${taskData._id}`,
      payload: profileInfo
    }
    console.log("start assssment ap cal: ",apiConfig)
    try{
      const response = await firstValueFrom(this.apiService.post(apiConfig))
      const result = response?.result
      console.log("get assessment api: ",result)
      localStorage.setItem("responseOne",JSON.stringify(result))
      if(!result){
        this.toastService.showToast("CANNOT_GET_PROJECT_DETAILS","danger")
        return
      }
      if(result.observationId){
        console.log("Redirecting to observation submission page: ",result)
        let enableObserveAgain = result?.status == statusType.completed
        let solutionDetails = result?.solutionDetails
        let path = `/managed-observation-portal/details/${solutionDetails?.name}/${result?.observationId}/${result?.entityId}/${solutionDetails?.allowMultipleAssessemts}`
        this.routerService.navigateByHref(path)
        return
      }

      let redirectionPath = `/managed-observation-portal/task/${result?.solutionId}`
      this.routerService.navigateByHref(redirectionPath)
      return
      
      let templateDetailsApiConfig = {
        url: `${apiUrls.GET_TEMPLATE_DETAILS}${result?.solutionDetails?._id}`,
        payload: profileInfo
      }

      const templateDetailsResponse = await firstValueFrom(this.apiService.post(templateDetailsApiConfig))
      const templateDetailsResult = templateDetailsResponse.result
      localStorage.setItem("responseTwo",JSON.stringify(templateDetailsResult))
      console.log("Get template api call response: ",templateDetailsResult)

      const hasMultipleEvidences = templateDetailsResult.assessment.evidences.length > 1;
      const hasMultipleSections = templateDetailsResult.assessment.evidences[0].sections.length > 1;
      const hasCriteriaReport = templateDetailsResult.solution.criteriaLevelReport && templateDetailsResult.solution.isRubricDriven;

      if(hasMultipleEvidences || hasMultipleSections || hasCriteriaReport){
        console.log("Redirecting to domain ECM listing")
        let path = `/managed-observation-portal/domain/${templateDetailsResult?.observationId}/${templateDetailsResult?.entityId}/${templateDetailsResult?._id}`
        this.routerService.navigateByHref(path)
      }else{
        console.log("Redirecting to QUESTIONIARE page")
        let path = `/managed-observation-portal/questionnaire?observationId=${templateDetailsResult?.observationId ?? ""}&entityId=
        ${templateDetailsResult?.entityId ?? ""}&submissionNumber=${templateDetailsResult?.submissionNumber ?? ""}&evidenceCode=
        ${templateDetailsResult?.assessment?.evidences[0]?.code ?? ""}&index=0&submissionId=${templateDetailsResult?.submissionId ?? ""}`
        this.routerService.navigateByHref(path)
      }

    }catch (error) {
      console.log("Error block: ",error)
      this.toastService.showToast("CANNOT_GET_PROJECT_DETAILS","danger")
    }
  }
}

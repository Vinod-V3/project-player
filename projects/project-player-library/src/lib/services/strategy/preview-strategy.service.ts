import { Injectable } from '@angular/core';
import { UtilsService } from '../utils/utils.service';
import { apiUrls } from '../../constants/urlConstants';
import { ApiService } from '../api/api.service';
import { DataService } from '../data/data.service';
import { DbService } from '../db/db.service';
import { RoutingService } from '../routing/routing.service';
import { ToastService } from '../toast/toast.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export abstract class GenericFunctions {
  constructor(private utils: UtilsService, private apiService: ApiService, private db: DbService, private routerService: RoutingService,
    private dataService: DataService, private toastService: ToastService, private translate: TranslateService
  ){}
  async showShareDataPopup() {
    return await this.utils.showPopupWithCheckbox("projectShare")
  }

  async showDialog(dialogData:any){
    return await this.utils.showDialogPopup(dialogData)
  }

  async apiCallAndNavigate(config:any, projectDetails:any){
    if(projectDetails.isPreview){
      this.routerService.navigate("/project-details",{ type: "details", id: projectDetails._id, projectId: projectDetails._id },{ replaceUrl: true })
      return
    }
    this.apiService.post(config).subscribe((res)=>{
      if(res.result){
        if(projectDetails.referenceFrom == "link"){
          let tab = projectDetails.isATargetedSolution ? "ASSIGNED_TO_ME_TAB" : "DISCOVERED_BY_ME_TAB"
          this.translate.get(["PROJECT_AVAILABLE_UNDER_TAB_MSG",tab]).subscribe(data => {
            this.toastService.showToast(`${data["PROJECT_AVAILABLE_UNDER_TAB_MSG"]} ${data[tab]}`,"success")
          })
        }
        res.result.hasAcceptedTAndC = projectDetails.hasAcceptedTAndC
        let data = {
          key: res.result._id,
          data: res.result
        }
        this.db.addData(data)
        this.routerService.navigate("/project-details",{ type: "details", id: res.result._id, projectId: res.result._id },{ replaceUrl: true })
      }
    })
  }

  getConfigData(key:string){
    let config = this.dataService.getConfig()
    return config[key]
  }

  abstract start(data: any): void
}

@Injectable({
  providedIn: 'root',
})
export class LibraryProjectFlow extends GenericFunctions {
  async start(projectData:any){
    const response = await this.showShareDataPopup()
    if(!response) return
    projectData.hasAcceptedTAndC = response.buttonAction
    let apiConfig = {
      url: `${apiUrls.IMPORT_LIBRARY}${projectData._id}`,
      payload: { hasAcceptedTAndC: projectData.hasAcceptedTAndC || false, referenceFrom: "fromLibrary" }
    }
    this.apiCallAndNavigate(apiConfig, projectData)
  }
}

@Injectable({
  providedIn: 'root',
})
export class NonTargettedProjectFlow extends GenericFunctions {
  async start(projectData:any){
    let apiConfig = {
      url: `${apiUrls.GET_PROJECT_DETAILS}?solutionId=${projectData.solutionId}`,
      payload: { ...this.getConfigData("profileInfo"), type: "improvementProject", referenceFrom: "link", link: projectData.link }
    }

    const response = await this.showShareDataPopup()
    if(!response) return
    projectData.hasAcceptedTAndC = response.buttonAction
    this.apiCallAndNavigate(apiConfig, projectData)
  }
}

@Injectable({
  providedIn: 'root',
})
export class TargettedProjectFlow extends GenericFunctions {
  async start(projectData:any){
    let apiConfig = {
      url: `${apiUrls.GET_PROJECT_DETAILS}?solutionId=${projectData.solutionId}&templateId=${projectData.externalId}`,
      payload: { ...this.getConfigData("profileInfo"), type: "improvementProject" }
    }

    // if(projectData.certificateTemplateId){
    //   let dialogData= {
    //     content :"CERTIFICATE_NAME_CONFIRMATION_MSG",
    //     actionButtons: [
    //       { label: "CONFIRM", action: "confirm" },
    //       { label: "EDIT", action: "edit" }
    //     ]
    //   }
    //   const response = await this.showDialog(dialogData)
    //   if(!response) return
    //   switch (response) {
    //     case "confirm":
    //       this.apiCallAndNavigate(apiConfig, projectData)
    //       break;
    //     case "edit":
    //       window.location.href = this.getConfigData("redirectionLinks").profilePage
    //       break;
    //     default:
    //       break;
    //   }
    // }else{
      this.apiCallAndNavigate(apiConfig, projectData)
    // }
  }
}

@Injectable({
  providedIn: 'root',
})
export class PreviewStrategyFactory {
  constructor(
    private nonTargetted: NonTargettedProjectFlow,
    private targetted: TargettedProjectFlow,
    private library: LibraryProjectFlow,
  ) {}

  getStrategy(flowType: string) {
    switch (flowType) {
      case 'nonTargetted':
        return this.nonTargetted;
      case 'library':
        return this.library;
      case 'targetted':
        return this.targetted;
      default:
        throw new Error('Unknown flow type');
    }
  }
}

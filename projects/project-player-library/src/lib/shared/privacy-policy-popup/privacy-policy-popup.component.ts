import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DataService } from '../../services/data/data.service';

@Component({
  selector: 'lib-privacy-policy-popup',
  templateUrl: './privacy-policy-popup.component.html',
  styleUrl: './privacy-policy-popup.component.css'
})
export class PrivacyPolicyPopupComponent {
  isChecked:boolean = false
  popupData:any
  contentPolicyLink: any

  constructor(public popupRef: MatDialogRef<PrivacyPolicyPopupComponent>, @Inject(MAT_DIALOG_DATA)public data: any, private dataService: DataService){
    this.popupData = data
    this.contentPolicyLink = this.dataService.getConfig().redirectionLinks?.contentPolicyLink
  }

  closePopup(data:any){
    let returnData = {
      isChecked: this.isChecked,
      buttonAction: data
    }
    this.popupRef.close(returnData)
  }

}

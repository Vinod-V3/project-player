import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataService } from '../../services/data/data.service';
import { UtilsService } from '../../services/utils/utils.service';

@Component({
  selector: 'lib-certificate-confirmation-popup',
  templateUrl: './certificate-confirmation-popup.component.html',
  styleUrl: './certificate-confirmation-popup.component.css'
})
export class CertificateConfirmationPopupComponent {
  isChecked = false

  constructor(public dialogRef: MatDialogRef<CertificateConfirmationPopupComponent>,@Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,private utils:UtilsService){}

  closePopup(data:any){
    this.dialogRef.close(data)
  }

  onCheckboxChange($event:any){
    this.isChecked = $event.checked
  }

  async editProfile(){
    const options = {
      type:"redirect",
      pathType:"profile"
    };
    let response = await this.utils.postMessageListener(options)
    if(!response){
      window.location.href = this.dataService.getConfig()?.redirectionLinks?.profilePage || "/"
    }
  }

  start(){
    let key = localStorage.getItem("userId")
    if(this.isChecked && key){
      localStorage.setItem(key,"true")
    }
    this.dialogRef.close(true)
  }
}

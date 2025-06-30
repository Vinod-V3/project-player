import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataService } from '../../services/data/data.service';

@Component({
  selector: 'lib-certificate-confirmation-popup',
  templateUrl: './certificate-confirmation-popup.component.html',
  styleUrl: './certificate-confirmation-popup.component.css'
})
export class CertificateConfirmationPopupComponent {
  isChecked = false

  constructor(public dialogRef: MatDialogRef<CertificateConfirmationPopupComponent>,@Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService){}

  closePopup(data:any){
    this.dialogRef.close(data)
  }

  onCheckboxChange($event:any){
    this.isChecked = $event.checked
  }

  async editProfile(){
      window.location.href = this.dataService.getConfig()?.redirectionLinks?.profilePage || "/"
  }

  start(){
    let key = localStorage.getItem("userId")
    if(this.isChecked && key){
      localStorage.setItem(key,"true")
    }
    this.dialogRef.close(true)
  }
}

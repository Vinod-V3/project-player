import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'lib-dialog-input',
  templateUrl: './dialog-input.component.html',
  styleUrl: './dialog-input.component.css'
})
export class DialogInputComponent {
  data: any;
  constructor(@Inject(MAT_DIALOG_DATA) public dialogData: any) {
   }
}

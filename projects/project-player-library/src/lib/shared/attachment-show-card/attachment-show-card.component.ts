import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DbService } from '../../services/db/db.service';
import { UtilsService } from '../../services/utils/utils.service';
import { statusType } from '../../constants/statusConstants';
import { MatDialog } from '@angular/material/dialog';
import { AttachmentPreviewComponent } from '../attachment-preview/attachment-preview.component';

@Component({
  selector: 'lib-attachment-show-card',
  templateUrl: './attachment-show-card.component.html',
  styleUrl: './attachment-show-card.component.css',
})
export class AttachmentShowCardComponent {
  @Input() attachments: any;
  @Input() projectDataStatus:any;
  attachment: any;
  @Output() emitAttachment = new EventEmitter<any>();
  statusType = statusType;

  constructor(private db: DbService,private utilService:UtilsService, private dialog: MatDialog) {}

  ngOnInit(): void {
  }

  async getPreviewUrl(file:any) {
    let url = ''
    await this.db.getData(file.name).then((data) => {
      if(data){
        url = data.data
      }else{
        url = file.url
      }
    })
    return url
  }

  actionEmit(data: any) {
    this.emitAttachment.emit(data);
  }

  async openAttachment(data: any) {
    if(data.type.includes('image')){
      let url = await this.getPreviewUrl(data)
      let previewData = {type: "image", url: url}
      this.dialog.open(AttachmentPreviewComponent,{width:'400px', data: previewData})
    }else if(data.type.includes('video')){
      let url = await this.getPreviewUrl(data)
      let previewData = {type: "video", url: url}
      this.dialog.open(AttachmentPreviewComponent,{width:'400px', data: previewData})
    }else if(data.type.includes('application')){
      let url = await this.getPreviewUrl(data)
      let previewData = {type: "file", url: url}
      const options = {
        type: "preview",
        title: data.name,
        fileType: "pdf",
        isBase64: url.startsWith('data:') ? true : false,
        url: url
      }
      let response = await this.utilService.postMessageListener(options)
      if(!response){
        this.utilService.viewFile(previewData.url)
      }
    }else{
      let url = data.name;
      if (!/^https?:\/\//i.test(url)) {
          url = 'http://' + url;
      }
      window.open(url, '_blank');
    }
  }
}

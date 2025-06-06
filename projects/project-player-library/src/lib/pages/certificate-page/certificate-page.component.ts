import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { RoutingService } from '../../services/routing/routing.service';
import { apiUrls } from '../../constants/urlConstants';
import { ApiService } from '../../services/api/api.service';
import { BackNavigationHandlerComponent } from '../../shared/back-navigation-handler/back-navigation-handler.component';
import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../../services/toast/toast.service';
import { Canvg } from 'canvg';
import { DataService } from '../../services/data/data.service';
@Component({
  selector: 'lib-certificate-page',
  templateUrl: './certificate-page.component.html',
  styleUrls: ['./certificate-page.component.css'],
})
export class CertificatePageComponent extends BackNavigationHandlerComponent {
  projectId: any;
  projectDetails: any;
  certificateUrl:any;
  acceptType = 'image/svg+xml'
  message = "CERTIFICATE_ERROR_MSG"

  @ViewChild('certificateContainer', { static: true }) certificateContainer:
    | ElementRef
    | undefined;
  private customHttp: HttpClient;

  constructor(
    private router: Router,
    private routingService: RoutingService,
    private renderer: Renderer2,
    private apiService: ApiService,
    private toasterService: ToastService,
    private httpBackend: HttpBackend,
    private dataService: DataService
  ) {
    super(routingService);
    const url: UrlTree = this.router.parseUrl(this.router.url);
    this.projectId = url.queryParams['projectId'];
    this.customHttp = new HttpClient(httpBackend);
  }

  ngOnInit() {
    this.getProjectDetails();
  }

  getProjectDetails() {
    const configForProject = {
      url: `${apiUrls.GET_PROJECT_DETAILS}/${this.projectId}`,
      payload: {},
    };

    this.apiService.post(configForProject).subscribe((res) => {
      this.projectDetails = res.result;
      if (this.projectDetails.certificate) {
          if (this.projectDetails?.certificate?.eligible) {
            if(this.projectDetails?.certificate?.osid){
              this.loadCertificateSvg();
            }else{
              this.message = "CERTIFICATE_GENERATING_WAIT_MSG"
            }
          }
      }
    });
  }

  async downloadSvgToPng() {
    if (!this.certificateContainer) {
      return;
    }

    const svgElement =
      this.certificateContainer.nativeElement.querySelector('svg');
    if (!svgElement) {
      console.error('SVG element not found');
      return;
    }

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get 2D rendering context');
      return;
    }
    const dpi = 300;
    const scaleFactor = dpi / 96;
    const width = svgElement.getBoundingClientRect().width * scaleFactor;
    const height = svgElement.getBoundingClientRect().height * scaleFactor;
    canvas.width = width;
    canvas.height = height;
    const v = Canvg.fromString(ctx, svgString);
    ctx.scale(scaleFactor, scaleFactor);
    await v.render();
    this.downloadPng(canvas);
  }

  downloadPdf() {
    fetch(this.projectDetails.certificate.pdfUrl)
      .then((resp) => resp.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.projectDetails.title}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toasterService.showToast('CERTIFICATE_DOWNLOAD_SUCCESS', 'success');
      })
      .catch((error) => {
        this.toasterService.showToast('CERTIFICATE_DOWNLOAD_FAILED', 'error');
      });
  }

  async downloadPng(canvas: HTMLCanvasElement) {
        await canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `${this.projectDetails.title}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
        this.toasterService.showToast('CERTIFICATE_DOWNLOAD_SUCCESS', 'success');
  }


  loadCertificateSvg() {
    const config = {
      url: apiUrls.CERTIFICATE_URL + this.projectDetails.certificate.osid,
    };
    const headers = new HttpHeaders({
      template: this.projectDetails.certificate.templateUrl,
      accept: this.acceptType,
    });

    (this.apiService as any).http.get(`${this.dataService.getConfig().baseUrl}/${config.url}`, { headers, responseType: 'text' as 'json' }).subscribe({
    next: (res: any) => {
      console.log("NExt block: ",res)
      let template = res;
      if (template.startsWith('data:image/svg+xml,')) {
        template = decodeURIComponent(template.replace(/data:image\/svg\+xml,/, '')).replace(/\<!--\s*[a-zA-Z0-9\-]*\s*--\>/g, '');
      }

      this.certificateUrl = template;

      if (this.certificateContainer) {
        this.renderer.setProperty(
          this.certificateContainer.nativeElement,
          'innerHTML',
          this.certificateUrl
        );

        const svgElement = this.certificateContainer.nativeElement.querySelector('svg');
        if (svgElement) {
          this.renderer.setStyle(svgElement, 'object-fit', 'contain');
          this.renderer.setStyle(svgElement, 'width', '100%');
        }
      }
    },
    error: (error: any) => {
      console.log("Error block: ",error)
      this.toasterService.showToast('CERTIFICATE_FETCH_FAILED', 'error');
    }
    });
  }

}

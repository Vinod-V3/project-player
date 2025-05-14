import { NgModule, LOCALE_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProjectPlayerLibraryComponent } from './project-player-library.component';
import { MainPlayerComponent } from './pages/main-player/main-player.component';
import { DetailsPageComponent } from './pages/details-page/details-page.component';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TaskCardComponent } from './shared/task-card/task-card.component';
import { DailogPopupComponent } from './shared/dialog-popup/dailog-popup.component';
import { AttachmentListingPageComponent } from './pages/attachment-listing-page/attachment-listing-page.component';
import { TaskDetailsPageComponent } from './pages/task-details-page/task-details-page.component';
import { IconListComponent } from './shared/icon-list/icon-list.component';
import { ProjectDetailsComponent } from './pages/project-details/project-details.component';
import { SubtaskCardComponent } from './shared/subtask-card/subtask-card.component';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { EditTaskCardComponent } from './shared/edit-task-card/edit-task-card.component';
import { AttachmentCardComponent } from './shared/attachment-card/attachment-card.component';
import { AttachmentShowCardComponent } from './shared/attachment-show-card/attachment-show-card.component';
import { AddTaskPageComponent } from './pages/add-task-page/add-task-page.component';
import { PrivacyPolicyPopupComponent } from './shared/privacy-policy-popup/privacy-policy-popup.component';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { PreviewDetailsPageComponent } from './pages/preview-details-page/preview-details-page.component';
import {MatExpansionModule} from '@angular/material/expansion';
import { AddFilesPageComponent } from './pages/add-files-page/add-files-page.component';
import { AddLinkPopupComponent } from './shared/add-link-popup/add-link-popup.component'
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';
import { FilesCardComponent } from './shared/files-card/files-card.component';
import { LearningResourcesComponent } from './pages/learning-resources/learning-resources.component';
import { SyncPageComponent } from './pages/sync-page/sync-page.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { LoaderComponent } from './shared/loader/loader.component';
import { StartImprovementPopupComponent } from './shared/start-improvement-popup/start-improvement-popup.component';
import { AttachmentPreviewComponent } from './shared/attachment-preview/attachment-preview.component';
import { DateValidatorDirective } from './directives/date-validator.directive';
import { DateInputComponent } from './shared/date-input/date-input.component';
import { BackNavigationHandlerComponent } from './shared/back-navigation-handler/back-navigation-handler.component';
import { HeaderComponent } from './shared/header/header.component';
import { CertificatePageComponent } from './pages/certificate-page/certificate-page.component';
import { MatRadioModule } from '@angular/material/radio';
import { ApiInterceptor } from './services/api-interceptor/api-interceptor.interceptor';
import { ProjectCreateComponent } from './pages/project-create/project-create.component';
import { DialogInputComponent } from './shared/dialog-input/dialog-input.component';
import { ProjectOperationComponent } from './pages/project-operation/project-operation.component';
import { SelectDialogComponent } from './shared/select-dialog/select-dialog.component';
import { ProjectEditDetailsComponent } from './pages/project-edit-details/project-edit-details.component';

const routes: Routes = [
  // { path: '' },
  // { path: 'details/:id', component: DetailsPageComponent },
  // { path: 'files/:id', component: AttachmentListingPageComponent },
  // { path: 'task-details/:taskId/:id', component: TaskDetailsPageComponent },
  // { path: 'add-task/:id', component: AddTaskPageComponent },
  // { path: 'preview-details/:id', component: PreviewDetailsPageComponent},
  // { path: 'add-files/:id', component: AddFilesPageComponent },
  // { path: 'learning-resource/:taskId/:id/:fromDetailspage', component: LearningResourcesComponent},
  // { path: 'sync', component: SyncPageComponent }
  // { path : 'certificate', component: CertificatePageComponent }
  { path: 'project-details', component: MainPlayerComponent },
  { path: '**', redirectTo: 'project-details' }
];

const MAT_CUSTOM_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMM YYYY',
    weekDayA11yLabel: 'ddd',
  },
};

export function translateHttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient);
}

@NgModule({
  declarations: [
    ProjectPlayerLibraryComponent,
    MainPlayerComponent,
    TaskCardComponent,
    IconListComponent,
    TaskDetailsPageComponent,
    ProjectDetailsComponent,
    AttachmentListingPageComponent,
    AttachmentCardComponent,
    AttachmentShowCardComponent,
    SubtaskCardComponent,
    EditTaskCardComponent,
    DailogPopupComponent,
    AddTaskPageComponent,
    PreviewDetailsPageComponent,
    PrivacyPolicyPopupComponent,
    AddFilesPageComponent,
    AddLinkPopupComponent,
    FilesCardComponent,
    DetailsPageComponent,
    LearningResourcesComponent,
    SyncPageComponent,
    LoaderComponent,
    StartImprovementPopupComponent,
    AttachmentPreviewComponent,
    DateValidatorDirective,
    DateInputComponent,
    CertificatePageComponent,
    BackNavigationHandlerComponent,
    HeaderComponent,
    ProjectCreateComponent,
    DialogInputComponent,
    ProjectOperationComponent,
    SelectDialogComponent,
    ProjectEditDetailsComponent,
  ],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatTabsModule,
    MatMenuModule,
    MatDialogModule,
    MatSelectModule,
    MatSnackBarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: translateHttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    MatSnackBarModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatChipsModule,
    MatListModule,
  ],
  exports: [RouterModule],
  providers: [
    {
      provide: MAT_DATE_FORMATS,
      useValue: MAT_CUSTOM_DATE_FORMATS,
    },
    {
      provide: LOCALE_ID,
      useValue: 'en-in',
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true
    },
    provideNativeDateAdapter()
  ]
})
export class ProjectPlayerLibraryModule {
  constructor(private translate: TranslateService) {
    this.setLanguage();
  }

  setLanguage() {
    this.translate.setTranslation('en', require('./assets/i18n/en.json'));
    this.translate.setDefaultLang('en');
  }
}

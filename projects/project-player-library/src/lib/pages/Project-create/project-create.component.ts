import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogInputComponent } from '../../shared/dialog-input/dialog-input.component';
import { UtilsService } from '../../services/utils/utils.service';
import { DbService } from '../../services/db/db.service';
import { DataService } from '../../services/data/data.service';
import { CATEGORIES } from '../../constants/dataConstants';
import { ToastService } from '../../services/toast/toast.service';
import { RoutingService } from '../../services/routing/routing.service';
import { BackNavigationHandlerComponent } from '../../shared/back-navigation-handler/back-navigation-handler.component';
import { Location } from '@angular/common';

@Component({
  selector: 'lib-create-project',
  templateUrl: './project-create.component.html',
  styleUrls: ['./project-create.component.css']
})
export class ProjectCreateComponent extends BackNavigationHandlerComponent implements OnInit {
  formType: any;
  myForm!: FormGroup;
  hasAcceptedTAndC: any;
  projectId: any;
  projectDetails: any;

  options: any = CATEGORIES;
  selectedChips: Set<any> = new Set();
  showSelectAll = false;
  showAddOption = true;
  enableSelectAll = false;
  touched = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private utils: UtilsService,
    private db: DbService,
    private dataService: DataService,
    private toastService: ToastService,
    private routingService:RoutingService,
    private location:Location
  ) {
    super(routingService)
  }

  async ngOnInit() {
    const urlTree = this.router.parseUrl(this.router.url);
    this.formType = urlTree.queryParams['option'];
    this.projectId = urlTree.queryParams['projectId'];
    this.hasAcceptedTAndC = urlTree.queryParams['hasAcceptedTAndC'] === 'true';
    await this.initializeForm();
  }

    // Loads existing project details if editing, otherwise sets default empty structure
  async initializeForm() {
    if (this.formType === 'edit') {
      const data: any = await this.db.getData(this.projectId);
      this.projectDetails = data?.data || { tasks: [] };
    } else {
      this.projectDetails = { tasks: [] };
    }
    this.buildForm(this.projectDetails);
  }

  // Constructs reactive form and initializes form fields (title, description, categories, tasks)
  // Also syncs form categories with selectedChips for chip-based UI
  buildForm(data: any = {}) {
    this.myForm = this.fb.group({
      title: [data.title || '', [Validators.required, Validators.maxLength(100)]],
      description: [data.description || '', [Validators.required, Validators.maxLength(500)]],
      categories: [data.categories || [], Validators.required],
      tasks: [data.tasks || []]
    });

    this.selectedChips.clear();

    (this.options || []).forEach((chip: any) => {
      const match = (data.categories || []).find(
        (cat: any) => cat.label && chip.label && cat.label === chip.label
      );
      if (match) {
        this.selectedChips.add(chip);
      }
    });

    // Set form value from selected chips
    this.myForm.get('categories')?.setValue(Array.from(this.selectedChips));
  }

  // Toggles chip selection and updates the form's categories field
  onChipClick(chip: any): void {
    this.markAsTouched();
    if (this.selectedChips.has(chip)) {
      this.selectedChips.delete(chip);
    } else {
      this.selectedChips.add(chip);
    }
    const selectedValues = Array.from(this.selectedChips);
    this.myForm.get('categories')?.setValue(selectedValues);
  }

  // Returns true if category selection is touched and invalid (for validation display)
  shouldShowCategoryError(): boolean {
    const control = this.myForm.get('categories');
    return !!control?.touched && !!control?.invalid;
  }

  // Marks the categories field as touched to trigger validation messages
  markAsTouched(): void {
    if (!this.touched) {
      this.myForm.get('categories')?.markAsTouched();
      this.touched = true;
    }
  }

  // Opens dialog to add a new category option, adds it to the chip list and selects it
  addOption(): void {
    const dialogRef = this.dialog.open(DialogInputComponent, {
      data: {
        header: 'ADD_NEW',
        label: 'ENTER_VALUE',
        showCancel: true,
        required: true,
        buttonText: { ok: 'ADD', cancel: 'CANCEL' }
      },
      width: '450px'
    });

    dialogRef.afterClosed().subscribe((data: string) => {
      if (data && data.trim()) {
        const newOption = {
          label: data,
          labelTranslations: `{\"en\":\"${data}\"}`,
          name: data
        };
        this.options.push(newOption);
        this.onChipClick(newOption);
      }
    });
  }

  // Opens dialog to add a new task, appends it to the task list in the form
  addTask(): void {
    const dialogRef = this.dialog.open(DialogInputComponent, {
      data: {
        header: 'ADD_TASK',
        label: 'ENTER_TASK_DESC',
        required: true,
        showCancel: true,
        buttonText: { ok: 'ADD' }
      },
      width: '450px'
    });

    dialogRef.afterClosed().subscribe((task: string) => {
      if (task && task.trim()) {
        const meta = this.utils.getMetaData();
        const { name, ...metaWithoutName } = meta;
        const taskObject = { name: task.trim(), ...metaWithoutName };
        const currentTasks = this.myForm.get('tasks')?.value || [];
        const updatedTasks = [...currentTasks, taskObject];
        this.myForm.get('tasks')?.setValue(updatedTasks);
        this.toastService.showToast('NEW_TASK_ADDED_SUCCESSFULLY_MSG', 'success');
      }
    });
  }

   // Opens confirmation dialog to delete a task, removes it from the form if confirmed
  confirmDeleteTask(index: number): void {
    const dialogRef = this.dialog.open(DialogInputComponent, {
      data: {
        header: 'DELETE_TASK',
        label: 'CONFIRMATION_DELETE',
        required: false,
        showCancel: false,
        buttonText: { ok: 'YES', cancel: 'NO' }
      },
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed === true) {
        const tasks = [...this.myForm.get('tasks')?.value];
        tasks.splice(index, 1);
        this.myForm.get('tasks')?.setValue([...tasks]);
      }
    });
  }

  // Validates and submits the form. Depending on create/edit mode:
  // - Stores data locally
  // - Navigates to project details view with appropriate params
  async onSubmit(): Promise<void> {
    if (this.myForm.valid) {
      const confirmed = await this.createProject();
      if (confirmed) {
        if (this.formType === 'create') {
          const projectDetails = {
            ...this.myForm.value,
            hasAcceptedTAndC: this.hasAcceptedTAndC
          };
          const data = {
            key: this.myForm.get('title')?.value,
            data: projectDetails
          };
          this.db.addData(data);
          this.router.navigate(['project-details'], {
            queryParams: {
              type: 'projectOperation',
              option: 'create',
              key: this.myForm.get('title')?.value
            },
            replaceUrl:true
          });
        } else {
          this.projectDetails = {
            ...this.projectDetails,
            title: this.myForm.get('title')?.value,
            description: this.myForm.get('description')?.value,
            categories: this.myForm.get('categories')?.value,
            tasks: this.myForm.get('tasks')?.value,
            isEdit:true
          };
          const data = {
            key: this.projectDetails._id,
            data: this.projectDetails
          };
          this.db.updateData(data);
          this.location.back();
        }
      } else {
        return;
      }
    } else {
      this.myForm.markAllAsTouched();
    }
  }

  // Opens confirmation dialog showing successful project creation; returns user's choice.
  createProject(): Promise<boolean> {
    const dialogRef = this.dialog.open(DialogInputComponent, {
      data: {
        header: this.formType === 'create' ?  'PROJECT_CREATE' : 'PROJECT_UPDATE',
        label: this.formType === 'create' ? 'PROJECT_CREATED_SUCCESSFULLY_MSG':'PROJECT_UPDATE_MSG',
        required: false,
        showCancel: false,
        buttonText: { ok: 'CONTINUE', cancel: 'EDIT' }
      },
      width: '400px'
    });

    return dialogRef.afterClosed().toPromise();
  }
}
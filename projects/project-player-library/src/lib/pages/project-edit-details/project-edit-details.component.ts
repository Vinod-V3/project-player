import { Component } from '@angular/core';
import { BackNavigationHandlerComponent } from '../../shared/back-navigation-handler/back-navigation-handler.component';
import { RoutingService } from '../../services/routing/routing.service';
import { Router } from '@angular/router';
import { DbService } from '../../services/db/db.service';

@Component({
  selector: 'lib-project-edit-details',
  templateUrl: './project-edit-details.component.html',
  styleUrl: './project-edit-details.component.css'
})
export class ProjectEditDetailsComponent extends BackNavigationHandlerComponent {

  projectDetails:any;
  categories:any;

  constructor(private routingService:RoutingService,private router: Router,private db:DbService) {
    super(routingService)
  }
  ngOnInit() {
    const urlTree = this.router.parseUrl(this.router.url);
    const projectId = urlTree.queryParams['projectId'];
    this.db.getData(projectId).then((data:any) => {
      if (data) {
        this.projectDetails = data.data;
        this.categoryNames();
      }
    })
  }

  categoryNames() {
    this.categories = this.projectDetails.categories
      ?.map((item: any) => item.name || item.label)
      .filter(Boolean)
      .join(', ');
  }

  editProject(){
    this.router.navigate(['project-details'],{ queryParams: {type: "projectCreate" ,option:"edit",projectId: this.projectDetails._id} });
  }

  editProjectOperations(){
    this.router.navigate(['project-details'],{ queryParams: {type: "projectOperation" ,option:"edit",key: this.projectDetails._id} });
  }


}

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogInputComponent } from '../dialog-input/dialog-input.component';
import { apiUrls } from '../../constants/urlConstants';
import { ApiService } from '../../services/api/api.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { learningResourcePayloadRequest } from '../../constants/dataConstants';

@Component({
  selector: 'lib-select-dialog',
  templateUrl: './select-dialog.component.html',
  styleUrls: ['./select-dialog.component.css']
})
export class SelectDialogComponent implements OnInit {
  searchTextChanged: Subject<string> = new Subject<string>();
  listData: any = [];
  filters: { name: string; value: string }[] = [];

  searchText = '';
  selectedValue: any[] | any = [];
  selectedFilter: { name: string; value: any }[] = [];
  isMultiSelect = false;
  type: string = '';
  isAPrivateProgram = true;
  page = 1;
  resourcePage = 0;
  limit = 10;
  resourceLimit = 25;
  count = 0;
  defaultFilter: { name: string; value: string } | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private dialogRef: MatDialogRef<SelectDialogComponent>,
    private dialog: MatDialog,
    private apiService: ApiService
  ) {}

  // Initialize component state and values from injected dialogData
  // - Sets filters
  // - Determines selection mode (single/multi)
  // - Sets selected values and default filters
  // - Subscribes to search input changes (debounced)
  // - Fetches initial list data
  ngOnInit(): void {
    this.filters = (this.dialogData?.filters || []).map((f: any) =>
      typeof f === 'string' ? { name: f, value: f } : f
    );

    this.isMultiSelect = this.dialogData?.isMultiSelect;
    this.type = this.dialogData?.type;

    const initSelected = this.dialogData?.selectedValue || this.dialogData?.selected;
    if (this.isMultiSelect) {
      this.selectedValue = Array.isArray(initSelected) ? [...initSelected] : initSelected ? [initSelected] : [];
    } else {
      this.selectedValue = initSelected || null;
    }

    const defaultFilterName = this.dialogData?.defaultFilter?.[0]?.name || this.dialogData?.defaultFilter;
    this.defaultFilter = this.filters.find(f => f.name === defaultFilterName) || this.filters[0];

    const selected = this.dialogData?.selectedFilter;
    if (Array.isArray(selected) && selected?.length) {
      this.selectedFilter = selected.map((f: any) =>
        typeof f === 'string' ? this.filters.find(item => item.name === f) : f
      ).filter(Boolean);
    }

    if (!this.selectedFilter?.length && this.defaultFilter) {
      this.selectedFilter = [this.defaultFilter];
    }

    this.searchTextChanged.pipe(debounceTime(1000)).subscribe(() => {
      this.searchByText();
    });

    this.getListData(this.searchText, this.selectedFilter[0]);
  }

  // Switches the active filter category
  // Clears previous search and data
  // Triggers list fetch for the newly selected filter
  toggleFilter(filter: { name: string; value: any }) {
    if (this.isFilterSelected(filter) && this.selectedFilter?.length === 1) return;

    this.selectedFilter = [filter];
    this.page = 1;
    this.resourcePage = 0;
    this.searchText = '';
    this.listData = [];
    this.getListData('', filter);
  }

  // Toggles the selection of an item
  // - In multi-select mode: adds/removes item from selected list
  // - In single-select mode: replaces selected item
  // Updates visual markers for selected items
  toggleSelection(item: any) {
    if (!item) return;
    const key = item.node_id ? 'node_id' : item._id ? '_id' : 'id';

    if (this.isMultiSelect) {
      if (!Array.isArray(this.selectedValue)) this.selectedValue = [];
      const index = this.selectedValue.findIndex((i: any) => i && i[key] === item[key]);
      if (index === -1) {
        this.selectedValue.push(item);
      } else {
        this.selectedValue.splice(index, 1);
      }
    } else {
      this.selectedValue = item;
    }

    // Update UI selection state
    this.updateSelectionMarkers();
  }

  // Checks if a specific item is currently selected
  // Supports both single and multi-select modes
  isItemSelected(item: any): boolean {
    if (!item || !this.selectedValue) return false;
    const key = item.node_id ? 'node_id' : item._id ? '_id' : 'id';

    if (this.isMultiSelect) {
      return Array.isArray(this.selectedValue) &&
        this.selectedValue.some(i => i && i[key] === item[key]);
    } else {
      return !Array.isArray(this.selectedValue) &&
        this.selectedValue &&
        this.selectedValue[key] === item[key];
    }
  }

  // Returns true if the given filter is currently selected
  isFilterSelected(filter: { name: string }): boolean {
    return this.selectedFilter.some(item => item.name === filter.name);
  }

  // Opens a DialogInputComponent to create a new program entry
  // On dialog close, if a name is returned, passes it back to parent
  async createNewProgram() {
    const inputDialogConfig = this.dialogData?.inputDialogConfig;
    try {
      const dialogRef = this.dialog.open(DialogInputComponent, {
        data: inputDialogConfig,
        width: inputDialogConfig?.width || '450px'
      });

      dialogRef.afterClosed().subscribe((name: string) => {
        if (name) {
          this.dialogRef.close({ name, isAPrivateProgram: true });
        }
      });
    } catch (err) {
      console.error('Dialog open error:', err);
    }
  }

  // Confirms the selected value(s) and closes the dialog
  // - Returns an array if multi-select
  // - Returns a single object if single-select
  confirm() {
    const result = this.isMultiSelect
      ? this.selectedValue
      : Array.isArray(this.selectedValue)
        ? this.selectedValue[0]
        : this.selectedValue;

    this.dialogRef.close(result);
  }

  // Closes the dialog without returning any value
  onClose() {
    this.dialogRef.close();
  }

  // Resets pagination and list data
  // Fetches data based on current search text and filter
  searchByText() {
    this.page = 1;
    this.resourcePage = 0;
    this.listData = [];
    this.getListData(this.searchText, this.selectedFilter[0]);
  }

  // Increments page counters
  // Fetches additional list data (pagination)
  loadMore() {
    this.page += 1;
    this.resourcePage += 1;
    this.getListData(this.searchText, this.selectedFilter[0]);
  }


  // Fetches list data based on type (program, entity, learningResource)
  // Applies current filter, pagination, and search
  // Maps and normalizes response data
  // Merges new data with existing list
  // Updates selection markers
  getListData(searchText = '', filter?: { value?: string }) {
    if (this.type === 'program') {
      const config = {
        url: `${apiUrls.PROGRAM}?isAPrivateProgram=${this.isAPrivateProgram}&search=${searchText}`,
        payload: {}
      };

      this.apiService.post(config).subscribe((res) => {
        const result = res.result;
        this.count = result.count;
        const newData = Array.isArray(result) ? result.map((item: any) => ({
          ...item,
          id: item.id || item._id
        })) : [];

        this.mergeListData(newData);
        this.updateSelectionMarkers();
      });
      return;
    }

    if (this.type === 'entity') {
      const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');

      const config = {
        url: `${apiUrls.ENTITIES}/${profileData?.state}?type=${filter?.value || ''}&search=${searchText}&page=${this.page}&limit=${this.limit}`,
        payload: {}
      };

      this.apiService.get(config).subscribe((res) => {
        const result = res.result;
        this.count = result.count;
        const newData = Array.isArray(result.data) ? result.data.map((item: { _id: any; name: any; }) => ({
          ...item,
          id: item.name || item._id // ensure `id` exists
        })) : [];

        this.mergeListData(newData);
        this.updateSelectionMarkers(); // Mark selected items after data load
      });
      return;
    }

    if (this.type === 'learningResource') {
      let payloadrequest = learningResourcePayloadRequest;
      const config = {
        url: `${apiUrls.LEARNING_RESOURCE}`,
        payload: {
          request:{
            ...payloadrequest.fields,
            query:searchText,
            offset:this.resourcePage * this.resourceLimit,
            limit: this.resourceLimit,
            filters:{
              ...payloadrequest.filters,
              mimeType: Array.isArray(filter?.value) ? [...filter.value] : [],
            }
          }
        }
      };

      this.apiService.post(config).subscribe((res) => {
        const result = res.result;
        this.count = result.count;
        const newData = Array.isArray(result.content) ? result.content.map((item: { id: any; name: any; }) => ({
          ...item,
          id: item.name || item.id
        })) : [];

        this.mergeListData(newData);
        this.updateSelectionMarkers();
      });
      return;
    }
  }

  // Merges new data with current list and selected items
  // Deduplicates based on unique keys (_id, id, or node_id)
  mergeListData(newData: any[]) {
    const getKey = (item: any) => item?.node_id || item?._id || item?.id;

    const selectedKeys = new Set(
      (Array.isArray(this.selectedValue) ? this.selectedValue : [this.selectedValue])
        .filter(Boolean)
        .map(getKey)
    );

    const merged = [...this.listData, ...newData];
    const selectItems = new Set();

    const duplicated = merged.filter(item => {
      const key = getKey(item);
      if (!key || selectItems.has(key)) return false;
      selectItems.add(key);
      return true;
    });

    const selectedItems: any[] = [];
    const otherItems: any[] = [];

    for (const item of duplicated) {
      const key = getKey(item);
      if (!key) continue;

      if (selectedKeys.has(key)) {
        selectedItems.push(item);
      } else {
        otherItems.push(item);
      }
    }

    const activeFilter = this.selectedFilter[0];
    const filterMimeTypes = activeFilter?.value;

    const applyFilter = (items: any[]) => {
      if (this.type === 'learningResource' && Array.isArray(filterMimeTypes) && filterMimeTypes.length > 0) {
        return items.filter((item: any) =>
          filterMimeTypes.includes(item.mimeType)
        );
      }
      return items;
    };

    this.listData = [
      ...selectedItems, // always show selected items regardless of filter
      ...applyFilter(otherItems)
    ];
  }

  // Used for Angular's *ngFor trackBy to optimize rendering
  // Returns a unique identifier for each item
  trackByFn(index: number, item: any) {
    if (!item) return index;
    return item.node_id || item._id || item.id || item.name || index;
  }

  // Returns true if there is at least one selected value
  // - Checks for object presence in single-select
  // - Checks array length in multi-select
  get hasSelectedValue(): boolean {
    if (this.isMultiSelect) {
      return Array.isArray(this.selectedValue) && this.selectedValue.length > 0;
    } else {
      return !!this.selectedValue && typeof this.selectedValue === 'object';
    }
  }

  // Clears the search text and triggers a new debounced search
  clearSearch() {
    this.searchText = '';
    this.searchTextChanged.next('');
  }

  // Updates each item in the list to reflect whether it's currently selected
  // Sets a `.selected` property to true/false accordingly
  updateSelectionMarkers() {
    if (!this.listData) return;

    this.listData.forEach((item: any) => {
      if (item) {
        const key = item.node_id ? 'node_id' : item._id ? '_id' : 'id';

        if (this.isMultiSelect) {
          item.selected = Array.isArray(this.selectedValue) &&
          this.selectedValue.some(i => i && i[key] === item[key]);
        } else {
          item.selected = !Array.isArray(this.selectedValue) &&
          this.selectedValue &&
          this.selectedValue[key] === item[key];
        }
      }
    });
  }
}
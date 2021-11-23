import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Cases } from 'src/app/interfaces/cases';

@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss']
})
export class CountryComponent {


  monthlyOrWeekly = false;


  constructor(
    public dialogRef: MatDialogRef<CountryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      type: string;
      country: string;
      confirmed: number;
      death: number;
      recovered: number;
      confirmedWeekly: [];
      deathWeekly: []
      recoveredWeekly: []
      monthly: [];
    },
    private _liveAnnouncer: LiveAnnouncer,
    public dialog: MatDialog
  ) { }

  dataSource = this.data;

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
    console.log(this.dataSource)
  }
}

import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { Papa } from 'ngx-papaparse';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';



@Component({
  selector: 'app-cases-by-country',
  templateUrl: './cases-by-country.component.html',
  styleUrls: ['./cases-by-country.component.scss']
})


export class CasesByCountryComponent {

  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['country', 'confirmed', 'recovered', 'death'];

  rawCsvData: any[] = [];
  proccessedData: any[] = [];
  recoveredProccessedData: any[] = [];

  weekCases: any = []

  dataSource = new MatTableDataSource(this.proccessedData);

  constructor(private papa: Papa, private http: HttpClient, private _liveAnnouncer: LiveAnnouncer) {
    this.loadCsvReadConfirmed();
  }

  private loadCsvReadConfirmed() {
    this.http.get('../assets/confirmed.csv', { responseType: 'text' }).subscribe(
      data => this.extractData(data, 'confirmed')
    )
  }

  private loadCsvReadDeath() {
    this.http.get('../assets/death.csv', { responseType: 'text' }).subscribe(
      data => this.extractData(data, 'death')
    )
  }

  private loadCsvReadRecovered() {
    this.http.get('../assets/recovered.csv', { responseType: 'text' }).subscribe(
      data => this.extractData(data, 'recovered')
    )
  }



  private extractData(res: string, type: string) {
    this.rawCsvData.length = 0;
    if (type === 'death') {
      let csvData = res || '';
      this.papa.parse(csvData, {
        complete: parsedData => {
          this.rawCsvData = parsedData.data;
          this.rawCsvData.splice(0, 1)
          this.calTotaldeath();
        }
      });
    } else if (type === 'confirmed') {
      let csvData = res || '';
      this.papa.parse(csvData, {
        complete: parsedData => {
          this.rawCsvData = parsedData.data;
          this.rawCsvData.splice(0, 1)
          this.calTotalConfirmed();
        }
      });
    } else if (type == 'recovered') {
      let csvData = res || '';
      this.papa.parse(csvData, {
        complete: parsedData => {
          this.rawCsvData = parsedData.data;
          this.rawCsvData.splice(0, 1)
          this.calTotalRecovered();
        }
      });
    }

  }

  // This function is meant to calculate the sum of each row in CSV file (**Duplicated countries included)
  calTotaldeath() {
    let totalOfEach = 0;
    for (let j = 0; j < this.rawCsvData.length - 1; j++) {
      totalOfEach = 0;
      for (let i = 4; i < 577; i++) {
        totalOfEach = totalOfEach + +this.rawCsvData[j][i]
      }
      this.proccessedData[j].death = totalOfEach;
    }
    this.calTotalStat();
  }

  calTotalStat() {
    for (let i = 0; i < this.proccessedData.length - 1; i++) {
      if (this.proccessedData[i].country === this.proccessedData[i + 1].country) {
        this.proccessedData[i].confirmed = this.proccessedData[i].confirmed + this.proccessedData[i + 1].confirmed
        this.proccessedData[i].death = this.proccessedData[i].death + this.proccessedData[i + 1].death
        this.proccessedData.splice(i + 1, 1);
        i--;
      }
    }
    this.loadCsvReadRecovered();
  }

  // This function is meant to calculate the sum of each row in CSV file (**Duplicated countries included)
  calTotalConfirmed() {
    let totalOfEach = 0;
    for (let j = 0; j < this.rawCsvData.length - 1; j++) {
      totalOfEach = 0;
      for (let i = 4; i < 577; i++) {
        totalOfEach = totalOfEach + +this.rawCsvData[j][i]
      }
      this.proccessedData.push({ country: this.rawCsvData[j][1], confirmed: totalOfEach, death: 0, recovered: 0 });
    }
    this.loadCsvReadDeath();
  }

  // This function is meant to calculate the sum of each row in CSV file (**Duplicated countries included)
  calTotalRecovered() {
    let totalOfEach = 0;
    for (let j = 0; j < this.rawCsvData.length - 1; j++) {
      totalOfEach = 0;
      for (let i = 4; i < 577; i++) {
        totalOfEach = totalOfEach + +this.rawCsvData[j][i]
      }
      this.recoveredProccessedData.push({ country: this.rawCsvData[j][1], recovered: totalOfEach })
    }
    for (let i = 0; i < this.recoveredProccessedData.length - 1; i++) {
      if (this.recoveredProccessedData[i].country === this.recoveredProccessedData[i + 1].country) {
        this.recoveredProccessedData[i].recovered = this.recoveredProccessedData[i].recovered + this.recoveredProccessedData[i + 1].recovered;
        this.recoveredProccessedData.splice(i + 1, 1);
        i--;
      }
    }
    this.calWeeklyConfirmedCases();
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  calWeeklyConfirmedCases() {
    this.dataSource.sort = this.sort;
    this.dataMerger()
  }


  dataMerger() {
    for (let index = 0; index < this.recoveredProccessedData.length; index++) {
      const recoveredData = this.recoveredProccessedData[index];
      const confirmedData = this.proccessedData[index];
      confirmedData.recovered = recoveredData.recovered;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  title = 'Stavid19';

}


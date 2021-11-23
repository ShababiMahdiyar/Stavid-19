import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { Papa } from 'ngx-papaparse';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';


import { CountryComponent } from './country/country.component';
import { Cases } from '../interfaces/cases';



@Component({
  selector: 'app-cases-by-country',
  templateUrl: './cases-by-country.component.html',
  styleUrls: ['./cases-by-country.component.scss']
})




export class CasesByCountryComponent {

  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['country', 'confirmed', 'recovered', 'death'];

  confirmedCasesFile: string[] = [];
  recoveredCasesFile: string[] = [];
  deathCasesFile: string[] = [];

  rawCsvData: any[] = [];
  proccessedData: any[] = [];
  recoveredProccessedData: any[] = [];

  weekCases: any = []

  dataSource = new MatTableDataSource(this.proccessedData);

  constructor(

    private papa: Papa,
    private http: HttpClient,
    private _liveAnnouncer: LiveAnnouncer,
    public dialog: MatDialog
  ) {
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

      this.deathCasesFile.push(this.rawCsvData[j])

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
      this.confirmedCasesFile.push(this.rawCsvData[j])
      totalOfEach = 0;
      for (let i = 4; i < 577; i++) {
        totalOfEach = totalOfEach + +this.rawCsvData[j][i]
      }
      this.proccessedData.push(
        {
          country: this.rawCsvData[j][1],
          confirmed: totalOfEach,
          death: 0,
          recovered: 0,
          confirmedWeekly: [],
          recoveredWeekly: [],
          deathWeekly: [],
          confirmedMonthly: [],
          recoveredMonthly: [],
          deathMonthly: []
        });
    }
    this.loadCsvReadDeath();
    this.calConfirmedMonthlyCases();
  }

  // This function is meant to calculate the sum of each row in CSV file (**Duplicated countries included)
  calTotalRecovered() {
    let totalOfEach = 0;
    for (let j = 0; j < this.rawCsvData.length - 1; j++) {
      this.recoveredCasesFile.push(this.rawCsvData[j])

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
    this.calConfirmedWeeklyCases();

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


  openDialog(data: any, type: string) {
    let dialogRef = this.dialog.open(CountryComponent, {
      data: {
        type: type,
        country: data.country,
        confirmed: data.confirmed,
        recovered: data.recovered,
        death: data.death,
        confirmedWeekly: data.confirmedWeekly,
        recoveredWeekly: data.recoveredWeekly,
        deathWeekly: data.deathWeekly
      },
    });
  }


  calMonthlyCases() {

    // this.http.get('../assets/confirmed.csv', { responseType: 'text' }).subscribe(
    //   data => {
    //     let csvData = data || '';
    //     this.papa.parse(csvData, {
    //       complete: parsedData => {
    //         parsedData = parsedData.data
    //         console.log(parsedData)
    //         this.rawCsvData.splice(0, 1)
    //       }
    //     });
    //   }
    // )
    // console.log(this.rawCsvData);



    // const byCountry: any[] = [];
    // this.confirmedCasesFile.forEach((element, i) => {
    //   let index = 4
    //   byCountry.push([element[1]]);
    //   while (index < element.length) {
    //     let total = 0;
    //     if (index < 571) {
    //       for (let j = index; j <= index + 7; j++) {
    //         total = total + +element[j];
    //       }
    //     } else {
    //       for (let j = index; j <= index + 4; j++) {
    //         total = total + +element[j];
    //       }
    //     }
    //     index += 8;
    //     byCountry[i].push(total)
    //   }
    // });
  }

  calConfirmedMonthlyCases() {
    const byCountry: any[] = [];
    let merged;

    this.confirmedCasesFile.forEach((element) => {
      // const monthCases = {
      //   country: "",
      //   january20: 0,
      //   february20: 0,
      //   march20: 0,
      //   april20: 0,
      //   may20: 0,
      //   june20: 0,
      //   july20: 0,
      //   august20: 0,
      //   september20: 0,
      //   october20: 0,
      //   november20: 0,
      //   december20: 0,
      //   january21: 0,
      //   february21: 0,
      //   march21: 0,
      //   april21: 0,
      //   may21: 0,
      //   june21: 0,
      //   july21: 0,
      //   august21: 0
      // };

      let january20: number = 0;
      let february20: number = 0;
      let march20: number = 0;
      let april20: number = 0;
      let may20: number = 0;
      let june20: number = 0;
      let july20: number = 0;
      let august20: number = 0;
      let september20: number = 0;
      let october20: number = 0;
      let november20: number = 0;
      let december20: number = 0;
      let january21: number = 0;
      let february21: number = 0;
      let march21: number = 0;
      let april21: number = 0;
      let may21: number = 0;
      let june21: number = 0;
      let july21: number = 0;
      let august21: number = 0;


      for (let index = 4; index < 14; index++) {
        january20 = january20 + +element[index]
      }
      for (let index = 14; index < 43; index++) {
        february20 = february20 + +element[index]
      }
      for (let index = 43; index < 74; index++) {
        march20 = march20 + +element[index]
      }
      for (let index = 74; index < 104; index++) {
        april20 = april20 + +element[index]
      }
      for (let index = 104; index < 135; index++) {
        may20 = may20 + +element[index]
      }
      for (let index = 135; index < 165; index++) {
        june20 = june20 + +element[index]
      }
      for (let index = 165; index < 196; index++) {
        july20 = july20 + +element[index]
      }
      for (let index = 196; index < 227; index++) {
        august20 = august20 + +element[index]
      }
      for (let index = 227; index < 257; index++) {
        september20 = september20 + +element[index]
      }
      for (let index = 257; index < 288; index++) {
        october20 = october20 + +element[index]
      }
      for (let index = 288; index < 318; index++) {
        november20 = november20 + +element[index]
      }
      for (let index = 318; index < 349; index++) {
        december20 = december20 + +element[index]
      }
      for (let index = 349; index < 380; index++) {
        january21 = january21 + +element[index]
      }
      for (let index = 380; index < 408; index++) {
        february21 = february21 + +element[index]
      }
      for (let index = 408; index < 439; index++) {
        march21 = march21 + +element[index]
      }
      for (let index = 439; index < 469; index++) {
        april21 = april21 + +element[index]
      }
      for (let index = 469; index < 500; index++) {
        may21 = may21 + +element[index]
      }
      for (let index = 500; index < 530; index++) {
        june21 = june21 + +element[index]
      }
      for (let index = 530; index < 561; index++) {
        july21 = july21 + +element[index]
      }
      for (let index = 561; index < 577; index++) {
        august21 = august21 + +element[index]
      }


      byCountry.push([element[1], january20, february20, march20, april20, may20, june20, july20, august20, september20, october20, november20, december20, january21, february21, march21, april21, may21, june21, july21, august21]);



    });

    for (let i = 0; i < byCountry.length - 1; i++) {
      if (byCountry[i][0] === byCountry[i + 1][0]) {
        for (let index = 1; index < byCountry[i].length - 1; index++) {
          byCountry[i][index] = byCountry[i][index] + byCountry[i + 1][index]
        }
        byCountry.splice(i + 1, 1)
        i--;
      }
    }

    for (let i = 0; i < byCountry.length - 1; i++) {
      if (byCountry[i][0] === this.proccessedData[i].country) {
        byCountry[i].forEach((element: any) => {
          this.proccessedData[i].confirmedMonthly.push(element);
        });
      }
    }
    this.proccessedData.forEach(element => {
      element.confirmedMonthly.splice(0, 1);
    });

    console.log(this.proccessedData)
  }

  calConfirmedWeeklyCases() {
    const byCountry: any[] = [];
    this.confirmedCasesFile.forEach((element, i) => {
      let index = 4
      byCountry.push([element[1]]);
      while (index < element.length) {
        let total = 0;
        if (index < 571) {
          for (let j = index; j <= index + 7; j++) {
            total = total + +element[j];
          }
        } else {
          for (let j = index; j <= index + 4; j++) {
            total = total + +element[j];
          }
        }
        index += 8;
        byCountry[i].push(total)
      }
    });

    for (let i = 0; i < byCountry.length - 1; i++) {
      if (byCountry[i][0] === byCountry[i + 1][0]) {
        for (let index = 1; index < byCountry[i].length - 1; index++) {
          byCountry[i][index] = byCountry[i][index] + byCountry[i + 1][index]
        }
        byCountry.splice(i + 1, 1)
        i--;
      }
    }

    for (let i = 0; i < byCountry.length - 1; i++) {
      if (byCountry[i][0] === this.proccessedData[i].country) {
        byCountry[i].forEach((element: any) => {
          this.proccessedData[i].confirmedWeekly.push(element);
        });
      }
    }
    this.proccessedData.forEach(element => {
      element.confirmedWeekly.splice(0, 1);
    });

    this.calrecoveredWeeklyCases();
  }

  calrecoveredWeeklyCases() {
    const byCountry: any[] = [];
    console.log('hi')
    this.recoveredCasesFile.forEach((element, i) => {

      let index = 4
      byCountry.push([element[1]]);
      while (index < element.length) {
        let total = 0;
        if (index < 571) {
          for (let j = index; j <= index + 7; j++) {
            total = total + +element[j];
          }
        } else {
          for (let j = index; j <= index + 4; j++) {
            total = total + +element[j];
          }
        }
        index += 8;
        byCountry[i].push(total)
      }
    });

    for (let i = 0; i < byCountry.length - 1; i++) {
      if (byCountry[i][0] === byCountry[i + 1][0]) {
        for (let index = 1; index < byCountry[i].length - 1; index++) {
          byCountry[i][index] = byCountry[i][index] + byCountry[i + 1][index]
        }
        byCountry.splice(i + 1, 1)
        i--;
      }
    }

    for (let i = 0; i < byCountry.length - 1; i++) {
      if (byCountry[i][0] === this.proccessedData[i].country) {
        byCountry[i].forEach((element: any) => {
          this.proccessedData[i].recoveredWeekly.push(element);
        });
      }
    }
    this.proccessedData.forEach(element => {
      element.recoveredWeekly.splice(0, 1);
    });
    this.caldeathWeeklyCases()
  }
  caldeathWeeklyCases() {
    const byCountry: any[] = [];

    this.deathCasesFile.forEach((element, i) => {

      let index = 4
      byCountry.push([element[1]]);
      while (index < element.length) {
        let total = 0;
        if (index < 571) {
          for (let j = index; j <= index + 7; j++) {
            total = total + +element[j];
          }
        } else {
          for (let j = index; j <= index + 4; j++) {
            total = total + +element[j];
          }
        }
        index += 8;
        byCountry[i].push(total)
      }
    });

    for (let i = 0; i < byCountry.length - 1; i++) {
      if (byCountry[i][0] === byCountry[i + 1][0]) {
        for (let index = 1; index < byCountry[i].length - 1; index++) {
          byCountry[i][index] = byCountry[i][index] + byCountry[i + 1][index]
        }
        byCountry.splice(i + 1, 1)
        i--;
      }
    }

    for (let i = 0; i < byCountry.length - 1; i++) {
      if (byCountry[i][0] === this.proccessedData[i].country) {
        byCountry[i].forEach((element: any) => {
          this.proccessedData[i].deathWeekly.push(element);
        });
      }
    }

    // data clearance
    this.proccessedData.forEach(element => {
      element.deathWeekly.splice(0, 1);
      element.recoveredWeekly.splice(-1, 1);

    });

  }




  title = 'Stavid19';

}

